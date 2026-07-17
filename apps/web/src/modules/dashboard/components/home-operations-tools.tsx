import { Link } from 'react-router-dom';
import { canAccessModule, type ModuleAccessKey } from '@saki-operations/constants';
import { useAppTranslation } from '@saki-operations/i18n';
import { Card, cn } from '@saki-operations/ui';
import { motion, useReducedMotion } from 'framer-motion';
import { Building2, CalendarOff, FileBarChart2, Truck, Users } from 'lucide-react';

import { useSession } from '@/app/bootstrap/session-provider';
import { paths } from '@/app/router/paths';
import { fadeUpTransition } from '@/lib/motion';

const TOOLS: {
  key: 'leave' | 'vehicles' | 'employees' | 'officeDashboard' | 'reports';
  module: ModuleAccessKey;
  to: string;
  icon: typeof CalendarOff;
}[] = [
  { key: 'leave', module: 'leave', to: paths.leave, icon: CalendarOff },
  { key: 'vehicles', module: 'vehicles', to: paths.vehicles, icon: Truck },
  { key: 'employees', module: 'employees', to: paths.employees, icon: Users },
  {
    key: 'officeDashboard',
    module: 'officeDashboard',
    to: paths.officeDashboard,
    icon: Building2,
  },
  { key: 'reports', module: 'reports', to: paths.reports, icon: FileBarChart2 },
];

/**
 * Secondary dashboard entry for Leave / Vehicles / Employees / Office / Reports.
 * Visibility is gated by session permissions (Phase 9.1).
 */
export function HomeOperationsTools() {
  const { t } = useAppTranslation();
  const { user } = useSession();
  const reduceMotion = useReducedMotion();
  const visible = TOOLS.filter((tool) =>
    user ? canAccessModule(user.permissions, tool.module) : false,
  );

  if (visible.length === 0) return null;

  return (
    <motion.section
      aria-label={t('dashboard.operationsTools.region')}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={fadeUpTransition(reduceMotion, 0.09)}
    >
      <Card variant="glass" className="p-4 sm:p-5">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('dashboard.operationsTools.title')}
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">
          {t('dashboard.operationsTools.description')}
        </p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.key}
                to={tool.to}
                className={cn(
                  'flex items-center gap-3 rounded-xl border border-glass-border bg-muted/20 px-3 py-3',
                  'transition hover:brightness-110',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                )}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {t(`dashboard.operationsTools.${tool.key}.title`)}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {t(`dashboard.operationsTools.${tool.key}.hint`)}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </Card>
    </motion.section>
  );
}
