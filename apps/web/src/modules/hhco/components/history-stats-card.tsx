import type { OperationsSession } from '@saki-operations/operations-session';
import { useAppTranslation } from '@saki-operations/i18n';
import { Card, cn } from '@saki-operations/ui';

import {
  computeMonthStats,
  formatCompactHours,
} from '../lib/history';
import { formatKm } from '../lib/session-display';

type HistoryStatsCardProps = {
  sessions: OperationsSession[];
  className?: string;
};

export function HistoryStatsCard({ sessions, className }: HistoryStatsCardProps) {
  const { t, i18n } = useAppTranslation();
  const stats = computeMonthStats(sessions);

  return (
    <Card variant="glass" padding="lg" className={cn('space-y-4', className)}>
      <h2 className="font-display text-lg font-semibold tracking-tight">
        {t('hhcoOps.history.stats.title')}
      </h2>
      <dl className="grid grid-cols-3 gap-3 text-center sm:text-left">
        <div className="rounded-xl bg-muted/40 px-3 py-3">
          <dt className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
            {t('hhcoOps.history.stats.operations')}
          </dt>
          <dd className="mt-1 font-display text-2xl font-semibold tabular-nums text-foreground">
            {stats.operations}
          </dd>
        </div>
        <div className="rounded-xl bg-muted/40 px-3 py-3">
          <dt className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
            {t('hhcoOps.history.stats.workingHours')}
          </dt>
          <dd className="mt-1 font-display text-2xl font-semibold tabular-nums text-foreground">
            {formatCompactHours(stats.workingDurationMs)}
          </dd>
        </div>
        <div className="rounded-xl bg-muted/40 px-3 py-3">
          <dt className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
            {t('hhcoOps.history.stats.totalKm')}
          </dt>
          <dd className="mt-1 font-display text-2xl font-semibold tabular-nums text-foreground">
            {formatKm(stats.totalKm, i18n.language)}
            <span className="ml-1 text-sm font-medium text-muted-foreground">
              {t('hhcoOps.odometer.unit')}
            </span>
          </dd>
        </div>
      </dl>
    </Card>
  );
}
