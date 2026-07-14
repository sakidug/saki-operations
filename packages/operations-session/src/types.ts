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
  employeeId: string;
  vehicleId: string | null;
  startTime: string | null;
  endTime: string | null;
  /** Milliseconds; null until computable */
  workingDurationMs: number | null;
  startOdometer: number | null;
  endOdometer: number | null;
  /** Total KM; null until computable */
  totalKm: number | null;
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
  customFields?: SessionCustomFields;
};

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
