/**
 * Operations Session Engine contracts.
 * Module-agnostic — never imports Tours / HHCO business rules.
 */

/** Canonical session lifecycle. */
export type OperationsSessionStatus =
  | 'draft'
  | 'started'
  | 'in_progress'
  | 'completed'
  | 'synced';

/**
 * Owning product surface. Extensible string so future modules can register without engine changes.
 * Known values today: `saki_tours` | `hhco`
 */
export type OperationsModuleId = 'saki_tours' | 'hhco' | (string & {});

/** Offline / upload pipeline status for sessions and evidence. */
export type OfflineStatus = 'local' | 'queued' | 'conflict';
export type UploadStatus = 'pending' | 'uploading' | 'synced' | 'failed';

/**
 * Built-in evidence type ids. Modules may pass any string; these are conventions only.
 */
export const BUILTIN_EVIDENCE_TYPES = {
  startOdometer: 'start_odometer',
  endOdometer: 'end_odometer',
  startTime: 'start_time',
  endTime: 'end_time',
} as const;

export type BuiltinEvidenceType =
  (typeof BUILTIN_EVIDENCE_TYPES)[keyof typeof BUILTIN_EVIDENCE_TYPES];

/** Extensible evidence type — prefer builtins for odometer/time, free-form for module needs. */
export type EvidenceTypeId = BuiltinEvidenceType | (string & {});

export type EvidenceOcrMeta = {
  /** Value returned by OCR before user confirmation */
  ocrValue: string | null;
  /** Value stored after Accept / Edit */
  finalValue: string | null;
  /** 0–100 */
  confidence: number | null;
  manuallyEdited: boolean;
};

export type SessionEvidenceItem = {
  id: string;
  sessionId: string;
  type: EvidenceTypeId;
  /** Durable offline blob (data URL) */
  photoDataUrl: string | null;
  mimeType: string | null;
  byteSize: number | null;
  fileName: string | null;
  timestamp: string;
  offlineStatus: OfflineStatus;
  uploadStatus: UploadStatus;
  ocr: EvidenceOcrMeta | null;
  /** Module-specific extras without schema changes */
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

/**
 * Arbitrary module payload. Tours and HHCO store their own keys here.
 * Core engine never interprets these.
 */
export type SessionCustomFields = Record<string, unknown>;

export type OperationsSession = {
  id: string;
  status: OperationsSessionStatus;
  moduleId: OperationsModuleId;
  /**
   * Authenticated operator / session owner (JWT user workforce id).
   * Distinct from V2 selectable `driverId` when an admin starts an op for a crew.
   */
  employeeId: string;
  vehicleId: string | null;
  /** Operations V2 — company scope for the operation */
  companyId: string | null;
  /** Operations V2 — selected driver (may differ from `employeeId`) */
  driverId: string | null;
  /** Operations V2 — selected assistant employee ids */
  assistantIds: string[];
  /** Operations V2 — logged-in admin/operator who started the operation */
  operatorId: string | null;
  startTime: string | null;
  endTime: string | null;
  /** Milliseconds; null until computable */
  workingDurationMs: number | null;
  startOdometer: number | null;
  endOdometer: number | null;
  /** Total KM; null until computable */
  totalKm: number | null;
  /** Operations V2 — distance in KM, calculated when the operation completes */
  distanceKm: number | null;
  customFields: SessionCustomFields;
  evidenceIds: string[];
  offlineStatus: OfflineStatus;
  uploadStatus: UploadStatus;
  /** Incremented on every durable write — aids conflict detection later */
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateSessionInput = {
  moduleId: OperationsModuleId;
  employeeId: string;
  vehicleId?: string | null;
  companyId?: string | null;
  driverId?: string | null;
  assistantIds?: readonly string[];
  operatorId?: string | null;
  customFields?: SessionCustomFields;
};

/**
 * Statuses that occupy a vehicle for Operations V2.
 * Model support for “one active operation per vehicle” — enforcement is deferred.
 */
export const VEHICLE_OCCUPYING_SESSION_STATUSES: readonly OperationsSessionStatus[] = [
  'started',
  'in_progress',
];

export function isVehicleOccupyingSessionStatus(
  status: OperationsSessionStatus,
): boolean {
  return (VEHICLE_OCCUPYING_SESSION_STATUSES as readonly string[]).includes(status);
}

/** Normalize legacy IndexedDB rows that predate V2 crew / company fields. */
export function normalizeOperationsSession(
  session: OperationsSession,
): OperationsSession {
  return {
    ...session,
    companyId: session.companyId ?? null,
    driverId: session.driverId ?? null,
    assistantIds: Array.isArray(session.assistantIds) ? [...session.assistantIds] : [],
    operatorId: session.operatorId ?? null,
    distanceKm: session.distanceKm ?? session.totalKm ?? null,
  };
}

export type SessionTransition =
  | 'start'
  | 'mark_in_progress'
  | 'complete'
  | 'mark_synced';

export const SESSION_STATUS_TRANSITIONS: Record<
  OperationsSessionStatus,
  readonly OperationsSessionStatus[]
> = {
  draft: ['started'],
  started: ['in_progress', 'completed'],
  in_progress: ['completed'],
  completed: ['synced'],
  synced: [],
};

export function canTransitionSessionStatus(
  from: OperationsSessionStatus,
  to: OperationsSessionStatus,
): boolean {
  return SESSION_STATUS_TRANSITIONS[from].includes(to);
}

/** Sessions treated as unfinished for crash recovery. */
export const UNFINISHED_SESSION_STATUSES: readonly OperationsSessionStatus[] = [
  'draft',
  'started',
  'in_progress',
];

export function isUnfinishedSessionStatus(status: OperationsSessionStatus): boolean {
  return (UNFINISHED_SESSION_STATUSES as readonly string[]).includes(status);
}

/**
 * Whether a session currently occupies its vehicle (V2 uniqueness candidate).
 * Does not enforce uniqueness — callers decide when to block starts.
 */
export function sessionOccupiesVehicle(session: OperationsSession): boolean {
  return (
    Boolean(session.vehicleId) && isVehicleOccupyingSessionStatus(session.status)
  );
}
