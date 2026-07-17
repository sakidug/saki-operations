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
    passes?: number;
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

/**
 * How the final confirmed kilometres were produced.
 * Calculations / reports must use {@link AcceptedOdometerReading.value} only.
 */
export type OdometerValueSource = 'ocr' | 'manual';

export type AcceptedOdometerReading = {
  /** Canonical numeric kilometres (integer string without separators) — FINAL confirmed */
  value: string;
  /** User-facing formatted value, e.g. "156,482" */
  displayValue: string;
  /** OCR engine confidence for the detected suggestion (0–100) */
  confidence: number;
  /** Value OCR proposed before confirmation (may differ from `value`) */
  ocrDetectedValue: string | null;
  /** true when the user typed/edited rather than accepting OCR as-is */
  manuallyEdited: boolean;
  /** true when OCR failed or confidence was below threshold and user confirmed */
  verifiedManually: boolean;
  /** Whether the final confirmed value came from OCR accept or manual entry */
  source: OdometerValueSource;
  photo: OdometerPhotoEvidence;
  ocr: OcrEngineResult;
};

export type OcrProgressEvent = {
  phase:
    | 'opening_camera'
    | 'capturing'
    | 'persisting'
    | 'preprocessing'
    | 'recognizing'
    | 'done';
  progress?: number;
  message?: string;
};

/**
 * Below this confidence the UI must never treat OCR as trusted:
 * Accept stays disabled until the driver edits / confirms manually.
 */
export const OCR_LOW_CONFIDENCE_THRESHOLD = 95;
