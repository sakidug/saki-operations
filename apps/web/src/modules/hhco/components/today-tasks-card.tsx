import type { OperationsSession } from '@saki-operations/operations-session';
import { useAppTranslation } from '@saki-operations/i18n';
import { Card, cn } from '@saki-operations/ui';
import { Check, Circle } from 'lucide-react';

import {
  getCurrentDayNumber,
  getDayTasks,
  isFinalDay,
  type DayTaskId,
} from '../lib/multi-day';

type TodayTasksCardProps = {
  session: OperationsSession;
  className?: string;
};

function taskLabelKey(id: DayTaskId): string {
  switch (id) {
    case 'start_work_time':
      return 'hhcoOps.multiDay.tasks.startWorkTime';
    case 'start_odometer':
      return 'hhcoOps.multiDay.tasks.startOdometer';
    case 'end_work_time':
      return 'hhcoOps.multiDay.tasks.endWorkTime';
    case 'end_odometer':
      return 'hhcoOps.multiDay.tasks.endOdometer';
    case 'finish':
      return 'hhcoOps.multiDay.tasks.finish';
    default:
      return 'hhcoOps.multiDay.tasks.startWorkTime';
  }
}

export function TodayTasksCard({ session, className }: TodayTasksCardProps) {
  const { t } = useAppTranslation();
  const day = getCurrentDayNumber(session);
  const tasks = getDayTasks(session, day);
  const final = isFinalDay(session, day);

  return (
    <Card variant="glass" padding="lg" className={cn('space-y-4', className)}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {final ? t('hhcoOps.multiDay.finalDay') : t('hhcoOps.multiDay.dayLabel', { day })}
        </p>
        <h2 className="mt-1 font-display text-lg font-semibold tracking-tight">
          {t('hhcoOps.multiDay.todaysTasks')}
        </h2>
      </div>

      <ul className="space-y-2.5" aria-label={t('hhcoOps.multiDay.todaysTasks')}>
        {tasks.map((task) => (
          <li
            key={task.id}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5',
              task.done ? 'bg-success/10 text-foreground' : 'bg-muted/40 text-muted-foreground',
            )}
          >
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full',
                task.done ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground',
              )}
              aria-hidden
            >
              {task.done ? <Check className="size-4" /> : <Circle className="size-4" />}
            </span>
            <span className={cn('text-sm font-medium', task.done && 'text-foreground')}>
              {t(taskLabelKey(task.id))}
            </span>
            <span className="sr-only">
              {task.done ? t('hhcoOps.multiDay.taskDone') : t('hhcoOps.multiDay.taskPending')}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
