import { useAppTranslation } from '@saki-operations/i18n';
import { Button, Card, StatusIndicator } from '@saki-operations/ui';
import { motion, useReducedMotion } from 'framer-motion';
import { CloudOff, HardDrive, RefreshCw, Wifi } from 'lucide-react';

import { getClientBuildInfo } from '@/app/bootstrap/constants';
import { useNetwork } from '@/app/bootstrap/network-provider';
import { fadeUpTransition } from '@/lib/motion';
import { BuildInfoPanel } from '@/modules/build-info/components/build-info-panel';
import { useSyncStatus } from '@/modules/sync/sync-provider';

/** Home status strip — network + Saki Sync queue + build identity. */
export function HomeStatusArea() {
  const { t, i18n } = useAppTranslation();
  const { isOnline } = useNetwork();
  const { status, retryFailed, drain } = useSyncStatus();
  const reduceMotion = useReducedMotion();
  const buildInfo = getClientBuildInfo();

  const pendingSyncCount =
    status.pendingCount + status.retryingCount + status.uploadingCount;
  const connectionLabel = isOnline
    ? t('dashboard.status.connectionOnline')
    : t('dashboard.status.connectionOffline');

  const lastSyncLabel = status.lastSyncAt
    ? new Intl.DateTimeFormat(i18n.language, {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(status.lastSyncAt))
    : t('dashboard.status.neverSynced');

  const items = [
    {
      key: 'network',
      icon: isOnline ? <Wifi className="size-4" aria-hidden /> : <CloudOff className="size-4" aria-hidden />,
      label: t('dashboard.status.network'),
      value: (
        <StatusIndicator
          status={isOnline ? 'online' : 'offline'}
          label={isOnline ? t('status.online') : t('status.offline')}
        />
      ),
    },
    {
      key: 'sync',
      icon: <HardDrive className="size-4" aria-hidden />,
      label: t('dashboard.status.pendingSync'),
      value: (
        <span className="tabular-nums font-semibold text-foreground">{pendingSyncCount}</span>
      ),
    },
    {
      key: 'connection',
      icon: <Wifi className="size-4" aria-hidden />,
      label: t('dashboard.status.connection'),
      value: <span className="text-sm font-medium">{connectionLabel}</span>,
    },
  ];

  return (
    <motion.section
      aria-label={t('dashboard.status.region')}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={fadeUpTransition(reduceMotion, 0.04)}
      className="space-y-3"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <Card key={item.key} variant="glass" className="flex min-h-[5rem] flex-col justify-between gap-2 p-3.5 sm:p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              {item.icon}
              <span className="truncate text-xs font-medium uppercase tracking-wide">{item.label}</span>
            </div>
            <div className="min-w-0">{item.value}</div>
          </Card>
        ))}
      </div>

      <BuildInfoPanel info={buildInfo} compact />

      <Card variant="glass" className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="space-y-1 text-sm">
          <p className="font-medium text-foreground">{t('dashboard.status.syncPanelTitle')}</p>
          <p className="text-muted-foreground">
            {t('dashboard.status.lastSync', { time: lastSyncLabel })}
            {status.failedCount > 0
              ? ` · ${t('dashboard.status.failedCount', { count: status.failedCount })}`
              : ''}
            {status.conflictCount > 0
              ? ` · ${t('dashboard.status.conflictCount', { count: status.conflictCount })}`
              : ''}
            {status.isDraining ? ` · ${t('dashboard.status.syncing')}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={!isOnline || status.isDraining}
            onClick={() => void drain()}
          >
            <RefreshCw className="size-4" aria-hidden />
            {t('dashboard.status.syncNow')}
          </Button>
          {status.failedCount > 0 ? (
            <Button type="button" size="sm" onClick={() => void retryFailed()}>
              {t('dashboard.status.retryFailed')}
            </Button>
          ) : null}
        </div>
      </Card>
    </motion.section>
  );
}
