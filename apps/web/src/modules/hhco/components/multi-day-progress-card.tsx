import type { OperationsSession } from '@saki-operations/operations-session';
import { useAppTranslation } from '@saki-operations/i18n';
import { Card, cn } from '@saki-operations/ui';
import { motion, useReducedMotion } from 'framer-motion';

import { fadeUpTransition } from '@/lib/motion';

import { getMultiDayProgress } from '../lib/multi-day';
import { getSessionHireTypeKey } from '../lib/session-display';

type MultiDayProgressCardProps = {
  session: OperationsSession;
  className?: string;
};

export function MultiDayProgressCard({ session, className }: MultiDayProgressCardProps) {
  const { t } = useAppTranslation();
  const reduceMotion = useReducedMotion();
  const { currentDay, totalDays, percent } = getMultiDayProgress(session);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={fadeUpTransition(reduceMotion, 0)}
    >
      <Card variant="glass" padding="lg" className={cn('space-y-4', className)}>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('hhcoOps.multiDay.tripLabel', {
              days: totalDays,
              hire: t(getSessionHireTypeKey(session)),
            })}
          </p>
          <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
            {t('hhcoOps.multiDay.dayOf', { current: currentDay, total: totalDays })}
          </h2>
        </div>

        <div
          className="h-3 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t('hhcoOps.multiDay.percentComplete', { percent })}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>

        <p className="text-sm font-medium text-foreground">
          {t('hhcoOps.multiDay.percentComplete', { percent })}
        </p>
      </Card>
    </motion.div>
  );
}
