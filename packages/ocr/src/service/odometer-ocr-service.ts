import { capturePhotoFromCamera } from '../image/capture';
import { savePhotoToGallery } from '../image/gallery';
import {
  blobToDataUrl,
  enqueueEvidence,
} from '../offline/evidence-queue';
import { formatOdometerKm } from '../parse/odometer-parse';
import type { OcrProviderRegistry } from '../providers/registry';
import { createOcrProviderRegistry } from '../providers/registry';
import type {
  AcceptedOdometerReading,
  OcrEngineResult,
  OcrProgressEvent,
  OdometerKind,
  OdometerPhotoEvidence,
} from '../types';
import { OCR_LOW_CONFIDENCE_THRESHOLD } from '../types';

export type OdometerOcrServiceOptions = {
  registry?: OcrProviderRegistry;
  /** Save a gallery copy after capture (best-effort). Default false — intrusive on mobile. */
  saveToGallery?: boolean;
  /** Persist to offline IndexedDB queue. Default true. */
  enqueueOffline?: boolean;
  lowConfidenceThreshold?: number;
};

export type CaptureAndRecognizeOptions = {
  kind?: OdometerKind;
  attachmentKey?: string | null;
  signal?: AbortSignal;
  onProgress?: (event: OcrProgressEvent) => void;
};

function createClientLocalId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `ocr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function buildFileName(capturedAt: Date): string {
  const stamp = capturedAt.toISOString().replace(/[:.]/g, '-');
  return `odometer-${stamp}.jpg`;
}

/**
 * Module-agnostic odometer OCR facade used by Tours and HHCO later.
 */
export class OdometerOcrService {
  private readonly registry: OcrProviderRegistry;
  private readonly saveToGalleryEnabled: boolean;
  private readonly enqueueOfflineEnabled: boolean;
  readonly lowConfidenceThreshold: number;

  constructor(options: OdometerOcrServiceOptions = {}) {
    this.registry = options.registry ?? createOcrProviderRegistry();
    // Auto gallery download is intrusive on mobile and raced camera teardown;
    // callers can opt in. Offline queue remains on by default.
    this.saveToGalleryEnabled = options.saveToGallery === true;
    this.enqueueOfflineEnabled = options.enqueueOffline !== false;
    this.lowConfidenceThreshold =
      options.lowConfidenceThreshold ?? OCR_LOW_CONFIDENCE_THRESHOLD;
  }

  getRegistry(): OcrProviderRegistry {
    return this.registry;
  }

  isLowConfidence(confidence: number): boolean {
    return confidence < this.lowConfidenceThreshold;
  }

  /**
   * Full flow: camera → optional gallery save → preprocess/OCR → offline queue.
   * Does not accept/edit — UI calls {@link acceptReading} after user review.
   */
  async captureAndRecognize(options: CaptureAndRecognizeOptions = {}): Promise<{
    photo: OdometerPhotoEvidence;
    ocr: OcrEngineResult;
    gallerySaved: boolean;
  }> {
    const kind = options.kind ?? 'digital';
    const onProgress = options.onProgress;

    onProgress?.({ phase: 'opening_camera' });
    const captured = await capturePhotoFromCamera({ signal: options.signal });

    onProgress?.({ phase: 'capturing' });
    const capturedAt = new Date();
    const clientLocalId = createClientLocalId();
    const fileName = buildFileName(capturedAt);
    const mimeType = captured.file.type || 'image/jpeg';

    let gallerySaved = false;
    if (this.saveToGalleryEnabled) {
      onProgress?.({ phase: 'persisting', message: 'gallery' });
      try {
        const gallery = await savePhotoToGallery(captured.file, fileName);
        gallerySaved = gallery.ok;
      } catch {
        gallerySaved = false;
      }
    }

    onProgress?.({ phase: 'preprocessing' });
    const provider = this.registry.get(kind);
    onProgress?.({ phase: 'recognizing', progress: 0 });

    const ocr = await provider.recognize({
      image: captured.file,
      kind,
      signal: options.signal,
      onProgress: (progress) => onProgress?.({ phase: 'recognizing', progress }),
    });

    const photo: OdometerPhotoEvidence = {
      clientLocalId,
      blob: captured.file,
      mimeType,
      byteSize: captured.file.size,
      capturedAt: capturedAt.toISOString(),
      previewUrl: captured.previewUrl,
      fileName,
      syncStatus: 'local',
      attachmentKey: options.attachmentKey ?? null,
    };

    if (this.enqueueOfflineEnabled) {
      onProgress?.({ phase: 'persisting', message: 'offline_queue' });
      try {
        const dataUrl = await blobToDataUrl(captured.file);
        await enqueueEvidence({
          clientLocalId,
          fileName,
          mimeType,
          byteSize: captured.file.size,
          capturedAt: photo.capturedAt,
          attachmentKey: options.attachmentKey ?? null,
          dataUrl,
          odometerValue: ocr.value,
          confidence: ocr.ok ? ocr.confidence : null,
          syncStatus: 'queued',
        });
        photo.syncStatus = 'queued';
      } catch {
        // Capture + OCR must still succeed offline even if durable queue write fails.
        photo.syncStatus = 'local';
      }
    }

    onProgress?.({ phase: 'done', progress: 1 });
    return { photo, ocr, gallerySaved };
  }

  /**
   * Recognize an existing photo (re-process / alternate provider).
   */
  async recognizeBlob(
    blob: Blob,
    kind: OdometerKind = 'digital',
    signal?: AbortSignal,
  ): Promise<OcrEngineResult> {
    return this.registry.get(kind).recognize({ image: blob, kind, signal });
  }

  acceptReading(input: {
    photo: OdometerPhotoEvidence;
    ocr: OcrEngineResult;
    value: string;
    manuallyEdited: boolean;
  }): AcceptedOdometerReading {
    const digits = input.value.replace(/\D/g, '');
    const low = this.isLowConfidence(input.ocr.confidence) || !input.ocr.ok;

    return {
      value: digits,
      displayValue: formatOdometerKm(digits),
      confidence: input.ocr.confidence,
      manuallyEdited: input.manuallyEdited,
      verifiedManually: low || input.manuallyEdited,
      photo: input.photo,
      ocr: input.ocr,
    };
  }
}

let defaultService: OdometerOcrService | null = null;

/** Shared singleton — override in tests via {@link setDefaultOdometerOcrService}. */
export function getDefaultOdometerOcrService(): OdometerOcrService {
  if (!defaultService) defaultService = new OdometerOcrService();
  return defaultService;
}

export function setDefaultOdometerOcrService(service: OdometerOcrService | null): void {
  defaultService = service;
}
