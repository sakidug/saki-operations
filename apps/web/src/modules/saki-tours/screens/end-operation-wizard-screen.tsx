import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  getDefaultOperationsSessionEngine,
  parseOdometerNumber,
  type OperationsSession,
} from '@saki-operations/operations-session';
import { OdometerCapture } from '@saki-operations/ocr';
import { useAppTranslation } from '@saki-operations/i18n';
import { Badge, Button, Card, cn, LoadingSpinner } from '@saki-operations/ui';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Gauge,
  Camera,
} from 'lucide-react';

import { FadeIn } from '@/app/screens/loading/fade-in';
import {
  buildSakiToursOperationCompletedPath,
  buildSakiToursOperationPath,
  paths,
} from '@/app/router/paths';

import { commitEndOperation } from '../lib/commit-end-operation';
import { reportOperationError } from '../lib/report-operation-error';
import {
  formatKm,
  getSessionAssistantsLabel,
  getSessionCompanyLabel,
  getSessionDriverLabel,
  getSessionStringField,
  getSessionVehicleLabel,
  isActiveOperationStatus,
  isMultiDaySession,
} from '../lib/session-display';
import { createEmptyEndDraft, type EndOperationDraft } from '../types';

const STEP_COUNT = 4;

function StepShell({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          {icon}
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function EndKmStep({
  draft,
  startOdometer,
  locale,
}: {
  draft: EndOperationDraft;
  startOdometer: number | null;
  locale: string;
}) {
  const { t } = useAppTranslation();
  const endKm = draft.endOdometer ? parseOdometerNumber(draft.endOdometer.value) : null;
  const distanceKm =
    endKm != null && startOdometer != null && Number.isFinite(endKm - startOdometer)
      ? endKm - startOdometer
      : null;

  return (
    <StepShell
      icon={<Gauge className="size-5" aria-hidden />}
      title={t('toursOps.endKm.title')}
      description={t('toursOps.endKm.description')}
    >
      <div className="space-y-3">
        <div className="rounded-2xl border border-border bg-background p-5 text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {t('toursOps.endKm.confirmed')}
          </p>
          <p className="mt-3 font-display text-4xl font-bold tabular-nums text-foreground">
            {draft.endOdometer?.displayValue ?? '—'}
            <span className="ml-2 text-lg text-muted-foreground">{t('toursOps.odometer.unit')}</span>
          </p>
          <p className="mt-3 text-sm text-muted-foreground">{t('toursOps.endKm.changeHint')}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-background px-4 py-3 text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('toursOps.endReview.startOdometer')}
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {formatKm(startOdometer, locale)} {t('toursOps.odometer.unit')}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background px-4 py-3 text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('toursOps.endReview.distanceKm')}
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {formatKm(distanceKm, locale)} {t('toursOps.odometer.unit')}
            </p>
          </div>
        </div>
      </div>
    </StepShell>
  );
}

/**
 * Operations V2 Phase 3 — Finish Operation wizard (offline-capable).
 * End Time Photo removed; device completion timestamp is recorded automatically.
 */
export function EndOperationWizardScreen() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { t, i18n } = useAppTranslation();
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

  const distanceKm = useMemo(() => {
    if (!draft.endOdometer || session?.startOdometer == null) return null;
    const endKm = parseOdometerNumber(draft.endOdometer.value);
    if (endKm == null) return null;
    const next = endKm - session.startOdometer;
    return Number.isFinite(next) ? next : null;
  }, [draft.endOdometer, session?.startOdometer]);

  const canAdvance = (s: number) => {
    if (s === 1) return Boolean(draft.endOdometer);
    if (s === 2) return Boolean(draft.endOdometer) && distanceKm != null && distanceKm >= 0;
    if (s === 3) return Boolean(draft.endOdometer) && distanceKm != null && distanceKm >= 0;
    return Boolean(draft.endOdometer) && distanceKm != null && distanceKm >= 0;
  };

  const onFinish = async () => {
    if (!sessionId || !session || !canAdvance(4)) return;
    setSubmitting(true);
    setError(null);
    try {
      await commitEndOperation({
        sessionId,
        draft,
        employeeId: session.employeeId,
      });
      navigate(buildSakiToursOperationCompletedPath(sessionId), { replace: true });
    } catch (err) {
      reportOperationError('finish-operation', err);
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
        return t('toursOps.endWizard.stepOdometerPhoto');
      case 2:
        return t('toursOps.endWizard.stepEndKm');
      case 3:
        return t('toursOps.endWizard.stepReview');
      default:
        return t('toursOps.endWizard.stepFinish');
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

        <Card variant="glass" padding="lg" className="space-y-5 pb-0">
          {step === 1 ? (
            <StepShell
              icon={<Camera className="size-5" aria-hidden />}
              title={t('toursOps.endOdometer.title')}
              description={t('toursOps.endOdometer.description')}
            >
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
            </StepShell>
          ) : null}

          {step === 2 ? (
            <EndKmStep draft={draft} startOdometer={session.startOdometer} locale={i18n.language} />
          ) : null}

          {step === 3 || step === 4 ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  {step === 3 ? (
                    <ClipboardCheck className="size-5" aria-hidden />
                  ) : (
                    <CheckCircle2 className="size-5" aria-hidden />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">
                    {step === 3 ? t('toursOps.endReview.title') : t('toursOps.endWizard.stepFinish')}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {step === 3
                      ? t('toursOps.endReview.description')
                      : t('toursOps.endReview.finishDescription')}
                  </p>
                </div>
              </div>

              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <ReviewRow label={t('toursOps.endReview.company')} value={getSessionCompanyLabel(session)} />
                <ReviewRow label={t('toursOps.endReview.vehicle')} value={getSessionVehicleLabel(session)} />
                <ReviewRow label={t('toursOps.endReview.driver')} value={getSessionDriverLabel(session)} />
                <ReviewRow
                  label={t('toursOps.endReview.assistants')}
                  value={getSessionAssistantsLabel(session, t('toursOps.confirm.noAssistants'))}
                />
                <ReviewRow
                  label={t('toursOps.endReview.destination')}
                  value={getSessionStringField(session, 'destination')}
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
                  label={t('toursOps.endReview.distanceKm')}
                  value={`${formatKm(distanceKm, i18n.language)} ${t('toursOps.odometer.unit')}`}
                />
              </dl>

              <p className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
                {t('toursOps.endReview.autoTimeNote')}
              </p>
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="sticky bottom-0 -mx-6 flex items-center justify-between gap-3 border-t border-border/60 bg-card/95 px-6 py-4 backdrop-blur">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="min-w-[7.5rem]"
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
                size="lg"
                className="min-w-[7.5rem]"
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
                className="min-w-[7.5rem]"
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
