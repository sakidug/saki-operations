import {
  BadRequestException,
  Injectable,
  Logger,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, SyncAckStatus } from '@prisma/client';
import type { AuthUser } from '@saki-operations/types';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { SyncEventDto } from './dto/sync.dto';
import { SYNC_MAX_BATCH_EVENTS, SYNC_MAX_FILE_BYTES } from './sync.constants';

export type AckResult = {
  eventId: string;
  status: 'accepted' | 'duplicate' | 'conflict' | 'rejected';
  serverVersion?: number;
  message?: string;
};

export { SYNC_MAX_BATCH_EVENTS, SYNC_MAX_FILE_BYTES };

/** Allowlisted sync event types (H-03). */
const ALLOWED_EVENT_TYPES = new Set([
  'operation.created',
  'operation.started',
  'operation.continued',
  'operation.completed',
  'delivery.started',
  'delivery.continued',
  'delivery.completed',
  'photo.added',
  'ocr.updated',
  'odometer.confirmed',
  'leave.requested',
  'leave.approved',
  'leave.rejected',
  'vehicle.updated',
  'employee.updated',
  'file.uploaded',
  'sync.heartbeat',
]);

const SAFE_LOCAL_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const SAFE_MIME = /^[a-z0-9][a-z0-9!#$&\-^_.+]{0,126}\/[a-z0-9][a-z0-9!#$&\-^_.+]{0,126}$/i;

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async ingestBatch(user: AuthUser, events: SyncEventDto[]): Promise<AckResult[]> {
    if (events.length > SYNC_MAX_BATCH_EVENTS) {
      throw new PayloadTooLargeException(
        `Batch exceeds maximum of ${SYNC_MAX_BATCH_EVENTS} events`,
      );
    }
    const results: AckResult[] = [];
    for (const event of events) {
      results.push(await this.ingestOne(user, event));
    }
    return results;
  }

  private async ingestOne(user: AuthUser, event: SyncEventDto): Promise<AckResult> {
    // C-01 / KI-030 — authenticate identity from JWT only; never trust client userId.
    const userId = user.id;

    if (!ALLOWED_EVENT_TYPES.has(event.eventType)) {
      return {
        eventId: event.eventId,
        status: 'rejected',
        message: 'Unknown or disallowed eventType',
      };
    }

    // H-03 — leave decisions require leave.manage (office/admin grants).
    if (event.eventType === 'leave.approved' || event.eventType === 'leave.rejected') {
      if (!user.permissions.includes('leave.manage')) {
        return {
          eventId: event.eventId,
          status: 'rejected',
          message: 'Insufficient permission for leave decision events',
        };
      }
    }

    const existing = await this.prisma.syncEventRecord.findUnique({
      where: { eventId: event.eventId },
    });
    if (existing) {
      await this.writeAudit({
        eventId: event.eventId,
        userId,
        deviceId: event.deviceId,
        action: 'ingest.duplicate',
        result: 'duplicate',
      });
      return { eventId: event.eventId, status: 'duplicate', serverVersion: existing.version };
    }

    const state = await this.prisma.syncEntityState.findUnique({
      where: {
        entityType_entityId: {
          entityType: event.entityType,
          entityId: event.entityId,
        },
      },
    });

    const serverVersion = state?.version ?? 0;
    // Optimistic concurrency: reject stale client versions (allow equal for first write).
    if (state && event.version < serverVersion) {
      await this.prisma.syncEventRecord.create({
        data: {
          eventId: event.eventId,
          entityType: event.entityType,
          entityId: event.entityId,
          eventType: event.eventType,
          deviceId: event.deviceId,
          userId,
          occurredAt: new Date(event.timestamp),
          payload: event.payload as object,
          version: event.version,
          ackStatus: SyncAckStatus.conflict,
        },
      });
      await this.writeAudit({
        eventId: event.eventId,
        userId,
        deviceId: event.deviceId,
        action: 'ingest.conflict',
        result: 'conflict',
        previousValue: { serverVersion },
        newValue: { clientVersion: event.version },
      });
      return {
        eventId: event.eventId,
        status: 'conflict',
        serverVersion,
        message: 'Stale entity version',
      };
    }

    const appliedVersion = state ? serverVersion + 1 : Math.max(1, event.version);

    // Preserve workforce employeeId in payload when client sent a legacy SyncEvent.userId.
    const payload: Record<string, unknown> = {
      ...(event.payload ?? {}),
    };
    if (
      typeof event.userId === 'string' &&
      event.userId !== userId &&
      payload.employeeId == null
    ) {
      payload.clientUserId = event.userId;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.syncEventRecord.create({
        data: {
          eventId: event.eventId,
          entityType: event.entityType,
          entityId: event.entityId,
          eventType: event.eventType,
          deviceId: event.deviceId,
          userId,
          occurredAt: new Date(event.timestamp),
          payload: payload as object,
          version: appliedVersion,
          ackStatus: SyncAckStatus.accepted,
        },
      });
      await tx.syncEntityState.upsert({
        where: {
          entityType_entityId: {
            entityType: event.entityType,
            entityId: event.entityId,
          },
        },
        create: {
          entityType: event.entityType,
          entityId: event.entityId,
          version: appliedVersion,
          lastEventId: event.eventId,
          lastDeviceId: event.deviceId,
          lastUserId: userId,
        },
        update: {
          version: appliedVersion,
          lastEventId: event.eventId,
          lastDeviceId: event.deviceId,
          lastUserId: userId,
        },
      });
    });

    await this.writeAudit({
      eventId: event.eventId,
      userId,
      deviceId: event.deviceId,
      action: event.eventType,
      result: 'success',
      newValue: { version: appliedVersion, entityId: event.entityId },
    });

    return {
      eventId: event.eventId,
      status: 'accepted',
      serverVersion: appliedVersion,
    };
  }

  async pullDelta(userId: string, since?: string) {
    const sinceDate = since ? new Date(since) : new Date(0);
    const rows = await this.prisma.syncEventRecord.findMany({
      where: {
        userId,
        createdAt: { gt: sinceDate },
        ackStatus: SyncAckStatus.accepted,
      },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });

    return {
      serverTime: new Date().toISOString(),
      events: rows.map((row) => ({
        eventId: row.eventId,
        entityType: row.entityType,
        entityId: row.entityId,
        eventType: row.eventType,
        deviceId: row.deviceId,
        userId: row.userId,
        timestamp: row.occurredAt.toISOString(),
        payload: row.payload as Record<string, unknown>,
        version: row.version,
        retryCount: 0,
        syncStatus: 'uploaded' as const,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.createdAt.toISOString(),
      })),
    };
  }

  async storeBlob(input: {
    userId: string;
    localId: string;
    mimeType: string;
    fileName: string;
    buffer: Buffer;
    eventId?: string;
  }) {
    this.assertSafeUploadMeta(input);

    if (input.buffer.byteLength > SYNC_MAX_FILE_BYTES) {
      throw new PayloadTooLargeException(
        `File exceeds maximum of ${SYNC_MAX_FILE_BYTES} bytes`,
      );
    }
    if (input.buffer.byteLength === 0) {
      throw new BadRequestException('Empty upload rejected');
    }

    const existing = await this.prisma.syncBlob.findUnique({
      where: { localId: input.localId },
    });
    if (existing) {
      if (existing.userId !== input.userId) {
        throw new BadRequestException('Duplicate localId owned by another user');
      }
      return {
        remoteKey: existing.storageKey,
        remoteUrl: existing.publicUrl ?? `/api/v1/sync/files/${existing.id}`,
      };
    }

    // C-02 / KI-031 — never use client localId or fileName in the filesystem path.
    const objectId = randomUUID();
    const storageKey = path.posix.join(input.userId, objectId);
    const root = path.resolve(
      this.config.get<string>('SYNC_UPLOAD_DIR') ||
        path.resolve(process.cwd(), '../../storage/uploads/sync'),
    );
    const fullPath = path.resolve(root, storageKey);
    if (!fullPath.startsWith(root + path.sep) && fullPath !== root) {
      throw new BadRequestException('Invalid storage path');
    }

    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, input.buffer);

    const displayName = this.sanitizeDisplayName(input.fileName);

    const blob = await this.prisma.syncBlob.create({
      data: {
        localId: input.localId,
        userId: input.userId,
        mimeType: input.mimeType.toLowerCase(),
        fileName: displayName,
        byteSize: input.buffer.byteLength,
        storageKey,
        publicUrl: `/api/v1/sync/files/by-local/${encodeURIComponent(input.localId)}`,
        eventId: input.eventId,
      },
    });

    this.logger.log(`Stored sync blob ${blob.id} (${blob.byteSize} bytes)`);
    return {
      remoteKey: blob.storageKey,
      remoteUrl: blob.publicUrl ?? `/api/v1/sync/files/${blob.id}`,
    };
  }

  private assertSafeUploadMeta(input: {
    localId: string;
    mimeType: string;
    fileName: string;
  }) {
    if (!SAFE_LOCAL_ID.test(input.localId)) {
      throw new BadRequestException('Invalid localId');
    }
    if (
      input.localId.includes('..') ||
      input.localId.includes('/') ||
      input.localId.includes('\\') ||
      input.localId.includes('\0')
    ) {
      throw new BadRequestException('Path traversal rejected');
    }
    if (!SAFE_MIME.test(input.mimeType) || input.mimeType.length > 128) {
      throw new BadRequestException('Invalid mimeType');
    }
    if (
      !input.fileName ||
      input.fileName.length > 255 ||
      input.fileName.includes('\0') ||
      input.fileName.includes('/') ||
      input.fileName.includes('\\') ||
      input.fileName.includes('..')
    ) {
      throw new BadRequestException('Invalid fileName');
    }
  }

  private sanitizeDisplayName(fileName: string): string {
    const base = fileName.replace(/[^\w.\-]+/g, '_').slice(0, 180);
    return base.length > 0 ? base : 'upload.bin';
  }

  private async writeAudit(input: {
    eventId: string;
    userId: string;
    deviceId: string;
    action: string;
    result: string;
    previousValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
  }) {
    await this.prisma.syncAuditLog.create({
      data: {
        eventId: input.eventId,
        userId: input.userId,
        deviceId: input.deviceId,
        action: input.action,
        result: input.result,
        previousValue:
          (input.previousValue as Prisma.InputJsonValue | undefined) ?? undefined,
        newValue: (input.newValue as Prisma.InputJsonValue | undefined) ?? undefined,
      },
    });
  }
}
