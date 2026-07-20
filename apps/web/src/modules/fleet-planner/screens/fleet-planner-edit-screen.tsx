import { useParams } from 'react-router-dom';
import { useAppTranslation } from '@saki-operations/i18n';

import { FleetAvailabilityForm } from '../components/fleet-availability-form';

export function FleetPlannerEditScreen() {
  const { t } = useAppTranslation();
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-3">
      <h2 className="font-display text-lg font-semibold tracking-tight">
        {t('fleetPlanner.edit.title')}
      </h2>
      <FleetAvailabilityForm availabilityId={id} />
    </div>
  );
}
