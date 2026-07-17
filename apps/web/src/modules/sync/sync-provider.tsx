import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  SyncEngine,
  setDefaultSyncEngine,
  type SyncEngineStatus,
} from '@saki-operations/sync';
import { getDefaultOperationsSessionEngine } from '@saki-operations/operations-session';

import { useNetwork } from '@/app/bootstrap/network-provider';
import { useSession } from '@/app/bootstrap/session-provider';
import { getAccessToken } from '@/modules/auth/session/token-storage';
import { setSyncAuthUserIdResolver } from '@/modules/sync/emit';
import { createHttpSyncTransport } from '@/modules/sync/http-transport';

type SyncContextValue = {
  status: SyncEngineStatus;
  refresh: () => Promise<void>;
  retryFailed: () => Promise<void>;
  drain: () => Promise<void>;
};

const EMPTY_STATUS: SyncEngineStatus = {
  pendingCount: 0,
  uploadingCount: 0,
  failedCount: 0,
  conflictCount: 0,
  retryingCount: 0,
  lastSyncAt: null,
  lastError: null,
  isDraining: false,
};

const SyncContext = createContext<SyncContextValue | null>(null);

/**
 * Initializes the SyncEngine, drains on reconnect, and exposes queue status.
 */
export function SyncProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useSession();
  const { isOnline } = useNetwork();
  const [status, setStatus] = useState<SyncEngineStatus>(EMPTY_STATUS);
  const [engine, setEngine] = useState<SyncEngine | null>(null);

  // C-01 / KI-030 — sync events must stamp AuthUser.id (JWT sub), not employeeId.
  useEffect(() => {
    const authUserId = user?.id ?? null;
    setSyncAuthUserIdResolver(() => authUserId);
    return () => setSyncAuthUserIdResolver(null);
  }, [user?.id]);

  useEffect(() => {
    const next = new SyncEngine({
      transport: createHttpSyncTransport(),
      getAccessToken,
      onStatusChange: setStatus,
      onEventAck: async (event, ack) => {
        if (ack.status !== 'accepted' && ack.status !== 'duplicate') return;
        if (
          event.eventType !== 'operation.completed' &&
          event.eventType !== 'delivery.completed'
        ) {
          return;
        }
        try {
          await getDefaultOperationsSessionEngine().markSynced(event.entityId);
        } catch {
          // Session may already be synced or absent on this device.
        }
      },
    });
    setDefaultSyncEngine(next);
    setEngine(next);
    void next.getStatus().then(setStatus);
    return () => {
      setDefaultSyncEngine(null);
      setEngine(null);
    };
  }, []);

  useEffect(() => {
    if (!engine || !isAuthenticated || !isOnline) return;
    void engine.drain();
  }, [engine, isAuthenticated, isOnline]);

  useEffect(() => {
    if (!engine || !isAuthenticated) return;
    const id = window.setInterval(() => {
      if (navigator.onLine) void engine.drain();
    }, 60_000);
    return () => window.clearInterval(id);
  }, [engine, isAuthenticated]);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('sync' in ServiceWorkerRegistration.prototype)) {
      return;
    }
    void navigator.serviceWorker.ready
      .then((reg) => {
        const syncManager = (
          reg as ServiceWorkerRegistration & {
            sync?: { register: (tag: string) => Promise<void> };
          }
        ).sync;
        return syncManager?.register('saki-sync-drain');
      })
      .catch(() => undefined);
  }, []);

  const refresh = useCallback(async () => {
    if (!engine) return;
    setStatus(await engine.getStatus());
  }, [engine]);

  const retryFailed = useCallback(async () => {
    if (!engine) return;
    await engine.retryFailed();
  }, [engine]);

  const drain = useCallback(async () => {
    if (!engine) return;
    await engine.drain();
  }, [engine]);

  const value = useMemo(
    () => ({ status, refresh, retryFailed, drain }),
    [status, refresh, retryFailed, drain],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSyncStatus() {
  const ctx = useContext(SyncContext);
  if (!ctx) {
    throw new Error('useSyncStatus must be used within SyncProvider');
  }
  return ctx;
}
