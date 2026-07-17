import { Link } from 'react-router-dom';
import type { OperationsSession } from '@saki-operations/operations-session';
import { useAppTranslation } from '@saki-operations/i18n';
import { Badge, Button, Card } from '@saki-operations/ui';

import { buildHhcoOperationPath } from '@/app/router/paths';

import { getMultiDayProgress } from '../lib/multi-day';
import {
  formatOperationTime,
  getSessionHireTypeKey,
  getSessionNumberOfDays,
  getSessionVehicleName,
  isMultiDaySession,
} from '../lib/session-display';

type CurrentOperationCardProps = {
  session: OperationsSession;
};

export function CurrentOperationCard({ session }: CurrentOperationCardProps) {
  const { t, i18n } = useAppTranslation();
  const multiDay = isMultiDaySession(session);
  const progress = multiDay ? getMultiDayProgress(session) : null;
  const totalDays = getSessionNumberOfDays(session);

  return (
    <Card
      variant="glass"
      padding="lg"
      className="space-y-4 border-primary/30"
      data-brand="hhco"
      aria-label={t('hhcoOps.current.title')}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
          {t('hhcoOps.current.title')}
        </h2>
        <Badge variant="success" className="rounded-md">
          {t('hhcoOps.success.inProgress')}
        </Badge>
      </div>

      {multiDay && progress ? (
        <div className="space-y-3">
          <p className="font-display text-lg font-semibold text-foreground">
            {t('hhcoOps.multiDay.tripLabel', {
              days: totalDays,
              hire: t(getSessionHireTypeKey(session)),
            })}
          </p>
          <p className="text-base font-medium text-foreground">
            {t('hhcoOps.multiDay.dayOf', {
              current: progress.currentDay,
              total: progress.totalDays,
            })}
          </p>
          <div
            className="h-2.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label={t('hhcoOps.multiDay.percentComplete', { percent: progress.percent })}
            aria-valuenow={progress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-xl bg-muted/40 px-3 py-2.5">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {t('hhcoOps.current.status')}
              </dt>
              <dd className="mt-1 text-base font-semibold text-foreground">
                {t('hhcoOps.success.inProgress')}
              </dd>
            </div>
            <div className="rounded-xl bg-muted/40 px-3 py-2.5">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {t('hhcoOps.current.vehicle')}
              </dt>
              <dd className="mt-1 text-base font-semibold text-foreground">
                {getSessionVehicleName(session)}
              </dd>
            </div>
          </dl>
        </div>
      ) : (
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-xl bg-muted/40 px-3 py-2.5">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              {t('hhcoOps.current.vehicle')}
            </dt>
            <dd className="mt-1 text-base font-semibold text-foreground">
              {getSessionVehicleName(session)}
            </dd>
          </div>
          <div className="rounded-xl bg-muted/40 px-3 py-2.5">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              {t('hhcoOps.current.dealer')}
            </dt>
            <dd className="mt-1 text-base font-semibold text-foreground">
              {t(getSessionHireTypeKey(session))}
            </dd>
          </div>
          <div className="rounded-xl bg-muted/40 px-3 py-2.5">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              {t('hhcoOps.current.started')}
            </dt>
            <dd className="mt-1 text-base font-semibold text-foreground">
              {formatOperationTime(session.startTime, i18n.language)}
            </dd>
          </div>
          <div className="rounded-xl bg-muted/40 px-3 py-2.5">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              {t('hhcoOps.current.status')}
            </dt>
            <dd className="mt-1 text-base font-semibold text-foreground">
              {t('hhcoOps.success.inProgress')}
            </dd>
          </div>
        </dl>
      )}

      <Button asChild size="lg" className="w-full sm:w-auto">
        <Link to={buildHhcoOperationPath(session.id)}>{t('hhcoOps.current.continue')}</Link>
      </Button>
    </Card>
  );
}
