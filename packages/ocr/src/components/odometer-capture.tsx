import { useId } from 'react';
import { Camera, Check, Keyboard, Pencil, TriangleAlert } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Label,
  LoadingSpinner,
  cn,
} from '@saki-operations/ui';

import { formatOdometerKm } from '../parse/odometer-parse';
import {
  useOdometerCapture,
  type UseOdometerCaptureOptions,
} from '../hooks/use-odometer-capture';
import { NumericKeypad } from './numeric-keypad';
import type { AcceptedOdometerReading } from '../types';

export type OdometerCaptureProps = UseOdometerCaptureOptions & {
  className?: string;
  labels?: Partial<{
    title: string;
    description: string;
    capture: string;
    processing: string;
    photoSaved: string;
    detected: string;
    confidence: string;
    lowConfidenceWarning: string;
    failedWarning: string;
    accept: string;
    edit: string;
    enterManually: string;
    saveEdit: string;
    confirmReading: string;
    cancel: string;
    unit: string;
    retake: string;
    saved: string;
    editedSuffix: string;
    photoAlt: string;
    previousReading: string;
    warningBelowPrevious: string;
    warningLargeJump: string;
    warningTooShort: string;
    acknowledgeWarning: string;
    backspace: string;
  }>;
  onAccepted?: (reading: AcceptedOdometerReading) => void;
};

const DEFAULT_LABELS = {
  title: 'Odometer',
  description:
    'Take a photo of the dashboard. OCR suggests a reading — you always confirm the final kilometres.',
  capture: 'Capture Odometer',
  processing: 'Reading odometer…',
  photoSaved: 'Photo saved. Running OCR…',
  detected: 'Detected',
  confidence: 'Confidence',
  lowConfidenceWarning:
    'Confidence is below 95%. Verify against the photo and enter the correct value if needed.',
  failedWarning:
    'Could not read the odometer reliably. Enter the value manually — your photo stays attached.',
  accept: 'Accept',
  edit: 'Edit',
  enterManually: 'Enter Manually',
  saveEdit: 'Confirm reading',
  confirmReading: 'Confirm final reading',
  cancel: 'Cancel',
  unit: 'KM',
  retake: 'Retake photo',
  saved: 'Saved',
  editedSuffix: '(manual)',
  photoAlt: 'Odometer evidence photo',
  previousReading: 'Previous reading',
  warningBelowPrevious: 'This reading is lower than the previous odometer. Confirm only if correct.',
  warningLargeJump: 'This is an unusually large increase. Confirm only if the reading is correct.',
  warningTooShort: 'Enter a complete odometer reading (at least 4 digits).',
  acknowledgeWarning: 'I have checked the photo and confirm this reading',
  backspace: 'Backspace',
};

function UncertainDigits({ value, unit }: { value: string; unit: string }) {
  return (
    <p className="font-display text-3xl font-semibold tracking-tight tabular-nums" aria-live="polite">
      {value.split('').map((digit, index) => (
        <span
          key={`${digit}-${index}`}
          className="mx-0.5 inline-block rounded-md bg-warning/25 px-1.5 text-foreground ring-1 ring-warning/50"
        >
          {digit}
        </span>
      ))}{' '}
      <span className="text-lg text-muted-foreground">{unit}</span>
    </p>
  );
}

/**
 * Reusable Capture Odometer control — shared by Tours and HHCO later.
 * OCR assists; the driver always confirms the final reading.
 */
export function OdometerCapture({
  className,
  labels: labelOverrides,
  onAccepted,
  ...captureOptions
}: OdometerCaptureProps) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const reduceMotion = useReducedMotion();
  const ackId = useId();
  const capture = useOdometerCapture({ ...captureOptions, onAccepted });

  const showPhoto = Boolean(capture.photo);
  const showBusy =
    capture.phase === 'capturing' ||
    capture.phase === 'saving' ||
    capture.phase === 'processing';
  const showReviewPanel =
    (capture.phase === 'review' ||
      capture.phase === 'editing' ||
      capture.phase === 'accepted') &&
    capture.photo;

  const warningMessage =
    capture.validation.code === 'below_previous'
      ? labels.warningBelowPrevious
      : capture.validation.code === 'large_jump'
        ? labels.warningLargeJump
        : capture.validation.code === 'too_short' || capture.validation.code === 'empty'
          ? labels.warningTooShort
          : null;

  return (
    <Card variant="glass" padding="lg" className={cn('space-y-4', className)}>
      <header className="space-y-1">
        <h3 className="text-base font-semibold tracking-tight sm:text-lg">{labels.title}</h3>
        <p className="text-sm text-muted-foreground">{labels.description}</p>
      </header>

      {!showPhoto && (capture.phase === 'idle' || capture.phase === 'capturing') ? (
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

      {showPhoto && capture.photo ? (
        <motion.div
          className="space-y-4"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted/30">
            <img
              src={capture.photo.previewUrl}
              alt={labels.photoAlt}
              className="max-h-64 w-full object-contain sm:max-h-80"
            />
          </div>

          {showBusy ? (
            <div
              className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-background/40 px-4 py-6"
              role="status"
              aria-live="polite"
            >
              <LoadingSpinner
                label={
                  capture.phase === 'saving' || capture.phase === 'capturing'
                    ? labels.photoSaved
                    : labels.processing
                }
                size="md"
              />
              <p className="text-sm text-muted-foreground">
                {capture.phase === 'saving' || capture.phase === 'capturing'
                  ? labels.photoSaved
                  : labels.processing}
              </p>
              {typeof capture.progress?.progress === 'number' ? (
                <p className="font-mono text-xs tabular-nums text-muted-foreground">
                  {Math.round(capture.progress.progress * 100)}%
                </p>
              ) : null}
            </div>
          ) : null}

          {showReviewPanel && capture.ocr ? (
            <>
              {capture.previousOdometerKm != null ? (
                <p className="text-xs text-muted-foreground">
                  {labels.previousReading}:{' '}
                  <span className="font-mono font-semibold text-foreground">
                    {formatOdometerKm(String(Math.floor(capture.previousOdometerKm)))}{' '}
                    {labels.unit}
                  </span>
                </p>
              ) : null}

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

              {capture.phase === 'review' ? (
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
                  {capture.ocr.value ? (
                    capture.lowConfidence ? (
                      <UncertainDigits value={capture.ocr.value} unit={labels.unit} />
                    ) : (
                      <p className="font-display text-3xl font-semibold tracking-tight tabular-nums">
                        {formatOdometerKm(capture.ocr.value)}{' '}
                        <span className="text-lg text-muted-foreground">{labels.unit}</span>
                      </p>
                    )
                  ) : (
                    <span className="text-lg text-muted-foreground">—</span>
                  )}
                </div>
              ) : null}

              {capture.phase === 'editing' ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3 text-center">
                    <p className="font-mono text-3xl font-semibold tabular-nums tracking-widest">
                      {capture.draftValue || '—'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {capture.displayDraft
                        ? `${capture.displayDraft} ${labels.unit}`
                        : labels.unit}
                    </p>
                  </div>

                  {warningMessage ? (
                    <div
                      role="alert"
                      className="flex gap-2 rounded-xl border border-warning/40 bg-warning/10 px-3 py-2.5 text-sm"
                    >
                      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                      <span>{warningMessage}</span>
                    </div>
                  ) : null}

                  {capture.validation.requiresConfirmation ? (
                    <div className="flex items-start gap-3 rounded-xl border border-border/60 px-3 py-3">
                      <Checkbox
                        id={ackId}
                        checked={capture.ackWarning}
                        onCheckedChange={(checked) =>
                          capture.setAckWarning(checked === true)
                        }
                      />
                      <Label htmlFor={ackId} className="text-sm font-normal leading-snug">
                        {labels.acknowledgeWarning}
                      </Label>
                    </div>
                  ) : null}

                  <NumericKeypad
                    value={capture.draftValue}
                    onChange={capture.setDraftValue}
                    labels={{ backspace: labels.backspace }}
                  />
                </div>
              ) : null}

              {capture.phase === 'accepted' && capture.accepted ? (
                <p role="status" className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
                  {labels.saved} {capture.accepted.displayValue} {labels.unit}
                  {capture.accepted.manuallyEdited ? ` ${labels.editedSuffix}` : ''}
                </p>
              ) : null}

              <div className="flex flex-col gap-2">
                {capture.phase === 'review' ? (
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button type="button" variant="ghost" size="lg" onClick={capture.reset}>
                      {labels.retake}
                    </Button>
                    <Button type="button" variant="outline" size="lg" onClick={capture.beginEdit}>
                      <Pencil className="size-4" aria-hidden />
                      {labels.edit}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="lg"
                      onClick={capture.beginManualEntry}
                    >
                      <Keyboard className="size-4" aria-hidden />
                      {labels.enterManually}
                    </Button>
                    <Button
                      type="button"
                      size="lg"
                      disabled={!capture.canAcceptOcr}
                      onClick={capture.acceptOcrValue}
                    >
                      <Check className="size-4" aria-hidden />
                      {labels.accept}
                    </Button>
                  </div>
                ) : null}

                {capture.phase === 'editing' ? (
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button type="button" variant="ghost" size="lg" onClick={capture.reset}>
                      {labels.retake}
                    </Button>
                    <Button
                      type="button"
                      size="lg"
                      disabled={!capture.canConfirmManual}
                      onClick={capture.confirmFinal}
                    >
                      <Check className="size-4" aria-hidden />
                      {labels.confirmReading}
                    </Button>
                  </div>
                ) : null}

                {capture.phase === 'accepted' ? (
                  <Button type="button" variant="ghost" size="lg" onClick={capture.reset}>
                    {labels.retake}
                  </Button>
                ) : null}
              </div>
            </>
          ) : null}
        </motion.div>
      ) : null}

      {capture.error ? (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {capture.error}
        </p>
      ) : null}
    </Card>
  );
}
