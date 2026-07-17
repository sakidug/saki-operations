import { useEffect, useSyncExternalStore } from 'react';
import type { OperationsSession } from '@saki-operations/operations-session';

import {
  ensureGpsTrackingForActiveSession,
  getGpsTrackingStatus,
  subscribeGpsTracking,
} from '../lib/gps-tracking';

export function useGpsTrackingStatus(session: OperationsSession | null) {
  useEffect(() => {
    ensureGpsTrackingForActiveSession(session);
  }, [session]);

  return useSyncExternalStore(
    subscribeGpsTracking,
    getGpsTrackingStatus,
    getGpsTrackingStatus,
  );
}
