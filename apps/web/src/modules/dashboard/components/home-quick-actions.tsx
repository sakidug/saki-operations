import { Link, useNavigate } from 'react-router-dom';
import { useAppTranslation } from '@saki-operations/i18n';
import { Button, Card } from '@saki-operations/ui';
import { motion, useReducedMotion } from 'framer-motion';
import { Bell, LogOut, Settings, User } from 'lucide-react';

import { useSession } from '@/app/bootstrap/session-provider';
import { paths } from '@/app/router/paths';
import { fadeUpTransition } from '@/lib/motion';

export function HomeQuickActions() {
  const { t } = useAppTranslation();
  const { logout } = useSession();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const actions = [
    {
      key: 'settings',
      label: t('shell.nav.settings'),
      icon: <Settings className="size-4" aria-hidden />,
      to: paths.settings,
    },
    {
      key: 'profile',
      label: t('shell.nav.profile'),
      icon: <User className="size-4" aria-hidden />,
      to: paths.profile,
    },
    {
      key: 'notifications',
      label: t('shell.nav.notifications'),
      icon: <Bell className="size-4" aria-hidden />,
      to: paths.notifications,
    },
  ] as const;

  return (
    <motion.section
      aria-label={t('dashboard.quickActions.region')}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={fadeUpTransition(reduceMotion, 0.1)}
    >
      <Card variant="glass" className="p-4 sm:p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('dashboard.quickActions.title')}
        </h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          {actions.map((action) => (
            <Button
              key={action.key}
              asChild
              variant="glass"
              className="h-auto min-h-12 justify-start gap-2 px-3 py-3"
            >
              <Link to={action.to}>
                {action.icon}
                <span>{action.label}</span>
              </Link>
            </Button>
          ))}
          <Button
            type="button"
            variant="outline"
            className="h-auto min-h-12 justify-start gap-2 px-3 py-3"
            onClick={() => {
              void logout().then(() => navigate(paths.entry, { replace: true }));
            }}
          >
            <LogOut className="size-4" aria-hidden />
            <span>{t('auth.logout')}</span>
          </Button>
        </div>
      </Card>
    </motion.section>
  );
}
