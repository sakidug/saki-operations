/**
 * @saki-operations/operations-session
 * Reusable Operations Session Engine for Saki Tours + HHCO (no module UI).
 */

export type {
  BuiltinEvidenceType,
  CreateSessionInput,
  EvidenceOcrMeta,
  EvidenceTypeId,
  OfflineStatus,
  OperationsModuleId,
  OperationsSession,
  OperationsSessionStatus,
  SessionCustomFields,
  SessionEvidenceItem,
  SessionTransition,
  UploadStatus,
} from './types';

export {
  BUILTIN_EVIDENCE_TYPES,
  SESSION_STATUS_TRANSITIONS,
  UNFINISHED_SESSION_STATUSES,
  canTransitionSessionStatus,
  isUnfinishedSessionStatus,
} from './types';

export {
  calculateTotalKm,
  calculateWorkingHours,
  parseOdometerNumber,
  type TotalKmResult,
  type WorkingHoursResult,
} from './calculations';

export {
  createEmptyHooks,
  runValidators,
  type SessionExtensionHooks,
  type SessionValidationContext,
  type SessionValidator,
} from './extensions';

export {
  createIndexedDbSessionRepository,
  type SessionRepository,
} from './storage/indexed-db-repository';

export {
  OperationsSessionEngine,
  getDefaultOperationsSessionEngine,
  setDefaultOperationsSessionEngine,
  type AddEvidenceInput,
  type AttachOdometerReadingInput,
  type OperationsSessionEngineOptions,
} from './engine';
