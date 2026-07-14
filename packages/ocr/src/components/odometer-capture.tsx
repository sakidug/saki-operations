import { useId } from 'react';
import { Camera, Check, Pencil, TriangleAlert } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Badge,
  Button,
  Card,
  Input,
  Label,
  LoadingSpinner,
  cn,
} from '@saki-operations/ui';

import { formatOdometerKm } from '../parse/odometer-parse';
import {
  useOdometerCapture,
  type UseOdometerCaptureOptions,
} from '../hooks/use-odometer-capture';
import type { AcceptedOdometerReading } from '../types';

export type OdometerCaptureProps = UseOdometerCaptureOptions & {
  className?: string;
  /** When true, hide the capture CTA and only show review if already running */
  labels?: Partial<{
    title: string;
    description: string;
    capture: string;
    processing: string;
    detected: string;
    confidence: string;
    lowConfidenceWarning: string;
    failedWarning: string;
    accept: string;
    edit: string;
    saveEdit: string;
    cancel: string;
    unit: string;
    retake: string;
    saved: string;
    editedSuffix: string;
  }>;
  onAccepted?: (reading: AcceptedOdometerReading) => void;
};

const DEFAULT_LABELS = {
  title: 'Odometer',
  description: 'Capture the dashboard odometer. OCR will suggest a reading you can accept or edit.',
  capture: 'Capture Odometer',
  processing: 'Reading odometer…',
  detected: 'Detected',
  confidence: 'Confidence',
  lowConfidenceWarning: 'Low confidence — please verify the reading manually.',
  failedWarning: 'Could not read the odometer. Enter the value manually. Your photo is still attached.',
  accept: 'Accept',
  edit: 'Edit manually',
  saveEdit: 'Save value',
  cancel: 'Cancel',
  unit: 'KM',
  retake: 'Retake photo',
  saved: 'Saved',
  editedSuffix: '(edited)',
};

/**
 * Reusable Capture Odometer control — shared by Tours and HHCO later.
 * Not a trip screen; parents compose it inside their own forms.
 */
export function OdometerCapture({
  className,
  labels: labelOverrides,
  onAccepted,
  ...captureOptions
}: OdometerCaptureProps) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const reduceMotion = useReducedMotion();
  const editId = useId();
  const capture = useOdometerCapture({ ...captureOptions, onAccepted });

  const showReview =
    (capture.phase === 'review' || capture.phase === 'editing' || capture.phase === 'accepted') &&
    capture.photo &&
    capture.ocr;

  return (
    <Card variant="glass" padding="lg" className={cn('space-y-4', className)}>
      <header className="space-y-1">
        <h3 className="text-base font-semibold tracking-tight sm:text-lg">{labels.title}</h3>
        <p className="text-sm text-muted-foreground">{labels.description}</p>
      </header>

      {capture.phase === 'idle' || capture.phase === 'capturing' ? (
        <Button
          type="button"
          size="lg"
          className="min-h-12 w-full"
          loading={capture.phase === 'capturing'}
          onClick={() => void capture.startCapture()}
        >
          <Camera className="size-4" aria-hidden />
          {labels.capture}
        </Button>
      ) : null}

      {capture.phase === 'processing' ? (
        <div
          className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-background/40 px-4 py-8"
          role="status"
          aria-live="polite"
        >
          <LoadingSpinner label={labels.processing} size="md" />
          <p className="text-sm text-muted-foreground">{labels.processing}</p>
          {typeof capture.progress?.progress === 'number' ? (
            <p className="font-mono text-xs tabular-nums text-muted-foreground">
              {Math.round(capture.progress.progress * 100)}%
            </p>
          ) : null}
        </div>
      ) : null}

      {capture.error ? (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {capture.error}
        </p>
      ) : null}

      {showReview && capture.photo && capture.ocr ? (
        <motion.div
          className="space-y-4"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted/30">
            <img
              src={capture.photo.previewUrl}
              alt=""
              className="max-h-56 w-full object-cover sm:max-h-72"
            />
          </div>

          {!capture.ocr.ok ? (
            <div
              role="status"
              className="flex gap-2 rounded-xl border border-warning/40 bg-warning/10 px-3 py-2.5 text-sm text-foreground"
            >
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
              <span>{labels.failedWarning}</span>
            </div>
          ) : capture.lowConfidence ? (
            <div
              role="status"
              className="flex gap-2 rounded-xl border border-warning/40 bg-warning/10 px-3 py-2.5 text-sm text-foreground"
            >
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
              <span>{labels.lowConfidenceWarning}</span>
            </div>
          ) : null}

          {capture.phase !== 'editing' ? (
            <div className="space-y-2 rounded-2xl border border-border/60 bg-background/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {labels.detected}
                </p>
                {capture.ocr.ok ? (
                  <Badge variant={capture.lowConfidence ? 'warning' : 'success'}>
                    {labels.confidence} {Math.round(capture.ocr.confidence)}%
                  </Badge>
                ) : (
                  <Badge variant="danger">{labels.confidence} —</Badge>
                )}
              </div>
              <p className="font-display text-3xl font-semibold tracking-tight tabular-nums">
                {capture.ocr.value ? (
                  <>
                    {formatOdometerKm(capture.ocr.value)}{' '}
                    <span className="text-lg text-muted-foreground">{labels.unit}</span>
                  </>
                ) : (
                  <span className="text-lg text-muted-foreground">—</span>
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor={editId}>{labels.edit}</Label>
              <div className="flex gap-2">
                <Input
                  id={editId}
                  inputMode="numeric"
                  value={capture.draftValue}
                  onChange={(event) => capture.setDraftValue(event.target.value.replace(/[^\d]/g, ''))}
                  className="font-mono text-lg tabular-nums"
                  aria-describedby={`${editId}-unit`}
                />
                <span id={`${editId}-unit`} className="flex items-center text-sm text-muted-foreground">
                  {labels.unit}
                </span>
              </div>
              {capture.draftValue ? (
                <p className="text-sm text-muted-foreground">
                  {formatOdometerKm(capture.draftValue)} {labels.unit}
                </p>
              ) : null}
            </div>
          )}

          {capture.phase === 'accepted' && capture.accepted ? (
            <p role="status" className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
              {labels.saved} {capture.accepted.displayValue} {labels.unit}
              {capture.accepted.manuallyEdited ? ` ${labels.editedSuffix}` : ''}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {capture.phase === 'review' ? (
              <>
                <Button type="button" variant="outline" size="lg" onClick={capture.beginEdit}>
                  <Pencil className="size-4" aria-hidden />
                  {labels.edit}
                </Button>
                <Button
                  type="button"
                  size="lg"
                  disabled={!capture.ocr.value}
                  onClick={capture.acceptOcrValue}
                >
                  <Check className="size-4" aria-hidden />
                  {labels.accept}
                </Button>
              </>
            ) : null}

            {capture.phase === 'editing' ? (
              <>
                <Button type="button" variant="ghost" size="lg" onClick={() => capture.reset()}>
                  {labels.cancel}
                </Button>
                <Button
                  type="button"
                  size="lg"
                  disabled={!capture.draftValue}
                  onClick={capture.acceptEditedValue}
                >
                  <Check className="size-4" aria-hidden />
                  {labels.saveEdit}
                </Button>
              </>
            ) : null}

            {capture.phase === 'accepted' || capture.phase === 'review' ? (
              <Button type="button" variant="ghost" size="lg" onClick={capture.reset}>
                {labels.retake}
              </Button>
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </Card>
  );
}
