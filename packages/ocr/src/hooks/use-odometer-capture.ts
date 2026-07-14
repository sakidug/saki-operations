import { useCallback, useRef, useState } from 'react';

import {
  getDefaultOdometerOcrService,
  type OdometerOcrService,
} from '../service/odometer-ocr-service';
import type {
  AcceptedOdometerReading,
  OcrEngineResult,
  OcrProgressEvent,
  OdometerKind,
  OdometerPhotoEvidence,
} from '../types';
import { formatOdometerKm } from '../parse/odometer-parse';

export type OdometerCapturePhase =
  | 'idle'
  | 'capturing'
  | 'processing'
  | 'review'
  | 'editing'
  | 'accepted';

export type UseOdometerCaptureOptions = {
  service?: OdometerOcrService;
  kind?: OdometerKind;
  attachmentKey?: string | null;
  onAccepted?: (reading: AcceptedOdometerReading) => void;
};

export function useOdometerCapture(options: UseOdometerCaptureOptions = {}) {
  const service = options.service ?? getDefaultOdometerOcrService();
  const kind = options.kind ?? 'digital';

  const [phase, setPhase] = useState<OdometerCapturePhase>('idle');
  const [progress, setProgress] = useState<OcrProgressEvent | null>(null);
  const [photo, setPhoto] = useState<OdometerPhotoEvidence | null>(null);
  const [ocr, setOcr] = useState<OcrEngineResult | null>(null);
  const [draftValue, setDraftValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState<AcceptedOdometerReading | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (photo?.previewUrl) URL.revokeObjectURL(photo.previewUrl);
    setPhase('idle');
    setProgress(null);
    setPhoto(null);
    setOcr(null);
    setDraftValue('');
    setError(null);
    setAccepted(null);
  }, [photo?.previewUrl]);

  const startCapture = useCallback(async () => {
    setError(null);
    setAccepted(null);
    setPhase('capturing');
    abortRef.current = new AbortController();

    try {
      const result = await service.captureAndRecognize({
        kind,
        attachmentKey: options.attachmentKey,
        signal: abortRef.current.signal,
        onProgress: (event) => {
          setProgress(event);
          if (event.phase === 'recognizing' || event.phase === 'preprocessing') {
            setPhase('processing');
          }
        },
      });

      setPhoto(result.photo);
      setOcr(result.ocr);
      setDraftValue(result.ocr.value ?? '');
      // OCR failure → force manual entry while keeping the photo.
      setPhase(result.ocr.ok && result.ocr.value ? 'review' : 'editing');
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') {
        setPhase('idle');
        return;
      }
      setError(cause instanceof Error ? cause.message : 'Capture failed');
      setPhase('idle');
    } finally {
      setProgress(null);
      abortRef.current = null;
    }
  }, [kind, options.attachmentKey, service]);

  const beginEdit = useCallback(() => setPhase('editing'), []);

  const accept = useCallback(
    (manuallyEdited: boolean) => {
      if (!photo || !ocr) return;
      const digits = draftValue.replace(/\D/g, '');
      if (!digits) {
        setError('Enter an odometer value');
        return;
      }
      const reading = service.acceptReading({
        photo,
        ocr,
        value: digits,
        manuallyEdited,
      });
      setAccepted(reading);
      setPhase('accepted');
      options.onAccepted?.(reading);
    },
    [draftValue, ocr, options, photo, service],
  );

  const lowConfidence =
    ocr != null && (service.isLowConfidence(ocr.confidence) || !ocr.ok);

  return {
    phase,
    progress,
    photo,
    ocr,
    draftValue,
    setDraftValue,
    displayDraft: formatOdometerKm(draftValue) || draftValue,
    error,
    accepted,
    lowConfidence,
    lowConfidenceThreshold: service.lowConfidenceThreshold,
    startCapture,
    beginEdit,
    acceptOcrValue: () => accept(false),
    acceptEditedValue: () => accept(true),
    reset,
  };
}
