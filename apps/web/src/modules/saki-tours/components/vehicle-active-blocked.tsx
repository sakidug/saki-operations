import type { OperationsSession } from '@saki-operations/operations-session';
import { useAppTranslation } from '@saki-operations/i18n';
import { Card } from '@saki-operations/ui';
import { TriangleAlert } from 'lucide-react';

import {
  formatOperationDateTime,
  getSessionDriverLabel,
  getSessionStringField,
  getSessionVehicleRegistration,
} from '../lib/session-display';

type VehicleActiveBlockedProps = {
  session: OperationsSession;
};

/**
 * Shown when the operator selects a vehicle that already has an active operation.
 * The vehicle can still be viewed, but a new operation cannot be started with it.
 */
export function VehicleActiveBlocked({ session }: VehicleActiveBlockedProps) {
  const { t, i18n } = useAppTranslation();

  const rows: Array<{ label: string; value: string }> = [
    {
      label: t('toursOps.vehicleBlocked.registration'),
      value: getSessionVehicleRegistration(session),
    },
    { label: t('toursOps.vehicleBlocked.driver'), value: getSessionDriverLabel(session) },
    {
      label: t('toursOps.vehicleBlocked.started'),
      value: formatOperationDateTime(session.startTime, i18n.language),
    },
    {
      label: t('toursOps.vehicleBlocked.destination'),
      value: getSessionStringField(session, 'destination'),
    },
  ];

  return (
    <Card
      variant="outline"
      padding="md"
      className="space-y-3 border-danger/40 bg-danger/5"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-danger/15 text-danger">
          <TriangleAlert className="size-5" aria-hidden />
        </span>
        <p className="pt-1 text-sm font-semibold text-foreground">
          {t('toursOps.vehicleBlocked.title')}
        </p>
      </div>
      <dl className="grid gap-2.5 text-sm sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-xl bg-muted/40 px-3 py-2.5">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">{row.label}</dt>
            <dd className="mt-1 font-medium text-foreground">{row.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
