import { useAppTranslation } from '@saki-operations/i18n';

import { FleetAvailabilityForm } from '../components/fleet-availability-form';

export function FleetPlannerAddScreen() {
  const { t } = useAppTranslation();

  return (
    <div className="space-y-3">
      <h2 className="font-display text-lg font-semibold tracking-tight">
        {t('fleetPlanner.add.title')}
      </h2>
      <FleetAvailabilityForm />
    </div>
  );
}
