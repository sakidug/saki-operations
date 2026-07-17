import type { OperationsSession } from '@saki-operations/operations-session';
import { useAppTranslation } from '@saki-operations/i18n';
import { Badge, Card } from '@saki-operations/ui';
import { BatteryWarning, MapPin, Satellite } from 'lucide-react';

import { useGpsTrackingStatus } from '../hooks/use-gps-tracking-status';
import { GPS_LOW_BATTERY_LEVEL, GPS_POOR_ACCURACY_METERS } from '../lib/gps-tracking';

type GpsStatusIndicatorProps = {
  session: OperationsSession;
};

function formatAccuracy(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${Math.round(value)} m`;
}

function formatBattery(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${Math.round(value * 100)}%`;
}

export function GpsStatusIndicator({ session }: GpsStatusIndicatorProps) {
  const { t } = useAppTranslation();
  const gps = useGpsTrackingStatus(session);
  const connected = gps.sessionId === session.id && gps.state === 'connected';
  const poorAccuracy =
    connected && gps.accuracy != null && gps.accuracy > GPS_POOR_ACCURACY_METERS;
  const lowBattery =
    gps.batteryLevel != null && gps.batteryLevel < GPS_LOW_BATTERY_LEVEL;

  return (
    <Card variant="outline" padding="md" className="space-y-3 bg-background/60">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Satellite className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t('toursOps.gps.title')}
            </p>
            <p className="font-semibold text-foreground">
              {connected ? t('toursOps.gps.connected') : t('toursOps.gps.waiting')}
            </p>
          </div>
        </div>
        <Badge variant={connected ? 'success' : 'warning'} className="rounded-md">
          {connected ? t('toursOps.gps.connected') : t('toursOps.gps.waiting')}
        </Badge>
      </div>

      <dl className="grid gap-2 text-sm sm:grid-cols-3">
        <div className="rounded-xl bg-muted/40 px-3 py-2">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            {t('toursOps.gps.accuracy')}
          </dt>
          <dd className="mt-1 font-medium text-foreground">{formatAccuracy(gps.accuracy)}</dd>
        </div>
        <div className="rounded-xl bg-muted/40 px-3 py-2">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            {t('toursOps.gps.battery')}
          </dt>
          <dd className="mt-1 font-medium text-foreground">{formatBattery(gps.batteryLevel)}</dd>
        </div>
        <div className="rounded-xl bg-muted/40 px-3 py-2">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            {t('toursOps.gps.network')}
          </dt>
          <dd className="mt-1 font-medium text-foreground">
            {gps.networkStatus === 'online'
              ? t('toursOps.gps.online')
              : t('toursOps.gps.offline')}
          </dd>
        </div>
      </dl>

      {poorAccuracy ? (
        <p className="flex items-start gap-2 rounded-xl bg-warning/10 px-3 py-2 text-sm font-medium text-foreground">
          <MapPin className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
          {t('toursOps.gps.poorAccuracy')}
        </p>
      ) : null}

      {lowBattery ? (
        <p className="flex items-start gap-2 rounded-xl bg-danger/10 px-3 py-2 text-sm font-medium text-foreground">
          <BatteryWarning className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
          {t('toursOps.gps.lowBattery')}
        </p>
      ) : null}
    </Card>
  );
}
