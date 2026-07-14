import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';
import { useAppTranslation } from '@saki-operations/i18n';

import { useNetwork } from '@/app/bootstrap/network-provider';

export function ConnectionBanner() {
  const { status } = useNetwork();
  const { t } = useAppTranslation();
  const reduceMotion = useReducedMotion();

  const visible = status === 'offline' || status === 'restored';
  const isOffline = status === 'offline';

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          role="status"
          aria-live="polite"
          initial={reduceMotion ? false : { height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.2 }}
          className={`overflow-hidden border-b px-4 py-2.5 text-center text-xs font-medium sm:text-sm ${
            isOffline
              ? 'border-destructive/30 bg-destructive/15 text-destructive'
              : 'border-success/30 bg-success/15 text-success'
          }`}
        >
          <span className="inline-flex items-center gap-2">
            {isOffline ? <WifiOff className="size-4" aria-hidden /> : <Wifi className="size-4" aria-hidden />}
            {isOffline ? t('shell.network.offline') : t('shell.network.restored')}
          </span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
