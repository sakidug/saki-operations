import { useAppTranslation } from '@saki-operations/i18n';
import { Avatar, AvatarFallback, AvatarImage, Card } from '@saki-operations/ui';
import { motion, useReducedMotion } from 'framer-motion';

import {
  getGreetingPeriod,
  useLiveClock,
} from '@/modules/dashboard/hooks/use-live-clock';
import { getInitials } from '@/lib/get-initials';
import { fadeUpTransition } from '@/lib/motion';

export type HomeHeaderProps = {
  displayName: string;
  roleLabel: string;
  photoUrl?: string | null;
};

export function HomeHeader({ displayName, roleLabel, photoUrl }: HomeHeaderProps) {
  const { t, i18n } = useAppTranslation();
  const reduceMotion = useReducedMotion();
  const { now, hours } = useLiveClock();
  const period = getGreetingPeriod(hours);
  const locale = i18n.language === 'si' ? 'si-LK' : 'en-LK';

  const dateLabel = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);

  const timeLabel = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(now);

  return (
    <motion.section
      aria-label={t('dashboard.header.region')}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={fadeUpTransition(reduceMotion)}
    >
      <Card variant="glass" className="overflow-hidden p-0">
        <div className="relative px-4 py-5 sm:px-6 sm:py-6">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--primary)/0.18),_transparent_55%)]"
          />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <Avatar className="size-14 ring-2 ring-primary/30 sm:size-16">
                {photoUrl ? <AvatarImage src={photoUrl} alt="" /> : null}
                <AvatarFallback className="bg-primary/20 text-base font-semibold text-primary sm:text-lg">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium text-muted-foreground sm:text-base">
                  {t(`dashboard.greeting.${period}`)}
                </p>
                <h1 className="truncate font-display text-xl font-semibold tracking-tight sm:text-2xl">
                  {displayName}
                </h1>
                <p className="truncate text-sm text-muted-foreground">{roleLabel}</p>
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-1 border-t border-border/50 pt-4 sm:items-end sm:border-t-0 sm:pt-0">
              <p className="text-sm text-muted-foreground" data-testid="home-date">
                <span className="sr-only">{t('dashboard.header.date')}</span>
                {dateLabel}
              </p>
              <p
                className="font-mono text-2xl font-semibold tabular-nums tracking-tight text-foreground sm:text-3xl"
                aria-live="polite"
                aria-atomic="true"
                data-testid="home-clock"
              >
                <span className="sr-only">{t('dashboard.header.time')}</span>
                {timeLabel}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </motion.section>
  );
}
