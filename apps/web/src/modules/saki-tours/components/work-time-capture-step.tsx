import { useCallback, useEffect, useRef, useState } from 'react';
import { capturePhotoFromCamera } from '@saki-operations/ocr';
import { useAppTranslation } from '@saki-operations/i18n';
import { Badge, Button, Card, cn } from '@saki-operations/ui';
import { Camera, Clock3 } from 'lucide-react';

import type { TimeEvidenceCapture } from '../types';

type WorkTimeCaptureStepProps = {
  value: TimeEvidenceCapture | null;
  onChange: (next: TimeEvidenceCapture | null) => void;
  className?: string;
  disabled?: boolean;
  labels: {
    title: string;
    description: string;
    capture: string;
    capturing: string;
    retake: string;
    photoAlt: string;
    readOnlyHint: string;
    captureFailed: string;
    filePrefix: string;
  };
};

function formatLocalTime(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/**
 * Work time evidence: take photo → auto-stamp device clock.
 * Drivers cannot edit the clock (Office/Admin correction later).
 */
export function WorkTimeCaptureStep({
  value,
  onChange,
  className,
  disabled = false,
  labels,
}: WorkTimeCaptureStepProps) {
  const { i18n } = useAppTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(value?.previewUrl ?? null);

  useEffect(() => {
    previewUrlRef.current = value?.previewUrl ?? null;
  }, [value?.previewUrl]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const capture = useCallback(async () => {
    if (disabled || busy) return;
    setBusy(true);
    setError(null);
    try {
      const photo = await capturePhotoFromCamera();
      const capturedAt = new Date().toISOString();
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      onChange({
        capturedAt,
        photoBlob: photo.file,
        previewUrl: photo.previewUrl,
        fileName: photo.file.name || `${labels.filePrefix}-${Date.now()}.jpg`,
        mimeType: photo.file.type || 'image/jpeg',
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError(null);
      } else {
        setError(labels.captureFailed);
      }
    } finally {
      setBusy(false);
    }
  }, [busy, disabled, labels.captureFailed, labels.filePrefix, onChange]);

  return (
    <Card variant="glass" className={cn('space-y-4 p-4 sm:p-5', className)}>
      <div>
        <h2 className="text-base font-semibold text-foreground">{labels.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{labels.description}</p>
      </div>

      {!value ? (
        <Button
          type="button"
          size="lg"
          className="w-full sm:w-auto"
          disabled={busy || disabled}
          aria-busy={busy}
          onClick={() => void capture()}
        >
          <Camera className="size-4" aria-hidden />
          {busy ? labels.capturing : labels.capture}
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-glass-border">
            <img
              src={value.previewUrl}
              alt={labels.photoAlt}
              className="max-h-56 w-full object-cover"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success" className="gap-1.5 rounded-md">
              <Clock3 className="size-3.5" aria-hidden />
              {formatLocalTime(value.capturedAt, i18n.language)}
            </Badge>
            <span className="text-xs text-muted-foreground">{labels.readOnlyHint}</span>
          </div>
          <Button
            type="button"
            variant="secondary"
            disabled={busy || disabled}
            aria-busy={busy}
            onClick={() => void capture()}
          >
            <Camera className="size-4" aria-hidden />
            {labels.retake}
          </Button>
        </div>
      )}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </Card>
  );
}
