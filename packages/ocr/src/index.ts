/**
 * @saki-operations/ocr
 * Replaceable OCR foundation for odometer photo capture.
 * Shared by Saki Tours Operations and HHCO — not tied to either module.
 */

export type {
  AcceptedOdometerReading,
  OcrEngineResult,
  OcrFailureReason,
  OcrProgressEvent,
  OcrRawCandidate,
  OcrSyncStatus,
  OdometerKind,
  OdometerPhotoEvidence,
  OdometerValueSource,
} from './types';
export { OCR_LOW_CONFIDENCE_THRESHOLD } from './types';

export type { OcrProvider, OcrRecognizeInput } from './providers/ocr-provider';
export { createDigitalOdometerProvider } from './providers/digital-odometer-provider';
export { createAnalogOdometerProvider } from './providers/analog-odometer-provider';
export {
  createOcrProviderRegistry,
  type OcrProviderRegistry,
} from './providers/registry';

export {
  OdometerOcrService,
  getDefaultOdometerOcrService,
  setDefaultOdometerOcrService,
  type CaptureAndRecognizeOptions,
  type OdometerOcrServiceOptions,
} from './service/odometer-ocr-service';

export { capturePhotoFromCamera, type CapturedPhoto, type CapturePhotoOptions } from './image/capture';
export { savePhotoToGallery, type GallerySaveResult } from './image/gallery';
export { preprocessForDigitalOdometer, blobToImageBitmap, canvasToBlob, materializeFile, normalizeCapturedImage } from './image/preprocess';


export {
  enqueueEvidence,
  listQueuedEvidence,
  updateEvidenceSyncStatus,
  attachEvidenceToParent,
  blobToDataUrl,
  dataUrlToBlob,
  type QueuedEvidenceRecord,
} from './offline/evidence-queue';

export {
  formatOdometerKm,
  parseOdometerCandidates,
  pickBestCandidate,
  stripToDigits,
  mergeOcrCandidates,
  scoreCandidateWithHints,
  repairDigitConfusions,
} from './parse/odometer-parse';

export {
  validateOdometerReading,
  UNUSUAL_JUMP_KM,
  type OdometerValidationCode,
  type OdometerValidationResult,
} from './parse/odometer-validate';

export { useOdometerCapture, type UseOdometerCaptureOptions, type OdometerCapturePhase } from './hooks/use-odometer-capture';
export { OdometerCapture, type OdometerCaptureProps } from './components/odometer-capture';
export { NumericKeypad } from './components/numeric-keypad';
