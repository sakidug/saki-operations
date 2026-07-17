import { useCallback, useEffect, useRef, useState } from 'react';
import { capturePhotoFromCamera } from '@saki-operations/ocr';
import { useAppTranslation } from '@saki-operations/i18n';
import { Button, Card, cn } from '@saki-operations/ui';
import { Camera, Trash2 } from 'lucide-react';

import type { TimeEvidenceCapture } from '../types';

const MIN_PHOTOS = 1;
const MAX_PHOTOS = 5;

type DeliveryPhotosStepProps = {
  value: TimeEvidenceCapture[];
  onChange: (next: TimeEvidenceCapture[]) => void;
  className?: string;
  disabled?: boolean;
};

/**
 * Capture 1–5 delivery photos (helmet/proof of delivery). Same camera input pattern as work-time.
 */
export function DeliveryPhotosStep({
  value,
  onChange,
  className,
  disabled = false,
}: DeliveryPhotosStepProps) {
  const { t } = useAppTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const urlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const next = new Set(value.map((p) => p.previewUrl));
    for (const url of urlsRef.current) {
      if (!next.has(url)) URL.revokeObjectURL(url);
    }
    urlsRef.current = next;
  }, [value]);

  useEffect(() => {
    return () => {
      for (const url of urlsRef.current) URL.revokeObjectURL(url);
      urlsRef.current.clear();
    };
  }, []);

  const capture = useCallback(async () => {
    if (disabled || busy || value.length >= MAX_PHOTOS) return;
    setBusy(true);
    setError(null);
    try {
      const photo = await capturePhotoFromCamera();
      const capturedAt = new Date().toISOString();
      onChange([
        ...value,
        {
          capturedAt,
          photoBlob: photo.file,
          previewUrl: photo.previewUrl,
          fileName: photo.file.name || `delivery-photo-${Date.now()}.jpg`,
          mimeType: photo.file.type || 'image/jpeg',
        },
      ]);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError(null);
      } else {
        setError(t('hhcoOps.deliveryPhotos.captureFailed'));
      }
    } finally {
      setBusy(false);
    }
  }, [busy, disabled, onChange, t, value]);

  const removeAt = (index: number) => {
    if (disabled || busy) return;
    setError(null);
    onChange(value.filter((_, i) => i !== index));
  };

  const retakeAt = async (index: number) => {
    if (disabled || busy) return;
    setBusy(true);
    setError(null);
    try {
      const photo = await capturePhotoFromCamera();
      const capturedAt = new Date().toISOString();
      onChange(
        value.map((item, i) =>
          i === index
            ? {
                capturedAt,
                photoBlob: photo.file,
                previewUrl: photo.previewUrl,
                fileName: photo.file.name || `delivery-photo-${Date.now()}.jpg`,
                mimeType: photo.file.type || 'image/jpeg',
              }
            : item,
        ),
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError(null);
      } else {
        setError(t('hhcoOps.deliveryPhotos.captureFailed'));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card variant="glass" className={cn('space-y-4 p-4 sm:p-5', className)}>
      <div>
        <h2 className="text-base font-semibold text-foreground">
          {t('hhcoOps.deliveryPhotos.title')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('hhcoOps.deliveryPhotos.description')}
        </p>
      </div>

      <p className="text-sm text-muted-foreground">
        {t('hhcoOps.deliveryPhotos.count', { count: value.length, max: MAX_PHOTOS })}
      </p>

      {value.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {value.map((photo, index) => (
            <li
              key={`${photo.previewUrl}-${index}`}
              className="space-y-2 overflow-hidden rounded-xl border border-glass-border p-2"
            >
              <img
                src={photo.previewUrl}
                alt={t('hhcoOps.deliveryPhotos.photoAlt', { index: index + 1 })}
                className="aspect-[4/3] w-full rounded-lg object-cover"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={busy || disabled}
                  aria-busy={busy}
                  onClick={() => void retakeAt(index)}
                >
                  <Camera className="size-4" aria-hidden />
                  {t('hhcoOps.deliveryPhotos.retake')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={busy || disabled}
                  onClick={() => removeAt(index)}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {value.length < MAX_PHOTOS ? (
        <Button
          type="button"
          size="lg"
          className="w-full sm:w-auto"
          disabled={busy || disabled}
          aria-busy={busy}
          onClick={() => void capture()}
        >
          <Camera className="size-4" aria-hidden />
          {busy ? t('hhcoOps.deliveryPhotos.capturing') : t('hhcoOps.deliveryPhotos.capture')}
        </Button>
      ) : null}

      {value.length < MIN_PHOTOS ? (
        <p className="text-sm text-muted-foreground">{t('hhcoOps.deliveryPhotos.minRequired')}</p>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </Card>
  );
}
