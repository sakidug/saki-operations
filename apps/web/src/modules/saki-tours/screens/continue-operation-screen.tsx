import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  getDefaultOperationsSessionEngine,
  type OperationsSession,
} from '@saki-operations/operations-session';
import { useAppTranslation } from '@saki-operations/i18n';
import { Badge, Button, Card, LoadingSpinner } from '@saki-operations/ui';

import { FadeIn } from '@/app/screens/loading/fade-in';
import {
  buildSakiToursOperationCompletedPath,
  buildSakiToursOperationDayPath,
  buildSakiToursOperationEndPath,
  paths,
} from '@/app/router/paths';

import { DailyHoursSummary } from '../components/daily-hours-summary';
import { GpsStatusIndicator } from '../components/gps-status-indicator';
import { MultiDayProgressCard } from '../components/multi-day-progress-card';
import { TodayTasksCard } from '../components/today-tasks-card';
import {
  createInitialMultiDayRecords,
  getMultiDayRecords,
  getNextDayTask,
} from '../lib/multi-day';
import {
  formatOperationDateTime,
  getSessionHireTypeKey,
  getSessionNumberOfDays,
  getSessionStringField,
  getSessionVehicleLabel,
  isActiveOperationStatus,
  isMultiDaySession,
} from '../lib/session-display';
import { isMultiDay } from '../types';
import { ensureGpsTrackingForActiveSession } from '../lib/gps-tracking';

/**
 * Continue Operation — single-day End CTA or multi-day progress + today's tasks.
 */
export function ContinueOperationScreen() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { t, i18n } = useAppTranslation();
  const navigate = useNavigate();
  const [session, setSession] = useState<OperationsSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!sessionId) {
        setLoading(false);
        return;
      }
      const engine = getDefaultOperationsSessionEngine();
      let found = await engine.getSession(sessionId);
      if (cancelled) return;

      if (found?.status === 'completed' || found?.status === 'synced') {
        navigate(buildSakiToursOperationCompletedPath(sessionId), { replace: true });
        return;
      }

      if (found && isMultiDaySession(found) && getMultiDayRecords(found).length === 0) {
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

      setSession(found);
      ensureGpsTrackingForActiveSession(found);
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [navigate, sessionId]);

  if (loading) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center">
        <LoadingSpinner label={t('shell.loading.module')} />
      </div>
    );
  }

  if (!session || !isActiveOperationStatus(session.status)) {
    return (
      <FadeIn className="mx-auto max-w-lg space-y-4">
        <Card variant="glass" padding="lg" className="space-y-3" data-brand="tours">
          <h1 className="font-display text-xl font-semibold">{t('toursOps.success.missingTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('toursOps.continue.notActive')}</p>
          <Button asChild>
            <Link to={paths.entry}>{t('toursOps.success.backHome')}</Link>
          </Button>
        </Card>
      </FadeIn>
    );
  }

  const days = getSessionNumberOfDays(session);
  const multiDay = isMultiDaySession(session);
  const nextTask = multiDay ? getNextDayTask(session) : null;

  return (
    <FadeIn className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div data-brand="tours" className="contents">
        <header className="space-y-2">
          <Badge variant="success" className="rounded-md">
            {t('toursOps.success.inProgress')}
          </Badge>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {t('toursOps.continue.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {multiDay
              ? t('toursOps.multiDay.continueDescription')
              : t('toursOps.continue.description')}
          </p>
        </header>

        {multiDay ? (
          <>
            <MultiDayProgressCard session={session} />
            <TodayTasksCard session={session} />
            <DailyHoursSummary session={session} />
          </>
        ) : null}

        <Card variant="glass" padding="lg" className="space-y-4">
          <GpsStatusIndicator session={session} />

          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Detail
              label={t('toursOps.continue.vehicle')}
              value={getSessionVehicleLabel(session)}
            />
            <Detail
              label={t('toursOps.continue.hireType')}
              value={t(getSessionHireTypeKey(session))}
            />
            <Detail
              label={t('toursOps.continue.startLocation')}
              value={getSessionStringField(session, 'startLocation')}
            />
            <Detail
              label={t('toursOps.continue.destination')}
              value={getSessionStringField(session, 'destination')}
            />
            <Detail
              label={t('toursOps.continue.endingLocation')}
              value={getSessionStringField(session, 'endingLocation')}
            />
            <Detail
              label={t('toursOps.continue.numberOfDays')}
              value={
                <>
                  {days}
                  {isMultiDay(days) ? (
                    <Badge variant="warning" className="ml-2 rounded-md">
                      {t('toursOps.trip.multiDayBadge')}
                    </Badge>
                  ) : null}
                </>
              }
            />
            <Detail
              label={t('toursOps.continue.startedTime')}
              value={formatOperationDateTime(session.startTime, i18n.language)}
            />
            <Detail
              label={t('toursOps.continue.status')}
              value={
                <Badge variant="success" className="rounded-md">
                  {t('toursOps.success.inProgress')}
                </Badge>
              }
            />
          </dl>

          <div className="flex flex-wrap gap-3 border-t border-border/60 pt-4">
            {multiDay ? (
              <Button asChild size="lg" disabled={!nextTask || nextTask === 'start_odometer'}>
                <Link to={buildSakiToursOperationDayPath(session.id)}>
                  {nextTask === 'finish' || nextTask === 'end_odometer'
                    ? t('toursOps.multiDay.continueFinish')
                    : t('toursOps.multiDay.continueTasks')}
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg">
                <Link to={buildSakiToursOperationEndPath(session.id)}>
                  {t('toursOps.continue.endOperation')}
                </Link>
              </Button>
            )}
            <Button asChild variant="secondary">
              <Link to={paths.entry}>{t('toursOps.continue.backHome')}</Link>
            </Button>
          </div>
        </Card>
      </div>
    </FadeIn>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl bg-muted/40 px-3 py-2.5">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium text-foreground">{value}</dd>
    </div>
  );
}
