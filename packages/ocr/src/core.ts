/**
 * Headless OCR / evidence APIs (no React).
 * Prefer this entry from non-UI packages (e.g. operations-session).
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
} from './parse/odometer-parse';
