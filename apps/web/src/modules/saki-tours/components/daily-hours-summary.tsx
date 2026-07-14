import type { OperationsSession } from '@saki-operations/operations-session';
import { useAppTranslation } from '@saki-operations/i18n';
import { Card, cn } from '@saki-operations/ui';

import {
  getMultiDayRecords,
  getMultiDayTotalWorkingMs,
} from '../lib/multi-day';
import { formatWorkingHoursLabel } from '../lib/session-display';

type DailyHoursSummaryProps = {
  session: OperationsSession;
  className?: string;
};

export function DailyHoursSummary({ session, className }: DailyHoursSummaryProps) {
  const { t } = useAppTranslation();
  const days = getMultiDayRecords(session).filter((d) => d.workingDurationMs != null);
  const totalMs = getMultiDayTotalWorkingMs(session);

  if (days.length === 0 && totalMs == null) return null;

  return (
    <Card variant="glass" padding="lg" className={cn('space-y-3', className)}>
      <h2 className="font-display text-lg font-semibold tracking-tight">
        {t('toursOps.multiDay.hoursTitle')}
      </h2>
      <ul className="space-y-2 text-sm">
        {days.map((day) => (
          <li
            key={day.day}
            className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2"
          >
            <span className="text-muted-foreground">
              {t('toursOps.multiDay.dayLabel', { day: day.day })}
            </span>
            <span className="font-medium text-foreground">
              {formatWorkingHoursLabel(day.workingDurationMs)}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-border/60 pt-3 text-sm">
        <span className="font-semibold text-foreground">{t('toursOps.multiDay.totalHours')}</span>
        <span className="font-display text-lg font-semibold text-foreground">
          {formatWorkingHoursLabel(totalMs)}
        </span>
      </div>
    </Card>
  );
}
