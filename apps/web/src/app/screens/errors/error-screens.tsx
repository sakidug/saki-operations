import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@saki-operations/ui';
import { useAppTranslation } from '@saki-operations/i18n';

import { ErrorLayout } from '@/app/layouts/shell-layouts';
import { fadeUpTransition } from '@/lib/motion';
import { paths } from '@/app/router/paths';

type ErrorPageProps = {
  title: ReactNode;
  description: ReactNode;
  icon?: ReactNode;
  primaryAction?: { label: ReactNode; href?: string; onClick?: () => void };
  secondaryAction?: { label: ReactNode; href?: string; onClick?: () => void };
};

function ErrorPageShell({ title, description, icon, primaryAction, secondaryAction }: ErrorPageProps) {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  return (
    <ErrorLayout>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={fadeUpTransition(reduceMotion)}
      >
        <Card variant="glass" padding="lg" className="space-y-6 text-center">
          {icon ? <div className="mx-auto text-primary [&_svg]:size-12">{icon}</div> : null}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            {primaryAction ? (
              <Button
                type="button"
                size="lg"
                onClick={() => {
                  if (primaryAction.onClick) primaryAction.onClick();
                  else if (primaryAction.href) navigate(primaryAction.href);
                }}
              >
                {primaryAction.label}
              </Button>
            ) : null}
            {secondaryAction ? (
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={() => {
                  if (secondaryAction.onClick) secondaryAction.onClick();
                  else if (secondaryAction.href) navigate(secondaryAction.href);
                }}
              >
                {secondaryAction.label}
              </Button>
            ) : null}
          </div>
        </Card>
      </motion.div>
    </ErrorLayout>
  );
}

export function NotFoundScreen() {
  const { t } = useAppTranslation();
  return (
    <ErrorPageShell
      title={t('shell.errors.notFoundTitle')}
      description={t('shell.errors.notFoundDescription')}
      primaryAction={{ label: t('shell.errors.goHome'), href: paths.entry }}
    />
  );
}

export function OfflineScreen() {
  const { t } = useAppTranslation();
  return (
    <ErrorPageShell
      title={t('shell.errors.offlineTitle')}
      description={t('shell.errors.offlineDescription')}
      primaryAction={{
        label: t('actions.retry'),
        onClick: () => window.location.reload(),
      }}
      secondaryAction={{ label: t('shell.errors.goHome'), href: paths.entry }}
    />
  );
}

export function MaintenanceScreen() {
  const { t } = useAppTranslation();
  return (
    <ErrorPageShell
      title={t('shell.errors.maintenanceTitle')}
      description={t('shell.errors.maintenanceDescription')}
      primaryAction={{ label: t('actions.retry'), onClick: () => window.location.reload() }}
    />
  );
}

export function GenericErrorScreen() {
  const { t } = useAppTranslation();
  return (
    <ErrorPageShell
      title={t('shell.errors.genericTitle')}
      description={t('shell.errors.genericDescription')}
      primaryAction={{ label: t('actions.retry'), onClick: () => window.location.reload() }}
      secondaryAction={{ label: t('shell.errors.goHome'), href: paths.entry }}
    />
  );
}
