/**
 * Saki Sync — event contracts (Phase 9.2).
 * Events are the unit of synchronization — never full record dumps.
 */

export type SyncEntityType =
  | 'operation'
  | 'delivery'
  | 'evidence'
  | 'odometer'
  | 'leave'
  | 'vehicle'
  | 'employee'
  | 'file'
  | 'system';

export type SyncEventType =
  | 'operation.created'
  | 'operation.started'
  | 'operation.continued'
  | 'operation.completed'
  | 'delivery.started'
  | 'delivery.continued'
  | 'delivery.completed'
  | 'photo.added'
  | 'ocr.updated'
  | 'odometer.confirmed'
  | 'leave.requested'
  | 'leave.approved'
  | 'leave.rejected'
  | 'vehicle.updated'
  | 'employee.updated'
  | 'file.uploaded'
  | 'sync.heartbeat';

export type SyncStatus =
  | 'pending'
  | 'uploading'
  | 'uploaded'
  | 'conflict'
  | 'failed'
  | 'retrying'
  | 'cancelled';

export type SyncEvent = {
  eventId: string;
  entityType: SyncEntityType;
  entityId: string;
  eventType: SyncEventType;
  deviceId: string;
  userId: string;
  /** ISO-8601 UTC */
  timestamp: string;
  payload: Record<string, unknown>;
  /** Optimistic concurrency / entity revision at emit time */
  version: number;
  retryCount: number;
  syncStatus: SyncStatus;
  /** Optional linked local file blob id waiting upload */
  fileLocalId?: string | null;
  lastError?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SyncFileRecord = {
  localId: string;
  eventId: string | null;
  mimeType: string;
  fileName: string;
  byteSize: number;
  /** data URL or object URL — stored as data URL in IDB for durability */
  dataUrl: string;
  syncStatus: SyncStatus;
  remoteUrl?: string | null;
  remoteKey?: string | null;
  retryCount: number;
  lastError?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SyncAuditEntry = {
  id: string;
  eventId: string;
  userId: string;
  deviceId: string;
  action: string;
  result: 'success' | 'conflict' | 'failed' | 'duplicate';
  previousValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  timestamp: string;
};

export type SyncEngineStatus = {
  pendingCount: number;
  uploadingCount: number;
  failedCount: number;
  conflictCount: number;
  retryingCount: number;
  lastSyncAt: string | null;
  lastError: string | null;
  isDraining: boolean;
};

export type CreateSyncEventInput = {
  entityType: SyncEntityType;
  entityId: string;
  eventType: SyncEventType;
  userId: string;
  payload: Record<string, unknown>;
  version?: number;
  fileLocalId?: string | null;
};

export type BatchAckItem = {
  eventId: string;
  status: 'accepted' | 'duplicate' | 'conflict' | 'rejected';
  serverVersion?: number;
  message?: string;
};

export type SyncTransport = {
  uploadEvents: (events: SyncEvent[]) => Promise<BatchAckItem[]>;
  uploadFile: (file: SyncFileRecord, accessToken: string) => Promise<{
    remoteUrl: string;
    remoteKey: string;
  }>;
  pullDelta: (since: string | null) => Promise<{
    events: SyncEvent[];
    serverTime: string;
  }>;
};
