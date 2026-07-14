import { motion, useReducedMotion } from 'framer-motion';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@saki-operations/ui';
import { useAppTranslation } from '@saki-operations/i18n';

import { useBootstrap } from '@/app/bootstrap/bootstrap-provider';
import { useSession } from '@/app/bootstrap/session-provider';
import { FullScreenLayout } from '@/app/layouts/shell-layouts';
import { paths } from '@/app/router/paths';
import { AnimatedLogo } from '@/app/screens/loading/loading-experience';

export function SplashScreen() {
  const { t } = useAppTranslation();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { splashComplete, snapshot, status } = useBootstrap();
  const { status: sessionStatus, isAuthenticated } = useSession();

  const waitingOnSession = sessionStatus === 'loading';
  const statusMessage = waitingOnSession
    ? t('shell.loading.authentication')
    : status === 'booting'
      ? t('shell.loading.application')
      : t('shell.loading.workspace');

  useEffect(() => {
    if (!splashComplete || status === 'booting' || sessionStatus === 'loading') return;

    if (snapshot && !snapshot.languageSelected) {
      navigate(paths.language, { replace: true });
      return;
    }

    navigate(isAuthenticated ? paths.home : paths.login, { replace: true });
  }, [splashComplete, snapshot, status, sessionStatus, isAuthenticated, navigate]);

  return (
    <FullScreenLayout className="dark flex items-center justify-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_hsl(var(--brand-tours)/0.28),_transparent_42%),radial-gradient(circle_at_80%_70%,_hsl(var(--brand-hhco)/0.18),_transparent_40%)]"
      />
      <motion.div
        className="glass relative z-10 mx-4 flex w-full max-w-md flex-col items-center gap-6 rounded-3xl px-8 py-12 text-center"
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={statusMessage}
        initial={reduceMotion ? false : { opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <AnimatedLogo />
        <div className="space-y-2">
          <motion.h1
            className="text-2xl font-bold tracking-tight sm:text-3xl"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0 } : { delay: 0.15 }}
          >
            {t('app.name')}
          </motion.h1>
          <motion.p
            className="text-sm text-muted-foreground sm:text-base"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0 } : { delay: 0.28 }}
          >
            {t('app.tagline')}
          </motion.p>
        </div>
        <LoadingSpinner label={statusMessage} size="md" />
        <p className="text-sm text-muted-foreground">{statusMessage}</p>
        <motion.div
          className="h-1 w-24 overflow-hidden rounded-full bg-muted"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={reduceMotion ? { duration: 0 } : { delay: 0.4 }}
          aria-hidden
        >
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={reduceMotion ? false : { x: '-100%' }}
            animate={reduceMotion ? { x: 0 } : { x: '100%' }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { repeat: Infinity, duration: 1.2, ease: 'easeInOut' }
            }
          />
        </motion.div>
      </motion.div>
    </FullScreenLayout>
  );
}
