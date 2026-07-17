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
  buildHhcoOperationCompletedPath,
  buildHhcoOperationDayPath,
  buildHhcoOperationEndPath,
  paths,
} from '@/app/router/paths';

import { DailyHoursSummary } from '../components/daily-hours-summary';
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
        navigate(buildHhcoOperationCompletedPath(sessionId), { replace: true });
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
        <Card variant="glass" padding="lg" className="space-y-3" data-brand="hhco">
          <h1 className="font-display text-xl font-semibold">{t('hhcoOps.success.missingTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('hhcoOps.continue.notActive')}</p>
          <Button asChild>
            <Link to={paths.hhco}>{t('hhcoOps.success.backHome')}</Link>
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
      <div data-brand="hhco" className="contents">
        <header className="space-y-2">
          <Badge variant="success" className="rounded-md">
            {t('hhcoOps.success.inProgress')}
          </Badge>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {t('hhcoOps.continue.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {multiDay
              ? t('hhcoOps.multiDay.continueDescription')
              : t('hhcoOps.continue.description')}
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
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Detail
              label={t('hhcoOps.continue.vehicle')}
              value={getSessionVehicleLabel(session)}
            />
            <Detail
              label={t('hhcoOps.continue.dealer')}
              value={t(getSessionHireTypeKey(session))}
            />
            <Detail
              label={t('hhcoOps.continue.startLocation')}
              value={getSessionStringField(session, 'startLocation')}
            />
            <Detail
              label={t('hhcoOps.continue.destination')}
              value={getSessionStringField(session, 'destination')}
            />
            <Detail
              label={t('hhcoOps.continue.endingLocation')}
              value={getSessionStringField(session, 'endingLocation')}
            />
            <Detail
              label={t('hhcoOps.continue.numberOfDays')}
              value={
                <>
                  {days}
                  {isMultiDay(days) ? (
                    <Badge variant="warning" className="ml-2 rounded-md">
                      {t('hhcoOps.trip.multiDayBadge')}
                    </Badge>
                  ) : null}
                </>
              }
            />
            <Detail
              label={t('hhcoOps.continue.startedTime')}
              value={formatOperationDateTime(session.startTime, i18n.language)}
            />
            <Detail
              label={t('hhcoOps.continue.status')}
              value={
                <Badge variant="success" className="rounded-md">
                  {t('hhcoOps.success.inProgress')}
                </Badge>
              }
            />
          </dl>

          <div className="flex flex-wrap gap-3 border-t border-border/60 pt-4">
            {multiDay ? (
              <Button asChild size="lg" disabled={!nextTask || nextTask === 'start_odometer'}>
                <Link to={buildHhcoOperationDayPath(session.id)}>
                  {nextTask === 'finish' || nextTask === 'end_odometer'
                    ? t('hhcoOps.multiDay.continueFinish')
                    : t('hhcoOps.multiDay.continueTasks')}
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg">
                <Link to={buildHhcoOperationEndPath(session.id)}>
                  {t('hhcoOps.continue.endOperation')}
                </Link>
              </Button>
            )}
            <Button asChild variant="secondary">
              <Link to={paths.hhco}>{t('hhcoOps.continue.backHome')}</Link>
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
