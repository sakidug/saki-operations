import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppTranslation } from '@saki-operations/i18n';
import { Badge, Card, cn } from '@saki-operations/ui';
import { ChevronRight, Truck } from 'lucide-react';

import { FadeIn } from '@/app/screens/loading/fade-in';
import { buildVehicleDetailPath } from '@/app/router/paths';
import { listVehicles } from '../lib/vehicle-store';

export function VehicleListScreen() {
  const { t, i18n } = useAppTranslation();
  const vehicles = useMemo(() => listVehicles(), []);
  const locale = i18n.language === 'si' ? 'si-LK' : 'en-LK';

  return (
    <FadeIn className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <header className="space-y-2">
        <Badge variant="secondary" className="rounded-md">
          {t('vehicleOps.badge')}
        </Badge>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {t('vehicleOps.list.title')}
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
          {t('vehicleOps.list.description')}
        </p>
      </header>

      <ul className="flex flex-col gap-2.5">
        {vehicles.map((vehicle) => {
          const serviceDate = new Date(`${vehicle.nextServiceDate}T00:00:00`).toLocaleDateString(
            locale,
            { day: 'numeric', month: 'short', year: 'numeric' },
          );
          return (
            <li key={vehicle.id}>
              <Link
                to={buildVehicleDetailPath(vehicle.id)}
                className={cn(
                  'glass group flex items-center gap-3 rounded-2xl border border-glass-border p-4',
                  'transition hover:brightness-110',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                )}
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Truck className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{vehicle.name}</span>
                    <Badge
                      variant={vehicle.availability === 'available' ? 'default' : 'secondary'}
                    >
                      {t(`vehicleOps.availability.${vehicle.availability}`)}
                    </Badge>
                  </span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {vehicle.registrationNumber} · {vehicle.make} {vehicle.model}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {t('vehicleOps.list.odometer', {
                      km: vehicle.currentOdometerKm.toLocaleString(locale),
                    })}{' '}
                    · {t('vehicleOps.list.nextService', { date: serviceDate })}
                  </span>
                </span>
                <ChevronRight
                  className="size-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>

      {vehicles.length === 0 ? (
        <Card variant="glass" padding="md">
          <p className="text-sm text-muted-foreground">{t('vehicleOps.list.empty')}</p>
        </Card>
      ) : null}
    </FadeIn>
  );
}
