/**
 * Shared OCR contracts — not bound to Tours or HHCO.
 */

/** Supported odometer display families. Analog is prepared for a future provider. */
export type OdometerKind = 'digital' | 'analog';

export type OcrSyncStatus = 'local' | 'queued' | 'uploading' | 'synced' | 'failed';

export type OcrFailureReason =
  | 'provider_unavailable'
  | 'no_digits_found'
  | 'low_confidence'
  | 'cancelled'
  | 'unsupported_kind'
  | 'unknown';

export type OcrRawCandidate = {
  /** Digits only, e.g. "156482" */
  value: string;
  /** 0–100 */
  confidence: number;
  rawTextSnippet?: string;
};

/**
 * Result returned by any OCR provider.
 * Callers must not assume a specific vendor (Tesseract, cloud API, …).
 */
export type OcrEngineResult = {
  ok: boolean;
  kind: OdometerKind;
  /** Best candidate digits, or null when OCR failed */
  value: string | null;
  /** 0–100 confidence for `value` */
  confidence: number;
  candidates: OcrRawCandidate[];
  failureReason?: OcrFailureReason;
  /** Engine timing / debug — never required by UI */
  meta?: {
    providerId: string;
    durationMs: number;
    rawText?: string;
  };
};

export type OdometerPhotoEvidence = {
  /** Client-stable id for offline dedupe + future trip attach */
  clientLocalId: string;
  blob: Blob;
  mimeType: string;
  byteSize: number;
  capturedAt: string;
  /** Object URL for local preview (revoke when done) */
  previewUrl: string;
  fileName: string;
  syncStatus: OcrSyncStatus;
  /** Optional trip / delivery association filled by parent modules later */
  attachmentKey?: string | null;
};

export type AcceptedOdometerReading = {
  /** Canonical numeric kilometres (integer string without separators) */
  value: string;
  /** User-facing formatted value, e.g. "156,482" */
  displayValue: string;
  confidence: number;
  /** true when the user typed/edited rather than accepting OCR as-is */
  manuallyEdited: boolean;
  /** true when OCR failed or confidence was low and user confirmed */
  verifiedManually: boolean;
  photo: OdometerPhotoEvidence;
  ocr: OcrEngineResult;
};

export type OcrProgressEvent = {
  phase: 'opening_camera' | 'capturing' | 'preprocessing' | 'recognizing' | 'persisting' | 'done';
  progress?: number;
  message?: string;
};

/** Default warning threshold — below this, UI must nudge manual verification. */
export const OCR_LOW_CONFIDENCE_THRESHOLD = 75;
