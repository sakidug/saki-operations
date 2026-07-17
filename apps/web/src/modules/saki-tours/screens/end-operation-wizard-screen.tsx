import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  calculateTotalKm,
  calculateWorkingHours,
  getDefaultOperationsSessionEngine,
  parseOdometerNumber,
  type OperationsSession,
} from '@saki-operations/operations-session';
import { OdometerCapture } from '@saki-operations/ocr';
import { useAppTranslation } from '@saki-operations/i18n';
import { Badge, Button, Card, cn, LoadingSpinner } from '@saki-operations/ui';
import { ArrowLeft, ArrowRight } from 'lucide-react';

import { useNetwork } from '@/app/bootstrap/network-provider';
import { FadeIn } from '@/app/screens/loading/fade-in';
import {
  buildSakiToursOperationCompletedPath,
  buildSakiToursOperationPath,
  paths,
} from '@/app/router/paths';

import { EndTimeCaptureStep } from '../components/end-time-capture-step';
import { commitEndOperation } from '../lib/commit-end-operation';
import {
  formatKm,
  formatOperationDateTime,
  getSessionHireTypeKey,
  getSessionVehicleLabel,
  isActiveOperationStatus,
  isMultiDaySession,
} from '../lib/session-display';
import { createEmptyEndDraft, type EndOperationDraft } from '../types';

const STEP_COUNT = 4;

/**
 * Phase 7.2B — End Operation wizard (offline-capable).
 */
export function EndOperationWizardScreen() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { t, i18n } = useAppTranslation();
  const { isOnline } = useNetwork();
  const navigate = useNavigate();

  const [session, setSession] = useState<OperationsSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<EndOperationDraft>(createEmptyEndDraft);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!sessionId) {
        setLoading(false);
        return;
      }
      const engine = getDefaultOperationsSessionEngine();
      const found = await engine.getSession(sessionId);
      if (cancelled) return;

      if (found?.status === 'completed' || found?.status === 'synced') {
        navigate(buildSakiToursOperationCompletedPath(sessionId), { replace: true });
        return;
      }

      if (found && isMultiDaySession(found)) {
        navigate(buildSakiToursOperationPath(sessionId), { replace: true });
        return;
      }

      setSession(found);
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [navigate, sessionId]);

  const preview = useMemo(() => {
    if (!session?.startTime || !draft.endTime || !draft.endOdometer) return null;
    if (session.startOdometer == null) return null;

    const endKm = parseOdometerNumber(draft.endOdometer.value);
    if (endKm == null) return null;

    try {
      const hours = calculateWorkingHours(session.startTime, draft.endTime.capturedAt);
      const km = calculateTotalKm(session.startOdometer, endKm);
      return { hours, km };
    } catch {
      return null;
    }
  }, [draft.endOdometer, draft.endTime, session]);

  const canAdvance = (s: number) => {
    if (s === 1) return Boolean(draft.endOdometer);
    if (s === 2) return Boolean(draft.endTime);
    if (s === 3) return Boolean(preview);
    return Boolean(preview);
  };

  const onFinish = async () => {
    if (!sessionId || !preview) return;
    setSubmitting(true);
    setError(null);
    try {
      await commitEndOperation({
        sessionId,
        draft,
        employeeId: session!.employeeId,
      });
      navigate(buildSakiToursOperationCompletedPath(sessionId), { replace: true });
    } catch {
      setError(t('toursOps.endWizard.finishFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center">
        <LoadingSpinner label={t('shell.loading.module')} />
      </div>
    );
  }

  if (!session || !sessionId || !isActiveOperationStatus(session.status)) {
    return (
      <FadeIn className="mx-auto max-w-lg space-y-4">
        <Card variant="glass" padding="lg" className="space-y-3" data-brand="tours">
          <h1 className="font-display text-xl font-semibold">{t('toursOps.success.missingTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('toursOps.endWizard.notActive')}</p>
          <Button asChild>
            <Link to={paths.sakiTours}>{t('toursOps.success.backHome')}</Link>
          </Button>
        </Card>
      </FadeIn>
    );
  }

  const stepTitle = (() => {
    switch (step) {
      case 1:
        return t('toursOps.endWizard.stepOdometer');
      case 2:
        return t('toursOps.endWizard.stepEndTime');
      case 3:
        return t('toursOps.endWizard.stepTotals');
      default:
        return t('toursOps.endWizard.stepReview');
    }
  })();

  return (
    <FadeIn className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div data-brand="tours" className="contents">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <Badge variant="secondary" className="rounded-md">
              {t('toursOps.wizard.stepOf', { current: step, total: STEP_COUNT })}
            </Badge>
            <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
              {t('toursOps.endWizard.title')}
            </h1>
            <p className="text-sm text-muted-foreground">{stepTitle}</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to={buildSakiToursOperationPath(session.id)}>{t('toursOps.wizard.cancel')}</Link>
          </Button>
        </div>

        <ol className="flex gap-1.5" aria-hidden>
          {Array.from({ length: STEP_COUNT }, (_, index) => {
            const n = index + 1;
            return (
              <li
                key={n}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-colors',
                  n <= step ? 'bg-primary' : 'bg-muted',
                )}
              />
            );
          })}
        </ol>

        <Card variant="glass" padding="lg" className="space-y-5">
          {step === 1 ? (
            <OdometerCapture
              kind="digital"
              previousOdometerKm={session.startOdometer}
              labels={{
                title: t('toursOps.endOdometer.title'),
                description: t('toursOps.odometer.description'),
                capture: t('toursOps.endOdometer.capture'),
                processing: t('toursOps.endOdometer.processing'),
                photoSaved: t('toursOps.odometer.photoSaved'),
                detected: t('toursOps.endOdometer.detected'),
                confidence: t('toursOps.endOdometer.confidence'),
                lowConfidenceWarning: t('toursOps.odometer.lowConfidence'),
                failedWarning: t('toursOps.odometer.failed'),
                accept: t('toursOps.endOdometer.accept'),
                edit: t('toursOps.endOdometer.edit'),
                enterManually: t('toursOps.odometer.enterManually'),
                saveEdit: t('toursOps.odometer.saveEdit'),
                confirmReading: t('toursOps.odometer.confirmReading'),
                cancel: t('toursOps.endOdometer.cancelEdit'),
                retake: t('toursOps.endOdometer.retake'),
                unit: t('toursOps.odometer.unit'),
                saved: t('toursOps.odometer.saved'),
                editedSuffix: t('toursOps.odometer.editedSuffix'),
                photoAlt: t('toursOps.odometer.photoAlt'),
                previousReading: t('toursOps.odometer.previousReading'),
                warningBelowPrevious: t('toursOps.odometer.warningBelowPrevious'),
                warningLargeJump: t('toursOps.odometer.warningLargeJump'),
                warningTooShort: t('toursOps.odometer.warningTooShort'),
                acknowledgeWarning: t('toursOps.odometer.acknowledgeWarning'),
                backspace: t('toursOps.odometer.backspace'),
              }}
              onAccepted={(reading) => setDraft((prev) => ({ ...prev, endOdometer: reading }))}
            />
          ) : null}

          {step === 2 ? (
            <EndTimeCaptureStep
              value={draft.endTime}
              onChange={(endTime) => setDraft((prev) => ({ ...prev, endTime }))}
            />
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {t('toursOps.endTotals.title')}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('toursOps.endTotals.description')}
                </p>
              </div>
              {preview ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-primary/10 px-4 py-5 text-center sm:text-left">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t('toursOps.endTotals.workingHours')}
                    </p>
                    <p className="mt-2 font-display text-3xl font-semibold text-foreground">
                      {preview.hours.label}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-primary/10 px-4 py-5 text-center sm:text-left">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t('toursOps.endTotals.totalKm')}
                    </p>
                    <p className="mt-2 font-display text-3xl font-semibold text-foreground">
                      {formatKm(preview.km.totalKm, i18n.language)}{' '}
                      <span className="text-base font-medium text-muted-foreground">
                        {t('toursOps.odometer.unit')}
                      </span>
                    </p>
                  </div>
                </div>
              ) : (
                <p role="alert" className="text-sm text-destructive">
                  {t('toursOps.endTotals.calcFailed')}
                </p>
              )}
            </div>
          ) : null}

          {step === 4 && preview ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {t('toursOps.endReview.title')}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('toursOps.endReview.description')}
                </p>
              </div>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <ReviewRow
                  label={t('toursOps.endReview.vehicle')}
                  value={getSessionVehicleLabel(session)}
                />
                <ReviewRow
                  label={t('toursOps.endReview.hireType')}
                  value={t(getSessionHireTypeKey(session))}
                />
                <ReviewRow
                  label={t('toursOps.endReview.startTime')}
                  value={formatOperationDateTime(session.startTime, i18n.language)}
                />
                <ReviewRow
                  label={t('toursOps.endReview.endTime')}
                  value={formatOperationDateTime(draft.endTime?.capturedAt, i18n.language)}
                />
                <ReviewRow
                  label={t('toursOps.endReview.workingHours')}
                  value={preview.hours.label}
                />
                <ReviewRow
                  label={t('toursOps.endReview.startOdometer')}
                  value={`${formatKm(session.startOdometer, i18n.language)} ${t('toursOps.odometer.unit')}`}
                />
                <ReviewRow
                  label={t('toursOps.endReview.endOdometer')}
                  value={`${draft.endOdometer?.displayValue ?? '—'} ${t('toursOps.odometer.unit')}`}
                />
                <ReviewRow
                  label={t('toursOps.endReview.totalKm')}
                  value={`${formatKm(preview.km.totalKm, i18n.language)} ${t('toursOps.odometer.unit')}`}
                />
              </dl>
              <p className="text-xs text-muted-foreground">
                {isOnline
                  ? t('toursOps.endReview.onlineNote')
                  : t('toursOps.endReview.offlineNote')}
              </p>
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
            <Button
              type="button"
              variant="secondary"
              disabled={step === 1 || submitting}
              onClick={() => {
                setError(null);
                setStep((s) => Math.max(1, s - 1));
              }}
            >
              <ArrowLeft className="size-4" aria-hidden />
              {t('toursOps.wizard.back')}
            </Button>

            {step < STEP_COUNT ? (
              <Button
                type="button"
                disabled={!canAdvance(step)}
                onClick={() => {
                  setError(null);
                  setStep((s) => Math.min(STEP_COUNT, s + 1));
                }}
              >
                {t('toursOps.wizard.next')}
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            ) : (
              <Button
                type="button"
                size="lg"
                loading={submitting}
                disabled={!canAdvance(4) || submitting}
                onClick={() => void onFinish()}
              >
                {t('toursOps.endWizard.finish')}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </FadeIn>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/40 px-3 py-2.5">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium text-foreground">{value}</dd>
    </div>
  );
}
