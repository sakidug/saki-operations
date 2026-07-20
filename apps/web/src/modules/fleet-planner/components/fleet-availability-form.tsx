import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppTranslation } from '@saki-operations/i18n';
import { Button, Card, Input, Label } from '@saki-operations/ui';

import { paths } from '@/app/router/paths';
import { listVehicles } from '@/modules/vehicles/lib/vehicle-store';

import {
  AvailabilityConflictError,
  createAvailability,
  getAvailability,
  updateAvailability,
} from '../lib/fleet-planner-store';
import type { FleetAvailabilityStatus } from '../types';

type FleetAvailabilityFormProps = {
  availabilityId?: string;
};

export function FleetAvailabilityForm({ availabilityId }: FleetAvailabilityFormProps) {
  const { t, i18n } = useAppTranslation();
  const navigate = useNavigate();
  const locale = i18n.language === 'si' ? 'si-LK' : 'en-LK';
  const existing = availabilityId ? getAvailability(availabilityId) : undefined;
  const vehicles = useMemo(() => listVehicles(), []);

  const [vehicleId, setVehicleId] = useState(existing?.vehicleId ?? '');
  const [startDate, setStartDate] = useState(existing?.startDate ?? '');
  const [endDate, setEndDate] = useState(existing?.endDate ?? '');
  const [status, setStatus] = useState<FleetAvailabilityStatus>(existing?.status ?? 'HOLD');
  const [error, setError] = useState<string | null>(null);
  const [conflictDates, setConflictDates] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const formatDate = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setConflictDates([]);

    if (!vehicleId || !startDate || !endDate || !status) {
      setError(t('fleetPlanner.form.required'));
      return;
    }
    if (endDate < startDate) {
      setError(t('fleetPlanner.form.invalidRange'));
      return;
    }

    setSaving(true);
    try {
      const payload = { vehicleId, startDate, endDate, status };
      if (availabilityId) {
        updateAvailability(availabilityId, payload);
      } else {
        createAvailability(payload);
      }
      navigate(paths.fleetPlannerList, { replace: true });
    } catch (cause) {
      if (cause instanceof AvailabilityConflictError) {
        setError(t('fleetPlanner.form.conflict'));
        setConflictDates(
          cause.conflicts.map(
            (item) => `${formatDate(item.startDate)} – ${formatDate(item.endDate)}`,
          ),
        );
      } else {
        setError(t('fleetPlanner.form.saveFailed'));
      }
    } finally {
      setSaving(false);
    }
  };

  if (availabilityId && !existing) {
    return (
      <Card variant="glass" padding="lg">
        <p className="text-sm text-muted-foreground">{t('fleetPlanner.form.notFound')}</p>
        <Button asChild className="mt-4" variant="secondary">
          <Link to={paths.fleetPlannerList}>{t('fleetPlanner.form.backToList')}</Link>
        </Button>
      </Card>
    );
  }

  return (
    <Card variant="glass" padding="lg">
      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        <div className="space-y-2">
          <Label htmlFor="fp-vehicle">{t('fleetPlanner.fields.vehicle')} *</Label>
          <select
            id="fp-vehicle"
            required
            className="flex min-h-12 w-full rounded-xl border border-input bg-background px-3 text-base"
            value={vehicleId}
            onChange={(event) => setVehicleId(event.target.value)}
            disabled={saving}
          >
            <option value="">{t('fleetPlanner.form.selectVehicle')}</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.name} · {vehicle.registrationNumber}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fp-start">{t('fleetPlanner.fields.startDate')} *</Label>
            <Input
              id="fp-start"
              type="date"
              required
              className="min-h-12"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fp-end">{t('fleetPlanner.fields.endDate')} *</Label>
            <Input
              id="fp-end"
              type="date"
              required
              className="min-h-12"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              disabled={saving}
            />
          </div>
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">{t('fleetPlanner.fields.status')} *</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(['HOLD', 'BOOKED'] as const).map((value) => (
              <label
                key={value}
                className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border bg-background px-4"
              >
                <input
                  type="radio"
                  name="fp-status"
                  value={value}
                  checked={status === value}
                  onChange={() => setStatus(value)}
                  disabled={saving}
                />
                <span className="font-medium">{t(`fleetPlanner.status.${value}`)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {error ? (
          <div role="alert" className="space-y-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <p>{error}</p>
            {conflictDates.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5">
                {conflictDates.map((range) => (
                  <li key={range}>{range}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <Button type="submit" size="lg" className="w-full sm:w-auto" loading={saving}>
          {t('fleetPlanner.form.save')}
        </Button>
      </form>
    </Card>
  );
}
