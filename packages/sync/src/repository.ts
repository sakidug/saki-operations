import type { SyncAuditEntry, SyncEvent, SyncFileRecord, SyncStatus } from './types';

const DB_NAME = 'saki-operations-sync';
const DB_VERSION = 1;

type StoreName = 'events' | 'files' | 'audit' | 'meta';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error('IDB open failed'));
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('events')) {
        const store = db.createObjectStore('events', { keyPath: 'eventId' });
        store.createIndex('syncStatus', 'syncStatus', { unique: false });
        store.createIndex('entityId', 'entityId', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
      if (!db.objectStoreNames.contains('files')) {
        const store = db.createObjectStore('files', { keyPath: 'localId' });
        store.createIndex('syncStatus', 'syncStatus', { unique: false });
        store.createIndex('eventId', 'eventId', { unique: false });
      }
      if (!db.objectStoreNames.contains('audit')) {
        const store = db.createObjectStore('audit', { keyPath: 'id' });
        store.createIndex('eventId', 'eventId', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}

async function withStore<T>(
  storeName: StoreName,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    let req: IDBRequest<T> | undefined;
    try {
      const result = fn(store);
      if (result) req = result;
    } catch (error) {
      reject(error);
      return;
    }
    tx.oncomplete = () => resolve(req?.result);
    tx.onerror = () => reject(tx.error ?? new Error('IDB tx failed'));
  });
}

function requestToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IDB request failed'));
  });
}

export class SyncIndexedDbRepository {
  async putEvent(event: SyncEvent): Promise<void> {
    await withStore('events', 'readwrite', (store) => {
      store.put(event);
    });
  }

  async getEvent(eventId: string): Promise<SyncEvent | undefined> {
    const db = await openDb();
    return requestToPromise(db.transaction('events').objectStore('events').get(eventId));
  }

  async listEventsByStatus(statuses: SyncStatus[]): Promise<SyncEvent[]> {
    const db = await openDb();
    const all = await requestToPromise(
      db.transaction('events').objectStore('events').getAll(),
    );
    const set = new Set(statuses);
    return (all as SyncEvent[])
      .filter((e) => set.has(e.syncStatus))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  async listAllEvents(): Promise<SyncEvent[]> {
    const db = await openDb();
    return requestToPromise(db.transaction('events').objectStore('events').getAll());
  }

  async putFile(file: SyncFileRecord): Promise<void> {
    await withStore('files', 'readwrite', (store) => {
      store.put(file);
    });
  }

  async getFile(localId: string): Promise<SyncFileRecord | undefined> {
    const db = await openDb();
    return requestToPromise(db.transaction('files').objectStore('files').get(localId));
  }

  async listFilesByStatus(statuses: SyncStatus[]): Promise<SyncFileRecord[]> {
    const db = await openDb();
    const all = await requestToPromise(
      db.transaction('files').objectStore('files').getAll(),
    );
    const set = new Set(statuses);
    return (all as SyncFileRecord[]).filter((f) => set.has(f.syncStatus));
  }

  async putAudit(entry: SyncAuditEntry): Promise<void> {
    await withStore('audit', 'readwrite', (store) => {
      store.put(entry);
    });
  }

  async listAudit(limit = 100): Promise<SyncAuditEntry[]> {
    const db = await openDb();
    const all = (await requestToPromise(
      db.transaction('audit').objectStore('audit').getAll(),
    )) as SyncAuditEntry[];
    return all.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, limit);
  }

  async getMeta<T>(key: string): Promise<T | null> {
    const db = await openDb();
    const row = await requestToPromise(
      db.transaction('meta').objectStore('meta').get(key),
    );
    return (row as { key: string; value: T } | undefined)?.value ?? null;
  }

  async setMeta<T>(key: string, value: T): Promise<void> {
    await withStore('meta', 'readwrite', (store) => {
      store.put({ key, value });
    });
  }
}
