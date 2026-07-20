import { useMemo, useState } from 'react';
import { useAppTranslation } from '@saki-operations/i18n';
import { Badge, Button, Card, cn } from '@saki-operations/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { listVehicles } from '@/modules/vehicles/lib/vehicle-store';

import { dateInRange } from '../lib/date-overlap';
import { listAvailability } from '../lib/fleet-planner-store';
import type { FleetAvailability, FleetAvailabilityStatus } from '../types';

function toIsoDate(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function dayHighlight(
  date: string,
  entries: FleetAvailability[],
): FleetAvailabilityStatus | null {
  const onDay = entries.filter((entry) => dateInRange(date, entry.startDate, entry.endDate));
  if (onDay.length === 0) return null;
  if (onDay.some((entry) => entry.status === 'BOOKED')) return 'BOOKED';
  return 'HOLD';
}

function vehicleLabel(vehicleId: string): string {
  const vehicle = listVehicles().find((item) => item.id === vehicleId);
  if (!vehicle) return vehicleId;
  return `${vehicle.name} · ${vehicle.registrationNumber}`;
}

export function FleetPlannerCalendar() {
  const { t, i18n } = useAppTranslation();
  const locale = i18n.language === 'si' ? 'si-LK' : 'en-LK';
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const entries = useMemo(() => {
    void version;
    return listAvailability({ vehicleId: vehicleFilter || null });
  }, [vehicleFilter, version]);

  const vehicles = useMemo(() => listVehicles(), []);

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });

  const firstWeekday = new Date(cursor.year, cursor.month, 1).getDay();
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const weekdayLabels = Array.from({ length: 7 }, (_, index) => {
    // 2023-01-01 was a Sunday — matches `Date#getDay()` Sunday-start calendars.
    const date = new Date(2023, 0, 1 + index);
    return date.toLocaleDateString(locale, { weekday: 'short' });
  });

  const selectedEntries = useMemo(() => {
    if (!selectedDate) return [];
    return entries.filter((entry) => dateInRange(selectedDate, entry.startDate, entry.endDate));
  }, [entries, selectedDate]);

  const formatDate = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="fleet-planner-vehicle-filter" className="text-sm font-medium">
          {t('fleetPlanner.calendar.vehicleFilter')}
        </label>
        <select
          id="fleet-planner-vehicle-filter"
          className="flex min-h-12 w-full rounded-xl border border-input bg-background px-3 text-base"
          value={vehicleFilter}
          onChange={(event) => {
            setVehicleFilter(event.target.value);
            setSelectedDate(null);
            setVersion((v) => v + 1);
          }}
        >
          <option value="">{t('fleetPlanner.calendar.allVehicles')}</option>
          {vehicles.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.name} · {vehicle.registrationNumber}
            </option>
          ))}
        </select>
      </div>

      <Card variant="glass" padding="lg" className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={t('fleetPlanner.calendar.prevMonth')}
            onClick={() =>
              setCursor((prev) => {
                const month = prev.month - 1;
                if (month < 0) return { year: prev.year - 1, month: 11 };
                return { ...prev, month };
              })
            }
          >
            <ChevronLeft className="size-5" aria-hidden />
          </Button>
          <h2 className="font-display text-lg font-semibold tracking-tight sm:text-xl">
            {monthLabel}
          </h2>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={t('fleetPlanner.calendar.nextMonth')}
            onClick={() =>
              setCursor((prev) => {
                const month = prev.month + 1;
                if (month > 11) return { year: prev.year + 1, month: 0 };
                return { ...prev, month };
              })
            }
          >
            <ChevronRight className="size-5" aria-hidden />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
          {weekdayLabels.map((label) => (
            <div key={label} className="py-1">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: firstWeekday }).map((_, index) => (
            <div key={`pad-${index}`} className="min-h-11" aria-hidden />
          ))}
          {Array.from({ length: daysInMonth }, (_, index) => {
            const day = index + 1;
            const iso = toIsoDate(cursor.year, cursor.month, day);
            const highlight = dayHighlight(iso, entries);
            const selected = selectedDate === iso;
            return (
              <button
                key={iso}
                type="button"
                disabled={!highlight}
                onClick={() => {
                  if (!highlight) return;
                  setSelectedDate(iso);
                }}
                className={cn(
                  'flex min-h-11 flex-col items-center justify-center rounded-xl text-sm font-semibold tabular-nums transition',
                  !highlight && 'text-muted-foreground',
                  highlight === 'HOLD' && 'bg-warning/25 text-foreground ring-1 ring-warning/40',
                  highlight === 'BOOKED' && 'bg-destructive/25 text-foreground ring-1 ring-destructive/40',
                  selected && 'ring-2 ring-primary',
                  highlight && 'hover:opacity-90',
                )}
                aria-label={
                  highlight
                    ? t('fleetPlanner.calendar.dayWithAvailability', { date: formatDate(iso) })
                    : formatDate(iso)
                }
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3 text-sm">
          <span className="inline-flex items-center gap-2">
            <span className="size-3 rounded-full bg-warning" aria-hidden />
            {t('fleetPlanner.status.HOLD')}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="size-3 rounded-full bg-destructive" aria-hidden />
            {t('fleetPlanner.status.BOOKED')}
          </span>
        </div>
      </Card>

      {selectedDate ? (
        <Card variant="glass" padding="lg" className="space-y-4" role="region" aria-live="polite">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-semibold">
                {t('fleetPlanner.calendar.dayPanelTitle')}
              </h3>
              <p className="text-sm text-muted-foreground">{formatDate(selectedDate)}</p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedDate(null)}>
              {t('actions.close')}
            </Button>
          </div>
          {selectedEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('fleetPlanner.calendar.dayPanelEmpty')}</p>
          ) : (
            <ul className="space-y-3">
              {selectedEntries.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-xl border border-border bg-background px-4 py-3"
                >
                  <dl className="grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t('fleetPlanner.fields.vehicle')}
                      </dt>
                      <dd className="mt-1 font-medium">{vehicleLabel(entry.vehicleId)}</dd>
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
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}
    </div>
  );
}
