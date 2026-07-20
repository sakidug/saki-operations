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

import { FadeIn } from '@/app/screens/loading/fade-in';
import {
  buildHhcoOperationCompletedPath,
  buildHhcoOperationPath,
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
        navigate(buildHhcoOperationCompletedPath(sessionId), { replace: true });
        return;
      }
      if (found && !isMultiDaySession(found)) {
        navigate(buildHhcoOperationPath(sessionId), { replace: true });
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
      navigate(buildHhcoOperationPath(sessionId), { replace: true });
    } catch {
      setError(t('hhcoOps.multiDay.captureFailed'));
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
      navigate(buildHhcoOperationPath(sessionId), { replace: true });
    } catch {
      setError(t('hhcoOps.multiDay.captureFailed'));
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
      navigate(buildHhcoOperationCompletedPath(sessionId), { replace: true });
    } catch {
      setError(t('hhcoOps.multiDay.finishFailed'));
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
        <Card variant="glass" padding="lg" className="space-y-3" data-brand="hhco">
          <h1 className="font-display text-xl font-semibold">{t('hhcoOps.success.missingTitle')}</h1>
          <Button asChild>
            <Link to={paths.entry}>{t('hhcoOps.success.backHome')}</Link>
          </Button>
        </Card>
      </FadeIn>
    );
  }

  if (!nextTask || nextTask === 'start_odometer') {
    // start_odometer is only Day 1 and already done at Start — return to continue
    return (
      <FadeIn className="mx-auto max-w-lg space-y-4">
        <Card variant="glass" padding="lg" className="space-y-3" data-brand="hhco">
          <p className="text-sm text-muted-foreground">{t('hhcoOps.multiDay.noPendingTask')}</p>
          <Button asChild>
            <Link to={buildHhcoOperationPath(session.id)}>
              {t('hhcoOps.multiDay.backToContinue')}
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
      <div data-brand="hhco" className="contents">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <Badge variant="secondary" className="rounded-md">
              {isFinalDay(session, day)
                ? t('hhcoOps.multiDay.finalDay')
                : t('hhcoOps.multiDay.dayLabel', { day })}
            </Badge>
            <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
              {t(`hhcoOps.multiDay.captureTitle.${nextTask}`)}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t(`hhcoOps.multiDay.captureHint.${nextTask}`)}
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to={buildHhcoOperationPath(session.id)}>{t('hhcoOps.wizard.cancel')}</Link>
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
                    title: t('hhcoOps.endOdometer.title'),
                    description: t('hhcoOps.odometer.description'),
                    capture: t('hhcoOps.endOdometer.capture'),
                    processing: t('hhcoOps.endOdometer.processing'),
                    photoSaved: t('hhcoOps.odometer.photoSaved'),
                    detected: t('hhcoOps.endOdometer.detected'),
                    confidence: t('hhcoOps.endOdometer.confidence'),
                    lowConfidenceWarning: t('hhcoOps.odometer.lowConfidence'),
                    failedWarning: t('hhcoOps.odometer.failed'),
                    accept: t('hhcoOps.endOdometer.accept'),
                    edit: t('hhcoOps.endOdometer.edit'),
                    enterManually: t('hhcoOps.odometer.enterManually'),
                    saveEdit: t('hhcoOps.odometer.saveEdit'),
                    confirmReading: t('hhcoOps.odometer.confirmReading'),
                    cancel: t('hhcoOps.endOdometer.cancelEdit'),
                    retake: t('hhcoOps.endOdometer.retake'),
                    unit: t('hhcoOps.odometer.unit'),
                    saved: t('hhcoOps.odometer.saved'),
                    editedSuffix: t('hhcoOps.odometer.editedSuffix'),
                    photoAlt: t('hhcoOps.odometer.photoAlt'),
                    previousReading: t('hhcoOps.odometer.previousReading'),
                    warningBelowPrevious: t('hhcoOps.odometer.warningBelowPrevious'),
                    warningLargeJump: t('hhcoOps.odometer.warningLargeJump'),
                    warningTooShort: t('hhcoOps.odometer.warningTooShort'),
                    acknowledgeWarning: t('hhcoOps.odometer.acknowledgeWarning'),
                    backspace: t('hhcoOps.odometer.backspace'),
                  }}
                  onAccepted={(reading) => setEndOdometer(reading)}
                />
              ) : (
                <p className="rounded-xl bg-success/10 px-3 py-2 text-sm text-success" role="status">
                  {t('hhcoOps.multiDay.endOdometerAlreadySaved', {
                    value: formatKm(session.endOdometer, i18n.language),
                    unit: t('hhcoOps.odometer.unit'),
                  })}
                </p>
              )}

              {canFinish ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-primary/10 px-4 py-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t('hhcoOps.multiDay.totalHours')}
                    </p>
                    <p className="mt-1 font-display text-2xl font-semibold">
                      {formatWorkingHoursLabel(hoursPreview)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-primary/10 px-4 py-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t('hhcoOps.endTotals.totalKm')}
                    </p>
                    <p className="mt-1 font-display text-2xl font-semibold">
                      {kmPreview
                        ? `${formatKm(kmPreview.totalKm, i18n.language)} ${t('hhcoOps.odometer.unit')}`
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
                {t('hhcoOps.multiDay.tasks.finish')}
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
