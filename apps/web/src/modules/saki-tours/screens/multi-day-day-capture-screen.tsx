import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  calculateTotalKm,
  getDefaultOperationsSessionEngine,
  parseOdometerNumber,
  type OperationsSession,
} from '@saki-operations/operations-session';
import { OdometerCapture, type AcceptedOdometerReading } from '@saki-operations/ocr';
import { useAppTranslation } from '@saki-operations/i18n';
import { Badge, Button, Card, LoadingSpinner } from '@saki-operations/ui';

import { useNetwork } from '@/app/bootstrap/network-provider';
import { FadeIn } from '@/app/screens/loading/fade-in';
import {
  buildSakiToursOperationCompletedPath,
  buildSakiToursOperationPath,
  paths,
} from '@/app/router/paths';

import { EndTimeCaptureStep } from '../components/end-time-capture-step';
import { StartTimeCaptureStep } from '../components/start-time-capture-step';
import {
  commitMultiDayEndTime,
  commitMultiDayStartTime,
} from '../lib/commit-multi-day-day';
import { commitMultiDayFinish } from '../lib/commit-multi-day-finish';
import {
  createInitialMultiDayRecords,
  getCurrentDayNumber,
  getMultiDayRecords,
  getMultiDayTotalWorkingMs,
  getNextDayTask,
  isFinalDay,
  type DayTaskId,
} from '../lib/multi-day';
import {
  formatKm,
  formatWorkingHoursLabel,
  getSessionNumberOfDays,
  isActiveOperationStatus,
  isMultiDaySession,
} from '../lib/session-display';
import type { TimeEvidenceCapture } from '../types';

/**
 * Capture the next required multi-day task for the current day.
 */
export function MultiDayDayCaptureScreen() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { t, i18n } = useAppTranslation();
  const { isOnline } = useNetwork();
  const navigate = useNavigate();

  const [session, setSession] = useState<OperationsSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endOdometer, setEndOdometer] = useState<AcceptedOdometerReading | null>(null);
  const [pendingStart, setPendingStart] = useState<TimeEvidenceCapture | null>(null);
  const [pendingEnd, setPendingEnd] = useState<TimeEvidenceCapture | null>(null);

  const reload = async (id: string) => {
    const engine = getDefaultOperationsSessionEngine();
    let found = await engine.getSession(id);
    if (!found) return null;

    // Migrate older multi-day sessions that lack daily records.
    if (isMultiDaySession(found) && getMultiDayRecords(found).length === 0) {
      const days = createInitialMultiDayRecords({
        numberOfDays: getSessionNumberOfDays(found),
        day1StartTime: found.startTime ?? new Date().toISOString(),
        day1StartEvidenceId: null,
      });
      found = await engine.patchCustomFields(found.id, {
        multiDay: true,
        currentDay: 1,
        days,
        totalDailyWorkingMs: null,
      });
    }
    return found;
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!sessionId) {
        setLoading(false);
        return;
      }
      const found = await reload(sessionId);
      if (cancelled) return;
      if (found?.status === 'completed' || found?.status === 'synced') {
        navigate(buildSakiToursOperationCompletedPath(sessionId), { replace: true });
        return;
      }
      if (found && !isMultiDaySession(found)) {
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

  const nextTask: DayTaskId | null = session ? getNextDayTask(session) : null;
  const day = session ? getCurrentDayNumber(session) : 1;

  const onStartTime = async (capture: TimeEvidenceCapture) => {
    if (!sessionId || saving) return;
    setSaving(true);
    setError(null);
    try {
      const next = await commitMultiDayStartTime({ sessionId, capture });
      setSession(next);
      navigate(buildSakiToursOperationPath(sessionId), { replace: true });
    } catch {
      setError(t('toursOps.multiDay.captureFailed'));
    } finally {
      setSaving(false);
    }
  };

  const onEndTime = async (capture: TimeEvidenceCapture) => {
    if (!sessionId || saving) return;
    setSaving(true);
    setError(null);
    try {
      const next = await commitMultiDayEndTime({ sessionId, capture });
      setSession(next);
      navigate(buildSakiToursOperationPath(sessionId), { replace: true });
    } catch {
      setError(t('toursOps.multiDay.captureFailed'));
    } finally {
      setSaving(false);
    }
  };

  const onFinish = async () => {
    if (!sessionId || saving) return;
    if (!endOdometer && session?.endOdometer == null) return;
    setSaving(true);
    setError(null);
    try {
      await commitMultiDayFinish({
        sessionId,
        endOdometer,
        employeeId: session!.employeeId,
      });
      navigate(buildSakiToursOperationCompletedPath(sessionId), { replace: true });
    } catch {
      setError(t('toursOps.multiDay.finishFailed'));
    } finally {
      setSaving(false);
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
          <Button asChild>
            <Link to={paths.sakiTours}>{t('toursOps.success.backHome')}</Link>
          </Button>
        </Card>
      </FadeIn>
    );
  }

  if (!nextTask || nextTask === 'start_odometer') {
    // start_odometer is only Day 1 and already done at Start — return to continue
    return (
      <FadeIn className="mx-auto max-w-lg space-y-4">
        <Card variant="glass" padding="lg" className="space-y-3" data-brand="tours">
          <p className="text-sm text-muted-foreground">{t('toursOps.multiDay.noPendingTask')}</p>
          <Button asChild>
            <Link to={buildSakiToursOperationPath(session.id)}>
              {t('toursOps.multiDay.backToContinue')}
            </Link>
          </Button>
        </Card>
      </FadeIn>
    );
  }

  const kmPreview =
    session.startOdometer != null
      ? (() => {
          const endKm =
            endOdometer != null
              ? parseOdometerNumber(endOdometer.value)
              : session.endOdometer;
          if (endKm == null) return null;
          try {
            return calculateTotalKm(session.startOdometer, endKm);
          } catch {
            return null;
          }
        })()
      : null;

  const canFinish = Boolean(endOdometer || session.endOdometer != null) && Boolean(kmPreview);

  const hoursPreview =
    nextTask === 'end_odometer' || nextTask === 'finish'
      ? getMultiDayTotalWorkingMs(session)
      : null;

  return (
    <FadeIn className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div data-brand="tours" className="contents">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <Badge variant="secondary" className="rounded-md">
              {isFinalDay(session, day)
                ? t('toursOps.multiDay.finalDay')
                : t('toursOps.multiDay.dayLabel', { day })}
            </Badge>
            <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
              {t(`toursOps.multiDay.captureTitle.${nextTask}`)}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t(`toursOps.multiDay.captureHint.${nextTask}`)}
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to={buildSakiToursOperationPath(session.id)}>{t('toursOps.wizard.cancel')}</Link>
          </Button>
        </div>

        <Card variant="glass" padding="lg" className="space-y-5" aria-busy={saving}>
          {nextTask === 'start_work_time' ? (
            <StartTimeCaptureStep
              value={pendingStart}
              disabled={saving}
              onChange={(capture) => {
                setPendingStart(capture);
                if (capture && !saving) void onStartTime(capture);
              }}
            />
          ) : null}

          {nextTask === 'end_work_time' ? (
            <EndTimeCaptureStep
              value={pendingEnd}
              disabled={saving}
              onChange={(capture) => {
                setPendingEnd(capture);
                if (capture && !saving) void onEndTime(capture);
              }}
            />
          ) : null}

          {nextTask === 'end_odometer' || nextTask === 'finish' ? (
            <div className="space-y-5">
              {session.endOdometer == null ? (
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
                  onAccepted={(reading) => setEndOdometer(reading)}
                />
              ) : (
                <p className="rounded-xl bg-success/10 px-3 py-2 text-sm text-success" role="status">
                  {t('toursOps.multiDay.endOdometerAlreadySaved', {
                    value: formatKm(session.endOdometer, i18n.language),
                    unit: t('toursOps.odometer.unit'),
                  })}
                </p>
              )}

              {canFinish ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-primary/10 px-4 py-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t('toursOps.multiDay.totalHours')}
                    </p>
                    <p className="mt-1 font-display text-2xl font-semibold">
                      {formatWorkingHoursLabel(hoursPreview)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-primary/10 px-4 py-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t('toursOps.endTotals.totalKm')}
                    </p>
                    <p className="mt-1 font-display text-2xl font-semibold">
                      {kmPreview
                        ? `${formatKm(kmPreview.totalKm, i18n.language)} ${t('toursOps.odometer.unit')}`
                        : '—'}
                    </p>
                  </div>
                </div>
              ) : null}

              <Button
                type="button"
                size="lg"
                className="w-full sm:w-auto"
                loading={saving}
                disabled={!canFinish || saving}
                onClick={() => void onFinish()}
              >
                {t('toursOps.multiDay.tasks.finish')}
              </Button>
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </Card>
      </div>
    </FadeIn>
  );
}
