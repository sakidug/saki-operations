import { useAppTranslation } from '@saki-operations/i18n';

import { FleetAvailabilityList } from '../components/fleet-availability-list';

export function FleetPlannerListScreen() {
  const { t } = useAppTranslation();

  return (
    <div className="space-y-3">
      <h2 className="font-display text-lg font-semibold tracking-tight">
        {t('fleetPlanner.list.title')}
      </h2>
      <FleetAvailabilityList />
    </div>
  );
}
