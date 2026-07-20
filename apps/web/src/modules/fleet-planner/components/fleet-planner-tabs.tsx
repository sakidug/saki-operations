import { NavLink } from 'react-router-dom';
import { useAppTranslation } from '@saki-operations/i18n';
import { cn } from '@saki-operations/ui';
import { CalendarDays, List, Plus } from 'lucide-react';

import { paths } from '@/app/router/paths';

const tabs = [
  { key: 'calendar', to: paths.fleetPlanner, end: true, icon: CalendarDays, labelKey: 'fleetPlanner.tabs.calendar' },
  { key: 'add', to: paths.fleetPlannerAdd, end: true, icon: Plus, labelKey: 'fleetPlanner.tabs.add' },
  { key: 'list', to: paths.fleetPlannerList, end: false, icon: List, labelKey: 'fleetPlanner.tabs.list' },
] as const;

/**
 * Sub-navigation for Calendar / Add / List inside Fleet Planner.
 */
export function FleetPlannerTabs() {
  const { t } = useAppTranslation();

  return (
    <nav
      aria-label={t('fleetPlanner.tabs.region')}
      className="grid grid-cols-3 gap-2"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.key}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                'flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-center text-xs font-semibold transition sm:min-h-14 sm:text-sm',
                isActive
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:bg-accent',
              )
            }
          >
            <Icon className="size-5" aria-hidden />
            <span>{t(tab.labelKey)}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
