import { useAppTranslation } from '@saki-operations/i18n';
import { Badge, Card, cn } from '@saki-operations/ui';
import { motion, useReducedMotion } from 'framer-motion';

import { fadeUpTransition } from '@/lib/motion';

import type { TimelineEvent } from '../lib/history';
import { formatKm, formatOperationDateTime, formatOperationTime } from '../lib/session-display';

type OperationTimelineProps = {
  events: TimelineEvent[];
  endOdometer: number | null;
  locale: string;
};

export function OperationTimeline({ events, endOdometer, locale }: OperationTimelineProps) {
  const { t } = useAppTranslation();
  const reduceMotion = useReducedMotion();

  return (
    <Card variant="glass" padding="lg" className="space-y-4">
      <h2 className="font-display text-lg font-semibold tracking-tight">
        {t('hhcoOps.history.timeline.title')}
      </h2>

      <ol className="relative space-y-0">
        {events.map((event, index) => {
          const isLast = index === events.length - 1;
          return (
            <motion.li
              key={event.id}
              className="relative flex gap-4 pb-6 last:pb-0"
              initial={reduceMotion ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={fadeUpTransition(reduceMotion, index * 0.05)}
            >
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    'z-10 mt-1 size-3 shrink-0 rounded-full ring-4 ring-background',
                    event.kind === 'completed' ? 'bg-success' : 'bg-primary',
                  )}
                  aria-hidden
                />
                {!isLast ? (
                  <span className="mt-1 w-px flex-1 bg-border" aria-hidden />
                ) : null}
              </div>

              <div className="min-w-0 flex-1 space-y-1 pb-1">
                {event.kind === 'day' ? (
                  <>
                    <p className="font-semibold text-foreground">
                      {t(event.titleKey, { day: event.day })}
                    </p>
                    <div className="rounded-xl bg-muted/40 px-3 py-2 text-sm">
                      <p className="text-muted-foreground">
                        {t('hhcoOps.history.timeline.startTime')}:{' '}
                        <span className="font-medium text-foreground">
                          {formatOperationTime(event.startTime, locale)}
                        </span>
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        {t('hhcoOps.history.timeline.endTime')}:{' '}
                        <span className="font-medium text-foreground">
                          {formatOperationTime(event.endTime, locale)}
                        </span>
                      </p>
                      {event.showEndOdometer && endOdometer != null ? (
                        <p className="mt-1 text-muted-foreground">
                          {t('hhcoOps.history.timeline.endOdometer')}:{' '}
                          <span className="font-medium text-foreground">
                            {formatKm(endOdometer, locale)}
                          </span>
                        </p>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">{t(event.titleKey)}</p>
                      {event.kind === 'completed' ? (
                        <Badge variant="success" className="rounded-md">
                          {t('hhcoOps.history.timeline.done')}
                        </Badge>
                      ) : null}
                    </div>
                    {event.timestamp ? (
                      <p className="text-sm text-muted-foreground">
                        {formatOperationDateTime(event.timestamp, locale)}
                      </p>
                    ) : null}
                    {event.subtitle ? (
                      <p className="text-sm font-medium text-foreground">
                        {event.kind === 'start_odometer' || event.kind === 'end_odometer'
                          ? `${formatKm(Number(event.subtitle), locale)} ${t('hhcoOps.odometer.unit')}`
                          : event.subtitle}
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            </motion.li>
          );
        })}
      </ol>
    </Card>
  );
}
