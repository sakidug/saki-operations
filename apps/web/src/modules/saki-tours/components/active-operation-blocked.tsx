import { Link } from 'react-router-dom';
import type { OperationsSession } from '@saki-operations/operations-session';
import { useAppTranslation } from '@saki-operations/i18n';
import { Button, Card } from '@saki-operations/ui';
import { TriangleAlert } from 'lucide-react';

import { buildSakiToursOperationPath, paths } from '@/app/router/paths';

import {
  formatOperationTime,
  getSessionHireTypeKey,
  getSessionVehicleName,
} from '../lib/session-display';

type ActiveOperationBlockedProps = {
  session: OperationsSession;
};

/**
 * Blocks Start New Operation when an active session already exists.
 */
export function ActiveOperationBlocked({ session }: ActiveOperationBlockedProps) {
  const { t, i18n } = useAppTranslation();

  return (
    <Card variant="glass" padding="lg" className="space-y-5" data-brand="tours" role="alert">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-warning/15 text-warning">
          <TriangleAlert className="size-6" aria-hidden />
        </span>
        <div className="space-y-1">
          <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
            {t('toursOps.active.blockedTitle')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('toursOps.active.blockedDescription')}</p>
        </div>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-3">
        <div className="rounded-xl bg-muted/40 px-3 py-2.5">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            {t('toursOps.active.vehicle')}
          </dt>
          <dd className="mt-1 font-medium text-foreground">{getSessionVehicleName(session)}</dd>
        </div>
        <div className="rounded-xl bg-muted/40 px-3 py-2.5">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            {t('toursOps.active.hireType')}
          </dt>
          <dd className="mt-1 font-medium text-foreground">{t(getSessionHireTypeKey(session))}</dd>
        </div>
        <div className="rounded-xl bg-muted/40 px-3 py-2.5">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            {t('toursOps.active.started')}
          </dt>
          <dd className="mt-1 font-medium text-foreground">
            {formatOperationTime(session.startTime, i18n.language)}
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link to={buildSakiToursOperationPath(session.id)}>
            {t('toursOps.active.continue')}
          </Link>
        </Button>
        <Button asChild variant="secondary" size="lg">
          <Link to={paths.sakiTours}>{t('toursOps.active.cancel')}</Link>
        </Button>
      </div>
    </Card>
  );
}
