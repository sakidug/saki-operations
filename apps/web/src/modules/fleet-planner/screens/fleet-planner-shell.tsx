import { Outlet } from 'react-router-dom';
import { useAppTranslation } from '@saki-operations/i18n';
import { Badge } from '@saki-operations/ui';

import { FadeIn } from '@/app/screens/loading/fade-in';

import { FleetPlannerTabs } from '../components/fleet-planner-tabs';

/**
 * Office/admin Fleet Planner shell — availability only (not bookings).
 */
export function FleetPlannerShell() {
  const { t } = useAppTranslation();

  return (
    <FadeIn className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <header className="space-y-2">
        <Badge variant="secondary" className="rounded-md">
          {t('fleetPlanner.badge')}
        </Badge>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {t('fleetPlanner.title')}
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
          {t('fleetPlanner.description')}
        </p>
      </header>
      <FleetPlannerTabs />
      <Outlet />
    </FadeIn>
  );
}
