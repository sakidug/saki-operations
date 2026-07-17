import type { OperationsSession } from '@saki-operations/operations-session';

const DB_NAME = 'saki-operations-gps';
const DB_VERSION = 1;
const GPS_POINTS = 'gpsPoints';

export const GPS_POOR_ACCURACY_METERS = 50;
export const GPS_LOW_BATTERY_LEVEL = 0.15;

export type GpsNetworkStatus = 'online' | 'offline';

export type GpsPoint = {
  id: string;
  sessionId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy: number | null;
  batteryLevel: number | null;
  networkStatus: GpsNetworkStatus;
  createdAt: string;
};

export type GpsTrackingState = 'idle' | 'waiting' | 'connected' | 'error' | 'unsupported';

export type GpsRuntimeStatus = {
  sessionId: string | null;
  state: GpsTrackingState;
  accuracy: number | null;
  batteryLevel: number | null;
  networkStatus: GpsNetworkStatus;
  lastPointAt: string | null;
  errorMessage: string | null;
};

type BatteryManagerLike = {
  level: number;
};

type NavigatorWithBattery = Navigator & {
  getBattery?: () => Promise<BatteryManagerLike>;
};

const listeners = new Set<() => void>();
let watchId: number | null = null;
let activeSessionId: string | null = null;
let lastBatteryLevel: number | null = null;

let status: GpsRuntimeStatus = {
  sessionId: null,
  state: 'idle',
  accuracy: null,
  batteryLevel: null,
  networkStatus: currentNetworkStatus(),
  lastPointAt: null,
  errorMessage: null,
};

function currentNetworkStatus(): GpsNetworkStatus {
  if (typeof navigator === 'undefined') return 'online';
  return navigator.onLine ? 'online' : 'offline';
}

function createGpsPointId(): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `gps_${rand}`;
}

function emit() {
  for (const listener of listeners) listener();
}

function setStatus(next: Partial<GpsRuntimeStatus>) {
  status = {
    ...status,
    ...next,
    networkStatus: next.networkStatus ?? currentNetworkStatus(),
  };
  emit();
}

function ensureGpsIndexes(store: IDBObjectStore): void {
  if (!store.indexNames.contains('sessionId')) {
    store.createIndex('sessionId', 'sessionId', { unique: false });
  }
  if (!store.indexNames.contains('timestamp')) {
    store.createIndex('timestamp', 'timestamp', { unique: false });
  }
}

function openGpsDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(GPS_POINTS)) {
        const store = db.createObjectStore(GPS_POINTS, { keyPath: 'id' });
        ensureGpsIndexes(store);
      } else {
        const store = request.transaction?.objectStore(GPS_POINTS);
        if (store) ensureGpsIndexes(store);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('GPS IndexedDB open failed'));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('GPS IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error ?? new Error('GPS IndexedDB transaction aborted'));
  });
}

async function putGpsPoint(point: GpsPoint): Promise<void> {
  const db = await openGpsDb();
  const tx = db.transaction(GPS_POINTS, 'readwrite');
  tx.objectStore(GPS_POINTS).put(point);
  await txDone(tx);
  db.close();
}

async function getBatteryLevel(): Promise<number | null> {
  if (typeof navigator === 'undefined') return null;
  const nav = navigator as NavigatorWithBattery;
  if (!nav.getBattery) return lastBatteryLevel;
  try {
    const battery = await nav.getBattery();
    lastBatteryLevel = Number.isFinite(battery.level) ? battery.level : null;
    return lastBatteryLevel;
  } catch {
    return lastBatteryLevel;
  }
}

async function recordPosition(sessionId: string, position: GeolocationPosition) {
  const timestamp = new Date(position.timestamp || Date.now()).toISOString();
  const batteryLevel = await getBatteryLevel();
  const point: GpsPoint = {
    id: createGpsPointId(),
    sessionId,
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    timestamp,
    accuracy: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null,
    batteryLevel,
    networkStatus: currentNetworkStatus(),
    createdAt: new Date().toISOString(),
  };
  await putGpsPoint(point);
  setStatus({
    sessionId,
    state: 'connected',
    accuracy: point.accuracy,
    batteryLevel,
    networkStatus: point.networkStatus,
    lastPointAt: timestamp,
    errorMessage: null,
  });
}

function handlePositionError(sessionId: string, error: GeolocationPositionError) {
  setStatus({
    sessionId,
    state: 'waiting',
    errorMessage: error.message || 'Waiting for GPS',
  });
}

export function subscribeGpsTracking(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getGpsTrackingStatus(): GpsRuntimeStatus {
  return status;
}

export function startGpsTracking(session: OperationsSession): void {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    setStatus({
      sessionId: session.id,
      state: 'unsupported',
      errorMessage: 'GPS is not supported by this device.',
    });
    return;
  }

  if (watchId != null && activeSessionId === session.id) {
    return;
  }

  if (watchId != null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  activeSessionId = session.id;
  setStatus({
    sessionId: session.id,
    state: 'waiting',
    accuracy: null,
    batteryLevel: lastBatteryLevel,
    networkStatus: currentNetworkStatus(),
    errorMessage: null,
  });

  void getBatteryLevel().then((batteryLevel) => {
    if (activeSessionId === session.id) {
      setStatus({ batteryLevel });
    }
  });

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      void recordPosition(session.id, position).catch((error: unknown) => {
        setStatus({
          sessionId: session.id,
          state: 'error',
          errorMessage: error instanceof Error ? error.message : 'Could not save GPS point.',
        });
      });
    },
    (error) => handlePositionError(session.id, error),
    {
      enableHighAccuracy: true,
      maximumAge: 15_000,
      timeout: 20_000,
    },
  );
}

export function ensureGpsTrackingForActiveSession(session: OperationsSession | null): void {
  if (session?.status === 'started' || session?.status === 'in_progress') {
    startGpsTracking(session);
  }
}

export function stopGpsTracking(sessionId?: string | null): void {
  if (sessionId && activeSessionId && sessionId !== activeSessionId) {
    return;
  }
  if (typeof navigator !== 'undefined' && navigator.geolocation && watchId != null) {
    navigator.geolocation.clearWatch(watchId);
  }
  watchId = null;
  activeSessionId = null;
  setStatus({
    sessionId: null,
    state: 'idle',
    accuracy: null,
    lastPointAt: null,
    errorMessage: null,
  });
}
