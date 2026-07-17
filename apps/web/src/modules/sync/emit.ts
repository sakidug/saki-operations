import type { CreateSyncEventInput, SyncEventType } from '@saki-operations/sync';
import { tryGetDefaultSyncEngine } from '@saki-operations/sync';

/**
 * Resolves the authenticated internal user id (AuthUser.id / JWT sub).
 * Set by SyncProvider — never use employeeId for SyncEvent.userId (KI-030 / C-01).
 */
let resolveAuthUserId: (() => string | null) | null = null;

export function setSyncAuthUserIdResolver(resolver: (() => string | null) | null): void {
  resolveAuthUserId = resolver;
}

export function getSyncAuthUserId(): string | null {
  return resolveAuthUserId?.() ?? null;
}

export type EmitSyncEventInput = Omit<CreateSyncEventInput, 'userId'> & {
  /**
   * Optional override — normally ignored in favour of the auth resolver.
   * Kept for tests only.
   */
  userId?: string;
  /** Workforce employee id — goes into payload, never into SyncEvent.userId */
  employeeId?: string;
};

/**
 * Fire-and-forget local enqueue. Never blocks the user on network.
 * Always stamps SyncEvent.userId from the authenticated AuthUser.id.
 */
export async function emitSyncEvent(input: EmitSyncEventInput): Promise<string | null> {
  const engine = tryGetDefaultSyncEngine();
  if (!engine) return null;

  const authUserId = resolveAuthUserId?.() ?? input.userId ?? null;
  if (!authUserId) return null;

  const payload: Record<string, unknown> = {
    ...input.payload,
  };
  if (input.employeeId) {
    payload.employeeId = input.employeeId;
  }

  try {
    const event = await engine.enqueue({
      entityType: input.entityType,
      entityId: input.entityId,
      eventType: input.eventType,
      userId: authUserId,
      payload,
      version: input.version,
      fileLocalId: input.fileLocalId,
    });
    return event.eventId;
  } catch {
    return null;
  }
}

export async function emitSyncFile(input: {
  eventId?: string | null;
  mimeType: string;
  fileName: string;
  blob: Blob;
}): Promise<string | null> {
  const engine = tryGetDefaultSyncEngine();
  if (!engine) return null;
  try {
    const file = await engine.enqueueFile(input);
    return file.localId;
  } catch {
    return null;
  }
}

export function operationEventType(
  kind: 'created' | 'started' | 'continued' | 'completed',
  moduleId: string,
): SyncEventType {
  if (moduleId === 'hhco') {
    if (kind === 'created' || kind === 'started') return 'delivery.started';
    if (kind === 'continued') return 'delivery.continued';
    return 'delivery.completed';
  }
  if (kind === 'created') return 'operation.created';
  if (kind === 'started') return 'operation.started';
  if (kind === 'continued') return 'operation.continued';
  return 'operation.completed';
}
