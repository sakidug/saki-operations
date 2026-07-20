import { motion, useReducedMotion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Languages, Play, Settings2, Truck } from 'lucide-react';
import { Button, Card, LoadingSpinner } from '@saki-operations/ui';
import { useAppTranslation } from '@saki-operations/i18n';

import { buildActiveOperationContinuePath } from '@/app/operations/find-active-operation';
import { useAnyActiveOperation } from '@/app/operations/use-any-active-operation';
import { FullScreenLayout } from '@/app/layouts/shell-layouts';
import { paths } from '@/app/router/paths';
import { fadeUpTransition } from '@/lib/motion';

/**
 * Guest landing screen — field staff start/continue without JWT auth.
 * Admin / office authentication is only via Admin Login.
 */
export function EmployeeEntryScreen() {
  const { t } = useAppTranslation();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { session: activeSession, loading } = useAnyActiveOperation();

  const hasActive = Boolean(activeSession);
  const continuePath = activeSession
    ? buildActiveOperationContinuePath(activeSession)
    : paths.sakiToursStart;

  return (
    <FullScreenLayout className="dark flex items-center justify-center px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_hsl(var(--brand-tours)/0.28),_transparent_42%),radial-gradient(circle_at_80%_70%,_hsl(var(--brand-hhco)/0.18),_transparent_40%)]"
      />
      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={fadeUpTransition(reduceMotion)}
      >
        <Card variant="glass" padding="lg" className="space-y-8 overflow-hidden">
          <div className="space-y-3 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-primary/10 p-2.5 ring-1 ring-primary/20">
              <img src="/favicon.svg" alt="" className="size-10" />
            </div>
            <div className="space-y-1">
              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                {t('entry.title')}
              </h1>
              <p className="text-base text-muted-foreground">{t('entry.subtitle')}</p>
            </div>
          </div>

          {loading ? (
            <div
              className="flex min-h-28 flex-col items-center justify-center gap-3"
              role="status"
              aria-live="polite"
            >
              <LoadingSpinner label={t('shell.loading.application')} size="md" />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {hasActive ? (
                <Button
                  type="button"
                  size="xl"
                  className="min-h-16 w-full justify-center gap-3 text-lg"
                  onClick={() => navigate(continuePath)}
                >
                  <Play className="size-6" aria-hidden />
                  {t('entry.continueOperation')}
                </Button>
              ) : (
                <Button asChild size="xl" className="min-h-16 w-full justify-center gap-3 text-lg">
                  <Link to={paths.sakiToursStart}>
                    <Truck className="size-6" aria-hidden />
                    {t('entry.startOperation')}
                  </Link>
                </Button>
              )}

              <Button asChild variant="outline" size="xl" className="min-h-14 w-full gap-3 text-base">
                <Link to={paths.language}>
                  <Languages className="size-5" aria-hidden />
                  {t('entry.language')}
                </Link>
              </Button>
            </div>
          )}

          <div className="border-t border-border/60 pt-4">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="mx-auto flex w-full max-w-xs gap-2 text-muted-foreground"
            >
              <Link to={paths.login}>
                <Settings2 className="size-4" aria-hidden />
                {t('entry.adminLogin')}
              </Link>
            </Button>
          </div>
        </Card>
      </motion.div>
    </FullScreenLayout>
  );
}
