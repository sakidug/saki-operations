import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppTranslation } from '@saki-operations/i18n';
import { Badge, Button, Card, EmptyState } from '@saki-operations/ui';
import { Pencil, Trash2 } from 'lucide-react';

import { buildFleetPlannerEditPath } from '@/app/router/paths';
import { listVehicles } from '@/modules/vehicles/lib/vehicle-store';

import { deleteAvailability, listAvailability } from '../lib/fleet-planner-store';

function vehicleLabel(vehicleId: string): string {
  const vehicle = listVehicles().find((item) => item.id === vehicleId);
  if (!vehicle) return vehicleId;
  return `${vehicle.name} · ${vehicle.registrationNumber}`;
}

export function FleetAvailabilityList() {
  const { t, i18n } = useAppTranslation();
  const locale = i18n.language === 'si' ? 'si-LK' : 'en-LK';
  const [version, setVersion] = useState(0);

  const entries = useMemo(() => {
    void version;
    return listAvailability();
  }, [version]);

  const formatDate = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const onDelete = (id: string) => {
    const confirmed = window.confirm(t('fleetPlanner.list.deleteConfirm'));
    if (!confirmed) return;
    deleteAvailability(id);
    setVersion((v) => v + 1);
  };

  if (entries.length === 0) {
    return (
      <EmptyState
        title={t('fleetPlanner.list.emptyTitle')}
        description={t('fleetPlanner.list.emptyDescription')}
      />
    );
  }

  return (
    <ul className="space-y-3">
      {entries.map((entry) => (
        <li key={entry.id}>
          <Card variant="glass" padding="md" className="space-y-3">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('fleetPlanner.fields.vehicle')}
                </dt>
                <dd className="mt-1 font-semibold text-foreground">
                  {vehicleLabel(entry.vehicleId)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('fleetPlanner.fields.status')}
                </dt>
                <dd className="mt-1">
                  <Badge variant={entry.status === 'BOOKED' ? 'danger' : 'warning'}>
                    {t(`fleetPlanner.status.${entry.status}`)}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('fleetPlanner.fields.startDate')}
                </dt>
                <dd className="mt-1 font-medium">{formatDate(entry.startDate)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('fleetPlanner.fields.endDate')}
                </dt>
                <dd className="mt-1 font-medium">{formatDate(entry.endDate)}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-2 border-t border-border/60 pt-3">
              <Button asChild variant="secondary" size="sm">
                <Link to={buildFleetPlannerEditPath(entry.id)}>
                  <Pencil className="size-4" aria-hidden />
                  {t('fleetPlanner.list.edit')}
                </Link>
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => onDelete(entry.id)}
              >
                <Trash2 className="size-4" aria-hidden />
                {t('fleetPlanner.list.delete')}
              </Button>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
