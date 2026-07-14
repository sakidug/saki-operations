import { motion, useReducedMotion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { GlassLoadingCard, LoadingSpinner, SkeletonLoader, cn } from '@saki-operations/ui';
import { useAppTranslation } from '@saki-operations/i18n';

import { FullScreenLayout } from '@/app/layouts/shell-layouts';
import { FadeIn } from '@/app/screens/loading/fade-in';

export function AnimatedLogo({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const { t } = useAppTranslation();

  return (
    <motion.div
      className={cn(
        'flex size-16 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground shadow-glow sm:size-20 sm:text-xl',
        className,
      )}
      initial={reduceMotion ? false : { scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={
        reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 18 }
      }
      role="img"
      aria-label={t('app.name')}
    >
      <span aria-hidden>SO</span>
    </motion.div>
  );
}

export type LoadingScreenProps = {
  message?: ReactNode;
};

/** Full-screen glass wait state (bootstrap, auth restore, language init). */
export function LoadingScreen({ message }: LoadingScreenProps) {
  const { t } = useAppTranslation();
  const label = t('actions.loading');

  return (
    <FullScreenLayout className="flex items-center justify-center px-4">
      <FadeIn className="flex w-full justify-center">
        <GlassLoadingCard label={label} message={message ?? t('shell.loading.application')}>
          <AnimatedLogo />
        </GlassLoadingCard>
      </FadeIn>
    </FullScreenLayout>
  );
}

/** Dedicated copy for authentication session restore. */
export function AuthCheckLoadingScreen() {
  const { t } = useAppTranslation();
  return <LoadingScreen message={t('shell.loading.authentication')} />;
}

/** Dedicated copy while locale bootstraps. */
export function LanguageInitLoadingScreen() {
  const { t } = useAppTranslation();
  return <LoadingScreen message={t('shell.loading.language')} />;
}

export function ProgressLoader({
  label,
  progress,
}: {
  label: ReactNode;
  progress: number;
}) {
  const value = Math.max(0, Math.min(100, progress));
  const reduceMotion = useReducedMotion();

  return (
    <div className="w-full space-y-2" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={false}
          animate={{ width: `${value}%` }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.35, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export function ShellSkeleton() {
  const { t } = useAppTranslation();
  return (
    <FadeIn>
      <div className="glass space-y-4 rounded-3xl p-6">
        <SkeletonLoader lines={1} label={t('shell.loading.workspace')} className="max-w-xs" />
        <SkeletonLoader lines={4} label={t('actions.loading')} />
      </div>
    </FadeIn>
  );
}

export function InlineLoadingMessage({ message }: { message: ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />
      <span>{message}</span>
    </p>
  );
}

export function LoadingMessages() {
  const { t } = useAppTranslation();
  return {
    workspace: t('shell.loading.workspace'),
    application: t('shell.loading.application'),
    connection: t('shell.loading.connection'),
    authentication: t('shell.loading.authentication'),
    language: t('shell.loading.language'),
    dashboard: t('shell.loading.dashboard'),
    route: t('shell.loading.route'),
    module: t('shell.loading.module'),
  };
}

export { LoadingSpinner };
