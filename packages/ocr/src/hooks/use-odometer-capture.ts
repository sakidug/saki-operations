import { useCallback, useMemo, useRef, useState } from 'react';

import {
  getDefaultOdometerOcrService,
  type OdometerOcrService,
} from '../service/odometer-ocr-service';
import {
  validateOdometerReading,
  type OdometerValidationResult,
} from '../parse/odometer-validate';
import type {
  AcceptedOdometerReading,
  OcrEngineResult,
  OcrProgressEvent,
  OdometerKind,
  OdometerPhotoEvidence,
} from '../types';
import { formatOdometerKm } from '../parse/odometer-parse';
import { OCR_LOW_CONFIDENCE_THRESHOLD } from '../types';

export type OdometerCapturePhase =
  | 'idle'
  | 'capturing'
  | 'saving'
  | 'processing'
  | 'review'
  | 'editing'
  | 'accepted';

export type UseOdometerCaptureOptions = {
  service?: OdometerOcrService;
  kind?: OdometerKind;
  attachmentKey?: string | null;
  /** Last known odometer KM for validation / OCR bias (start reading on end capture). */
  previousOdometerKm?: number | null;
  onAccepted?: (reading: AcceptedOdometerReading) => void;
};

export function useOdometerCapture(options: UseOdometerCaptureOptions = {}) {
  const service = options.service ?? getDefaultOdometerOcrService();
  const kind = options.kind ?? 'digital';
  const previousOdometerKm = options.previousOdometerKm ?? null;

  const [phase, setPhase] = useState<OdometerCapturePhase>('idle');
  const [progress, setProgress] = useState<OcrProgressEvent | null>(null);
  const [photo, setPhoto] = useState<OdometerPhotoEvidence | null>(null);
  const [ocr, setOcr] = useState<OcrEngineResult | null>(null);
  const [draftValue, setDraftValueState] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState<AcceptedOdometerReading | null>(null);
  const [ackWarning, setAckWarning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const photoRef = useRef<OdometerPhotoEvidence | null>(null);

  const setDraftValue = useCallback((next: string) => {
    setDraftValueState(next.replace(/\D/g, ''));
    setAckWarning(false);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (photoRef.current?.previewUrl) URL.revokeObjectURL(photoRef.current.previewUrl);
    photoRef.current = null;
    setPhase('idle');
    setProgress(null);
    setPhoto(null);
    setOcr(null);
    setDraftValueState('');
    setError(null);
    setAccepted(null);
    setAckWarning(false);
  }, []);

  const startCapture = useCallback(async () => {
    setError(null);
    setAccepted(null);
    setAckWarning(false);
    setPhase('capturing');
    abortRef.current = new AbortController();

    try {
      const result = await service.captureAndRecognize({
        kind,
        attachmentKey: options.attachmentKey,
        previousOdometerKm,
        signal: abortRef.current.signal,
        onPhotoReady: (readyPhoto) => {
          if (photoRef.current?.previewUrl && photoRef.current.previewUrl !== readyPhoto.previewUrl) {
            URL.revokeObjectURL(photoRef.current.previewUrl);
          }
          photoRef.current = readyPhoto;
          setPhoto(readyPhoto);
          setPhase('saving');
        },
        onProgress: (event) => {
          setProgress(event);
          if (event.phase === 'persisting') setPhase('saving');
          if (event.phase === 'recognizing' || event.phase === 'preprocessing') {
            setPhase('processing');
          }
        },
      });

      if (photoRef.current?.previewUrl && photoRef.current.previewUrl !== result.photo.previewUrl) {
        URL.revokeObjectURL(photoRef.current.previewUrl);
      }
      photoRef.current = result.photo;
      setPhoto(result.photo);
      setOcr(result.ocr);
      setDraftValueState(result.ocr.value ?? '');
      setAckWarning(false);

      if (result.ocr.ok && result.ocr.value && !service.isLowConfidence(result.ocr.confidence)) {
        const gate = validateOdometerReading(result.ocr.value, previousOdometerKm);
        setPhase(gate.requiresConfirmation ? 'editing' : 'review');
      } else {
        setPhase('editing');
      }
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') {
        setPhase(photoRef.current ? 'editing' : 'idle');
        return;
      }
      const raw = cause instanceof Error ? cause.message : 'Capture failed';
      const friendly =
        /I\/O read operation failed|NotReadableError|Could not read the photo/i.test(raw)
          ? 'Could not read the photo. Please try again.'
          : raw;
      setError(friendly);
      setPhase(photoRef.current ? 'editing' : 'idle');
    } finally {
      setProgress(null);
      abortRef.current = null;
    }
  }, [kind, options.attachmentKey, previousOdometerKm, service]);

  const beginEdit = useCallback(() => {
    setAckWarning(false);
    setPhase('editing');
  }, []);

  const beginManualEntry = useCallback(() => {
    setAckWarning(false);
    setDraftValueState('');
    setPhase('editing');
  }, []);

  const validation: OdometerValidationResult = useMemo(
    () => validateOdometerReading(draftValue, previousOdometerKm),
    [draftValue, previousOdometerKm],
  );

  const finalize = useCallback(
    (manuallyEdited: boolean) => {
      const currentPhoto = photoRef.current;
      if (!currentPhoto || !ocr) return;

      const digits = draftValue.replace(/\D/g, '');
      if (!digits) {
        setError('Enter an odometer value');
        return;
      }

      if (!manuallyEdited && service.isLowConfidence(ocr.confidence)) {
        setPhase('editing');
        return;
      }

      const check = validateOdometerReading(digits, previousOdometerKm);
      if (check.code === 'empty' || check.code === 'too_short') {
        setError('Enter a complete odometer reading');
        return;
      }
      if (check.requiresConfirmation && !ackWarning) {
        setPhase('editing');
        return;
      }

      const reading = service.acceptReading({
        photo: currentPhoto,
        ocr,
        value: digits,
        manuallyEdited,
      });
      setAccepted(reading);
      setPhase('accepted');
      setError(null);
      options.onAccepted?.(reading);
    },
    [ackWarning, draftValue, ocr, options, previousOdometerKm, service],
  );

  const acceptOcrValue = useCallback(() => {
    if (!ocr?.value) return;
    if (service.isLowConfidence(ocr.confidence) || !ocr.ok) {
      setPhase('editing');
      return;
    }
    setDraftValueState(ocr.value);
    const check = validateOdometerReading(ocr.value, previousOdometerKm);
    if (check.requiresConfirmation) {
      setPhase('editing');
      return;
    }
    finalize(false);
  }, [finalize, ocr, previousOdometerKm, service]);

  const lowConfidence =
    ocr != null && (service.isLowConfidence(ocr.confidence) || !ocr.ok);

  const canAcceptOcr =
    Boolean(ocr?.ok && ocr.value) &&
    !lowConfidence &&
    phase === 'review' &&
    !validateOdometerReading(ocr?.value ?? '', previousOdometerKm).requiresConfirmation;

  const canConfirmManual =
    Boolean(draftValue.replace(/\D/g, '')) &&
    (!validation.requiresConfirmation || ackWarning);

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
    lowConfidenceThreshold: service.lowConfidenceThreshold ?? OCR_LOW_CONFIDENCE_THRESHOLD,
    previousOdometerKm,
    validation,
    ackWarning,
    setAckWarning,
    canAcceptOcr,
    canConfirmManual,
    startCapture,
    beginEdit,
    beginManualEntry,
    acceptOcrValue,
    acceptEditedValue: () => finalize(true),
    confirmFinal: () => finalize(true),
    reset,
  };
}
