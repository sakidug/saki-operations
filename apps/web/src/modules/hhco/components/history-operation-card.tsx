import { Link } from 'react-router-dom';
import type { OperationsSession } from '@saki-operations/operations-session';
import { useAppTranslation } from '@saki-operations/i18n';
import { Badge, cn } from '@saki-operations/ui';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import { buildHhcoHistoryDetailPath } from '@/app/router/paths';
import { fadeUpTransition } from '@/lib/motion';

import { formatHistoryDateRange, getSessionWorkingMs } from '../lib/history';
import {
  historySyncBadgeVariant,
  historySyncForSession,
  historySyncLabelKey,
} from '../lib/history-sync-ui';
import {
  formatKm,
  formatOperationTime,
  formatWorkingHoursLabel,
  getSessionHireTypeKey,
  getSessionNumberOfDays,
  getSessionVehicleName,
  isMultiDaySession,
} from '../lib/session-display';

type HistoryOperationCardProps = {
  session: OperationsSession;
  index?: number;
};

export function HistoryOperationCard({ session, index = 0 }: HistoryOperationCardProps) {
  const { t, i18n } = useAppTranslation();
  const reduceMotion = useReducedMotion();
  const multiDay = isMultiDaySession(session);
  const sync = historySyncForSession(session);
  const days = getSessionNumberOfDays(session);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={fadeUpTransition(reduceMotion, Math.min(index, 12) * 0.04)}
    >
      <Link
        to={buildHhcoHistoryDetailPath(session.id)}
        className={cn(
          'group glass flex flex-col gap-3 rounded-2xl border border-glass-border p-4',
          'transition duration-200 hover:brightness-110',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {multiDay
                ? t('hhcoOps.history.card.multiDay')
                : t('hhcoOps.history.card.singleDay')}
            </p>
            <h3 className="font-display text-lg font-semibold tracking-tight text-foreground">
              {multiDay
                ? t('hhcoOps.multiDay.tripLabel', {
                    days,
                    hire: t(getSessionHireTypeKey(session)),
                  })
                : t(getSessionHireTypeKey(session))}
            </h3>
            <p className="text-sm text-muted-foreground">
              {formatHistoryDateRange(session, i18n.language)}
            </p>
          </div>
          <Badge variant={historySyncBadgeVariant(sync)} className="shrink-0 rounded-md">
            {t(historySyncLabelKey(sync))}
          </Badge>
        </div>

        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="sr-only">{t('hhcoOps.history.card.vehicle')}</dt>
            <dd className="font-medium text-foreground">{getSessionVehicleName(session)}</dd>
          </div>

          {multiDay ? (
            <div>
              <dt className="sr-only">{t('hhcoOps.continue.numberOfDays')}</dt>
              <dd className="text-muted-foreground">
                {t('hhcoOps.history.card.daysCount', { count: days })}
              </dd>
            </div>
          ) : (
            <div>
              <dt className="sr-only">{t('hhcoOps.history.card.timeRange')}</dt>
              <dd className="text-muted-foreground">
                {formatOperationTime(session.startTime, i18n.language)}
                {' → '}
                {formatOperationTime(session.endTime, i18n.language)}
              </dd>
            </div>
          )}

          <div>
            <dt className="sr-only">{t('hhcoOps.history.card.hours')}</dt>
            <dd className="font-medium text-foreground">
              {formatWorkingHoursLabel(getSessionWorkingMs(session))}
            </dd>
          </div>
          <div>
            <dt className="sr-only">{t('hhcoOps.history.card.km')}</dt>
            <dd className="font-medium text-foreground">
              {formatKm(session.totalKm, i18n.language)} {t('hhcoOps.odometer.unit')}
            </dd>
          </div>
        </dl>

        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-90 transition group-hover:opacity-100">
          {t('hhcoOps.history.card.open')}
          <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" aria-hidden />
        </span>
      </Link>
    </motion.div>
  );
}
