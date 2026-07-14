import { useAppTranslation } from '@saki-operations/i18n';
import { Card, StatusIndicator } from '@saki-operations/ui';
import { motion, useReducedMotion } from 'framer-motion';
import { Activity, CloudOff, HardDrive, Wifi } from 'lucide-react';

import { useNetwork } from '@/app/bootstrap/network-provider';
import { APP_VERSION } from '@/app/bootstrap/constants';
import { fadeUpTransition } from '@/lib/motion';

export type HomeStatusAreaProps = {
  /** Pending sync count — 0 until Saki Sync (Phase 8) lands. */
  pendingSyncCount?: number;
};

export function HomeStatusArea({ pendingSyncCount = 0 }: HomeStatusAreaProps) {
  const { t } = useAppTranslation();
  const { isOnline } = useNetwork();
  const reduceMotion = useReducedMotion();

  const connectionLabel = isOnline
    ? t('dashboard.status.connectionOnline')
    : t('dashboard.status.connectionOffline');

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
        <span className="tabular-nums font-semibold text-foreground">
          {pendingSyncCount}
        </span>
      ),
    },
    {
      key: 'version',
      icon: <Activity className="size-4" aria-hidden />,
      label: t('dashboard.status.version'),
      value: <span className="font-mono text-sm font-semibold">v{APP_VERSION}</span>,
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
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
    </motion.section>
  );
}
