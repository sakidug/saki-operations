import { useMemo } from 'react';
import type { VehicleOperationalStatus, VehicleSelectorItem } from '@saki-operations/types';
import { useAppTranslation } from '@saki-operations/i18n';
import { Badge, Card, LoadingSpinner, cn } from '@saki-operations/ui';
import { Car, UserRound, Wrench } from 'lucide-react';

import type { ToursVehicleStatus } from '../lib/vehicle-operational-status';
import { VehicleActiveBlocked } from './vehicle-active-blocked';

type ToursVehicleStepProps = {
  items: VehicleSelectorItem[];
  statuses: Map<string, ToursVehicleStatus>;
  loading: boolean;
  value: string | null;
  onChange: (vehicleId: string, vehicle: VehicleSelectorItem) => void;
};

const STATUS_ORDER: Record<VehicleOperationalStatus, number> = {
  AVAILABLE: 0,
  ON_TRIP: 1,
  SERVICE: 2,
};

function statusBadge(status: VehicleOperationalStatus, t: (key: string) => string) {
  if (status === 'ON_TRIP') {
    return { dot: '🔴', label: t('toursOps.vehicle.statusOnTrip'), variant: 'danger' as const };
  }
  if (status === 'SERVICE') {
    return { dot: '🟡', label: t('toursOps.vehicle.statusService'), variant: 'warning' as const };
  }
  return { dot: '🟢', label: t('toursOps.vehicle.statusAvailable'), variant: 'success' as const };
}

/**
 * Operations V2 vehicle picker. Orders AVAILABLE → ON_TRIP → SERVICE and shows a
 * status badge on each vehicle. All vehicles are viewable, but starting an
 * operation is only allowed on an AVAILABLE vehicle (enforced by the wizard).
 */
export function ToursVehicleStep({
  items,
  statuses,
  loading,
  value,
  onChange,
}: ToursVehicleStepProps) {
  const { t } = useAppTranslation();

  const ordered = useMemo(() => {
    const statusOf = (id: string): VehicleOperationalStatus =>
      statuses.get(id)?.status ?? 'AVAILABLE';
    return [...items].sort((a, b) => {
      const byStatus = STATUS_ORDER[statusOf(a.id)] - STATUS_ORDER[statusOf(b.id)];
      if (byStatus !== 0) return byStatus;
      return a.name.localeCompare(b.name);
    });
  }, [items, statuses]);

  const selectedStatus = value ? statuses.get(value) : undefined;

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex min-h-[8rem] items-center justify-center">
          <LoadingSpinner label={t('toursOps.vehicle.checking')} />
        </div>
      ) : null}

      <div
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        role="listbox"
        aria-label={t('toursOps.vehicle.label')}
      >
        {ordered.map((vehicle) => {
          const status = statuses.get(vehicle.id)?.status ?? 'AVAILABLE';
          const badge = statusBadge(status, t);
          const selected = value === vehicle.id;
          const startable = status === 'AVAILABLE';

          return (
            <button
              key={vehicle.id}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onChange(vehicle.id, vehicle)}
              className={cn(
                'flex flex-col gap-2 rounded-2xl border border-border bg-background/40 p-4 text-left transition',
                'hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                selected && 'border-primary ring-1 ring-primary/40',
                !startable && 'opacity-90',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  {status === 'SERVICE' ? (
                    <Wrench className="size-5" aria-hidden />
                  ) : (
                    <Car className="size-5" aria-hidden />
                  )}
                </span>
                <Badge variant={badge.variant}>
                  <span aria-hidden>{badge.dot}</span> {badge.label}
                </Badge>
              </div>
              <div>
                <p className="font-semibold leading-tight">{vehicle.name}</p>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                  {vehicle.registrationNumber}
                </p>
              </div>
              <div className="mt-auto flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{t('toursOps.vehicle.seats', { count: vehicle.capacity })}</Badge>
                {vehicle.assignedDriverName ? (
                  <span className="inline-flex items-center gap-1">
                    <UserRound className="size-3.5" aria-hidden />
                    {vehicle.assignedDriverName}
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {selectedStatus?.status === 'ON_TRIP' && selectedStatus.activeSession ? (
        <VehicleActiveBlocked session={selectedStatus.activeSession} />
      ) : null}

      {selectedStatus?.status === 'SERVICE' ? (
        <Card
          variant="outline"
          padding="md"
          className="flex items-start gap-3 border-warning/40 bg-warning/5 text-sm"
          role="alert"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
            <Wrench className="size-5" aria-hidden />
          </span>
          <p className="pt-1 font-medium text-foreground">{t('toursOps.vehicle.serviceNote')}</p>
        </Card>
      ) : null}
    </div>
  );
}
