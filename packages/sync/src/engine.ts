import { computeRetryDelayMs, sleep } from './backoff';
import { createUuid, getOrCreateDeviceId } from './device-id';
import { SyncIndexedDbRepository } from './repository';
import type {
  BatchAckItem,
  CreateSyncEventInput,
  SyncEngineStatus,
  SyncEvent,
  SyncFileRecord,
  SyncTransport,
} from './types';

const MAX_BATCH = 25;
const MAX_RETRIES = 12;

export type SyncEngineOptions = {
  transport: SyncTransport;
  getAccessToken: () => string | null;
  onStatusChange?: (status: SyncEngineStatus) => void;
  /** Called after each event ack (accepted / duplicate / conflict / rejected). */
  onEventAck?: (event: SyncEvent, ack: BatchAckItem) => void | Promise<void>;
};

/**
 * Offline-first event sync engine.
 * User actions → local durable event → background drain → server ack.
 */
export class SyncEngine {
  private readonly repo = new SyncIndexedDbRepository();
  private readonly transport: SyncTransport;
  private readonly getAccessToken: () => string | null;
  private readonly onStatusChange?: (status: SyncEngineStatus) => void;
  private readonly onEventAck?: (event: SyncEvent, ack: BatchAckItem) => void | Promise<void>;
  private draining = false;
  private drainQueued = false;
  private lastError: string | null = null;

  constructor(options: SyncEngineOptions) {
    this.transport = options.transport;
    this.getAccessToken = options.getAccessToken;
    this.onStatusChange = options.onStatusChange;
    this.onEventAck = options.onEventAck;
  }

  getDeviceId(): string {
    return getOrCreateDeviceId();
  }

  async enqueue(input: CreateSyncEventInput): Promise<SyncEvent> {
    const now = new Date().toISOString();
    const event: SyncEvent = {
      eventId: createUuid(),
      entityType: input.entityType,
      entityId: input.entityId,
      eventType: input.eventType,
      deviceId: this.getDeviceId(),
      userId: input.userId,
      timestamp: now,
      payload: input.payload,
      version: input.version ?? 1,
      retryCount: 0,
      syncStatus: 'pending',
      fileLocalId: input.fileLocalId ?? null,
      lastError: null,
      createdAt: now,
      updatedAt: now,
    };
    await this.repo.putEvent(event);
    await this.repo.putAudit({
      id: createUuid(),
      eventId: event.eventId,
      userId: event.userId,
      deviceId: event.deviceId,
      action: event.eventType,
      result: 'success',
      newValue: { status: 'pending', entityId: event.entityId },
      timestamp: now,
    });
    await this.emitStatus();
    void this.drain();
    return event;
  }

  async enqueueFile(input: {
    eventId?: string | null;
    mimeType: string;
    fileName: string;
    blob: Blob;
  }): Promise<SyncFileRecord> {
    const dataUrl = await blobToDataUrl(input.blob);
    const now = new Date().toISOString();
    const file: SyncFileRecord = {
      localId: createUuid(),
      eventId: input.eventId ?? null,
      mimeType: input.mimeType,
      fileName: input.fileName,
      byteSize: input.blob.size,
      dataUrl,
      syncStatus: 'pending',
      remoteUrl: null,
      remoteKey: null,
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    await this.repo.putFile(file);
    await this.emitStatus();
    void this.drain();
    return file;
  }

  async getStatus(): Promise<SyncEngineStatus> {
    const [pending, uploading, failed, conflict, retrying, lastSyncAt] =
      await Promise.all([
        this.repo.listEventsByStatus(['pending']),
        this.repo.listEventsByStatus(['uploading']),
        this.repo.listEventsByStatus(['failed']),
        this.repo.listEventsByStatus(['conflict']),
        this.repo.listEventsByStatus(['retrying']),
        this.repo.getMeta<string>('lastSyncAt'),
      ]);
    const pendingFiles = await this.repo.listFilesByStatus(['pending', 'retrying', 'failed']);
    return {
      pendingCount: pending.length + pendingFiles.length,
      uploadingCount: uploading.length,
      failedCount: failed.length,
      conflictCount: conflict.length,
      retryingCount: retrying.length,
      lastSyncAt,
      lastError: this.lastError,
      isDraining: this.draining,
    };
  }

  async retryFailed(): Promise<void> {
    const failed = await this.repo.listEventsByStatus(['failed', 'conflict']);
    const now = new Date().toISOString();
    for (const event of failed) {
      if (event.syncStatus === 'conflict') continue;
      event.syncStatus = 'pending';
      event.updatedAt = now;
      await this.repo.putEvent(event);
    }
    const failedFiles = await this.repo.listFilesByStatus(['failed']);
    for (const file of failedFiles) {
      file.syncStatus = 'pending';
      file.updatedAt = now;
      await this.repo.putFile(file);
    }
    await this.emitStatus();
    await this.drain();
  }

  async drain(): Promise<void> {
    if (this.draining) {
      this.drainQueued = true;
      return;
    }
    this.draining = true;
    await this.emitStatus();
    try {
      await this.drainFiles();
      await this.drainEvents();
      await this.repo.setMeta('lastSyncAt', new Date().toISOString());
      this.lastError = null;
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
    } finally {
      this.draining = false;
      await this.emitStatus();
      if (this.drainQueued) {
        this.drainQueued = false;
        void this.drain();
      }
    }
  }

  private async drainFiles(): Promise<void> {
    const token = this.getAccessToken();
    if (!token) return;

    const files = await this.repo.listFilesByStatus(['pending', 'retrying']);
    for (const file of files) {
      file.syncStatus = 'uploading';
      file.updatedAt = new Date().toISOString();
      await this.repo.putFile(file);
      try {
        const result = await this.transport.uploadFile(file, token);
        file.remoteUrl = result.remoteUrl;
        file.remoteKey = result.remoteKey;
        file.syncStatus = 'uploaded';
        file.updatedAt = new Date().toISOString();
        await this.repo.putFile(file);
      } catch (error) {
        file.retryCount += 1;
        file.lastError = error instanceof Error ? error.message : String(error);
        file.syncStatus = file.retryCount >= MAX_RETRIES ? 'failed' : 'retrying';
        file.updatedAt = new Date().toISOString();
        await this.repo.putFile(file);
        if (file.syncStatus === 'retrying') {
          await sleep(computeRetryDelayMs(file.retryCount));
        }
      }
    }
  }

  private async drainEvents(): Promise<void> {
    const token = this.getAccessToken();
    if (!token) return;

    let batch = await this.repo.listEventsByStatus(['pending', 'retrying']);
    while (batch.length > 0) {
      const slice = batch.slice(0, MAX_BATCH);
      for (const event of slice) {
        event.syncStatus = 'uploading';
        event.updatedAt = new Date().toISOString();
        await this.repo.putEvent(event);
      }

      try {
        const acks = await this.transport.uploadEvents(slice);
        const byId = new Map(acks.map((a) => [a.eventId, a]));
        for (const event of slice) {
          const ack = byId.get(event.eventId);
          const now = new Date().toISOString();
          if (!ack) {
            event.syncStatus = 'retrying';
            event.retryCount += 1;
            event.lastError = 'Missing ack';
            event.updatedAt = now;
            await this.repo.putEvent(event);
            continue;
          }
          if (ack.status === 'accepted' || ack.status === 'duplicate') {
            event.syncStatus = 'uploaded';
            event.lastError = null;
            event.updatedAt = now;
            await this.repo.putEvent(event);
            await this.repo.putAudit({
              id: createUuid(),
              eventId: event.eventId,
              userId: event.userId,
              deviceId: event.deviceId,
              action: `ack.${ack.status}`,
              result: ack.status === 'duplicate' ? 'duplicate' : 'success',
              timestamp: now,
            });
            await this.onEventAck?.(event, ack);
          } else if (ack.status === 'conflict') {
            event.syncStatus = 'conflict';
            event.lastError = ack.message ?? 'Conflict';
            event.updatedAt = now;
            await this.repo.putEvent(event);
            await this.repo.putAudit({
              id: createUuid(),
              eventId: event.eventId,
              userId: event.userId,
              deviceId: event.deviceId,
              action: 'ack.conflict',
              result: 'conflict',
              previousValue: { clientVersion: event.version },
              newValue: { serverVersion: ack.serverVersion },
              timestamp: now,
            });
          } else {
            event.retryCount += 1;
            event.syncStatus = event.retryCount >= MAX_RETRIES ? 'failed' : 'retrying';
            event.lastError = ack.message ?? 'Rejected';
            event.updatedAt = now;
            await this.repo.putEvent(event);
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.lastError = message;
        for (const event of slice) {
          event.retryCount += 1;
          event.syncStatus = event.retryCount >= MAX_RETRIES ? 'failed' : 'retrying';
          event.lastError = message;
          event.updatedAt = new Date().toISOString();
          await this.repo.putEvent(event);
        }
        await sleep(computeRetryDelayMs(1));
        break;
      }

      batch = await this.repo.listEventsByStatus(['pending', 'retrying']);
    }
  }

  private async emitStatus(): Promise<void> {
    if (!this.onStatusChange) return;
    this.onStatusChange(await this.getStatus());
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}

let defaultEngine: SyncEngine | null = null;

export function getDefaultSyncEngine(): SyncEngine {
  if (!defaultEngine) {
    throw new Error('SyncEngine not initialized — call setDefaultSyncEngine first');
  }
  return defaultEngine;
}

export function setDefaultSyncEngine(engine: SyncEngine | null): void {
  defaultEngine = engine;
}

export function tryGetDefaultSyncEngine(): SyncEngine | null {
  return defaultEngine;
}
