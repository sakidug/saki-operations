import { Link } from 'react-router-dom';
import { useAppTranslation } from '@saki-operations/i18n';
import { Badge, cn, LoadingSpinner } from '@saki-operations/ui';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, History, PlayCircle } from 'lucide-react';

import { useSession } from '@/app/bootstrap/session-provider';
import { FadeIn } from '@/app/screens/loading/fade-in';
import { paths } from '@/app/router/paths';
import { fadeUpTransition } from '@/lib/motion';

import { CurrentOperationCard } from '../components/current-operation-card';
import { useActiveHhcoSession } from '../hooks/use-active-hhco-session';

/**
 * Saki Tours Operations home — current operation + Start / history actions.
 */
export function HhcoHomeScreen() {
  const { t } = useAppTranslation();
  const { user } = useSession();
  const reduceMotion = useReducedMotion();
  const { session: activeSession, loading } = useActiveHhcoSession(user?.employeeId);
  const hasActive = Boolean(activeSession);

  return (
    <FadeIn className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div data-brand="hhco" className="contents">
        <header className="space-y-2">
          <Badge variant="secondary" className="rounded-md">
            {t('hhcoOps.badge')}
          </Badge>
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('hhcoOps.home.title')}
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
            {t('hhcoOps.home.description')}
          </p>
        </header>

        {loading ? (
          <div className="flex min-h-[6rem] items-center justify-center">
            <LoadingSpinner label={t('shell.loading.module')} />
          </div>
        ) : activeSession ? (
          <CurrentOperationCard session={activeSession} />
        ) : null}

        <motion.nav
          aria-label={t('hhcoOps.home.actionsRegion')}
          className="flex flex-col gap-3"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={fadeUpTransition(reduceMotion, 0.05)}
        >
          {!hasActive ? (
            <Link
              to={paths.hhcoStart}
              className={cn(
                'group glass flex items-center gap-4 rounded-2xl border border-glass-border p-4',
                'transition duration-200 hover:brightness-110',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              )}
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <PlayCircle className="size-6" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold text-foreground">
                  {t('hhcoOps.home.startNew')}
                </span>
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  {t('hhcoOps.home.startNewHint')}
                </span>
              </span>
              <ArrowRight
                className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          ) : null}

          <Link
            to={paths.hhcoHistory}
            className={cn(
              'group glass flex items-center gap-4 rounded-2xl border border-glass-border p-4',
              'transition duration-200 hover:brightness-110',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            )}
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <History className="size-6" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-semibold text-foreground">
                {t('hhcoOps.home.viewPrevious')}
              </span>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                {t('hhcoOps.home.viewPreviousHint')}
              </span>
            </span>
            <ArrowRight
              className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </motion.nav>
      </div>
    </FadeIn>
  );
}
