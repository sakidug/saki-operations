import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getDefaultOperationsSessionEngine,
  type OperationsSession,
} from '@saki-operations/operations-session';
import { useAppTranslation } from '@saki-operations/i18n';
import { Badge, Button, Card, LoadingSpinner } from '@saki-operations/ui';
import { CheckCircle2 } from 'lucide-react';

import { FadeIn } from '@/app/screens/loading/fade-in';
import { buildSakiToursHistoryDetailPath, paths } from '@/app/router/paths';

import {
  formatKm,
  formatWorkingHoursLabel,
  getSessionNumberOfDays,
  getSessionVehicleLabel,
  isMultiDaySession,
} from '../lib/session-display';
import { getMultiDayTotalWorkingMs } from '../lib/multi-day';

/**
 * Post-complete confirmation — sync status from Session Engine.
 */
export function OperationCompletedScreen() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { t, i18n } = useAppTranslation();
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
      const found = await engine.getSession(sessionId);
      if (!cancelled) {
        setSession(found);
        setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center">
        <LoadingSpinner label={t('shell.loading.module')} />
      </div>
    );
  }

  if (!session || (session.status !== 'completed' && session.status !== 'synced')) {
    return (
      <FadeIn className="mx-auto max-w-lg space-y-4">
        <Card variant="glass" padding="lg" className="space-y-3" data-brand="tours">
          <h1 className="font-display text-xl font-semibold">{t('toursOps.success.missingTitle')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('toursOps.completed.missingDescription')}
          </p>
          <Button asChild>
            <Link to={paths.sakiTours}>{t('toursOps.success.backHome')}</Link>
          </Button>
        </Card>
      </FadeIn>
    );
  }

  const synced = session.status === 'synced' || session.uploadStatus === 'synced';
  const multiDay = isMultiDaySession(session);
  const workingMs = multiDay
    ? getMultiDayTotalWorkingMs(session)
    : session.workingDurationMs;

  return (
    <FadeIn className="mx-auto flex w-full max-w-lg flex-col gap-5">
      <Card
        variant="glass"
        padding="lg"
        className="space-y-5 text-center sm:text-left"
        data-brand="tours"
      >
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-success/15 text-success sm:mx-0">
          <CheckCircle2 className="size-7" aria-hidden />
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {t('toursOps.completed.title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('toursOps.completed.description')}</p>
        </div>

        <dl className="grid gap-3 text-left text-sm">
          <div className="rounded-xl bg-muted/40 px-3 py-2.5">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              {t('toursOps.completed.vehicle')}
            </dt>
            <dd className="mt-1 font-medium text-foreground">
              {getSessionVehicleLabel(session)}
            </dd>
          </div>
          {multiDay ? (
            <div className="rounded-xl bg-muted/40 px-3 py-2.5">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {t('toursOps.continue.numberOfDays')}
              </dt>
              <dd className="mt-1 font-medium text-foreground">
                {getSessionNumberOfDays(session)}
              </dd>
            </div>
          ) : null}
          <div className="rounded-xl bg-muted/40 px-3 py-2.5">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              {t('toursOps.completed.workingHours')}
            </dt>
            <dd className="mt-1 font-medium text-foreground">
              {formatWorkingHoursLabel(workingMs)}
            </dd>
          </div>
          <div className="rounded-xl bg-muted/40 px-3 py-2.5">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              {t('toursOps.completed.totalKm')}
            </dt>
            <dd className="mt-1 font-medium text-foreground">
              {formatKm(session.totalKm, i18n.language)} {t('toursOps.odometer.unit')}
            </dd>
          </div>
          <div className="rounded-xl bg-muted/40 px-3 py-2.5">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              {t('toursOps.completed.syncStatus')}
            </dt>
            <dd className="mt-1">
              <Badge variant={synced ? 'success' : 'warning'} className="rounded-md">
                {synced
                  ? t('toursOps.completed.syncSynced')
                  : t('toursOps.completed.syncWaiting')}
              </Badge>
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-3 pt-1">
          <Button asChild>
            <Link to={paths.sakiTours}>{t('toursOps.completed.returnHome')}</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to={buildSakiToursHistoryDetailPath(session.id)}>
              {t('toursOps.completed.viewOperation')}
            </Link>
          </Button>
        </div>
      </Card>
    </FadeIn>
  );
}
