/**
 * IndexedDB persistence for operations sessions + evidence.
 * Never loses draft / in-progress work across reloads.
 */

import type {
  OperationsSession,
  OperationsSessionStatus,
  SessionEvidenceItem,
} from '../types';
import {
  isUnfinishedSessionStatus,
  normalizeOperationsSession,
  VEHICLE_OCCUPYING_SESSION_STATUSES,
} from '../types';

const DB_NAME = 'saki-operations-sessions';
/** v2: vehicleId index for Operations V2 one-active-per-vehicle lookups
 *  v3: drop unused evidence type/uploadStatus indexes (queries use sessionId only)
 */
const DB_VERSION = 3;
const SESSIONS = 'sessions';
const EVIDENCE = 'evidence';

function ensureSessionIndexes(store: IDBObjectStore): void {
  if (!store.indexNames.contains('status')) {
    store.createIndex('status', 'status', { unique: false });
  }
  if (!store.indexNames.contains('moduleId')) {
    store.createIndex('moduleId', 'moduleId', { unique: false });
  }
  if (!store.indexNames.contains('employeeId')) {
    store.createIndex('employeeId', 'employeeId', { unique: false });
  }
  if (!store.indexNames.contains('vehicleId')) {
    store.createIndex('vehicleId', 'vehicleId', { unique: false });
  }
  if (!store.indexNames.contains('uploadStatus')) {
    store.createIndex('uploadStatus', 'uploadStatus', { unique: false });
  }
  if (!store.indexNames.contains('updatedAt')) {
    store.createIndex('updatedAt', 'updatedAt', { unique: false });
  }
}

function ensureEvidenceIndexes(store: IDBObjectStore): void {
  if (!store.indexNames.contains('sessionId')) {
    store.createIndex('sessionId', 'sessionId', { unique: false });
  }
  // Legacy unused indexes from earlier schema versions.
  if (store.indexNames.contains('type')) {
    store.deleteIndex('type');
  }
  if (store.indexNames.contains('uploadStatus')) {
    store.deleteIndex('uploadStatus');
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SESSIONS)) {
        const store = db.createObjectStore(SESSIONS, { keyPath: 'id' });
        ensureSessionIndexes(store);
      } else {
        const store = request.transaction?.objectStore(SESSIONS);
        if (store) ensureSessionIndexes(store);
      }
      if (!db.objectStoreNames.contains(EVIDENCE)) {
        const store = db.createObjectStore(EVIDENCE, { keyPath: 'id' });
        ensureEvidenceIndexes(store);
      } else {
        const store = request.transaction?.objectStore(EVIDENCE);
        if (store) ensureEvidenceIndexes(store);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
  });
}

function storeGet<T>(store: IDBObjectStore, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

function storeGetAll<T>(store: IDBObjectStore): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result as T[]) ?? []);
    req.onerror = () => reject(req.error);
  });
}

function storeGetAllFromIndex<T>(
  index: IDBIndex,
  query: IDBValidKey,
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const req = index.getAll(query);
    req.onsuccess = () => resolve((req.result as T[]) ?? []);
    req.onerror = () => reject(req.error);
  });
}

export type SessionListFilter = {
  status?: OperationsSessionStatus | OperationsSessionStatus[];
  moduleId?: string;
  employeeId?: string;
  /** Exact vehicle id — used for V2 one-active-per-vehicle queries (not enforced here) */
  vehicleId?: string;
};

export type SessionRepository = {
  putSession(session: OperationsSession): Promise<OperationsSession>;
  getSession(id: string): Promise<OperationsSession | null>;
  listSessions(filter?: SessionListFilter): Promise<OperationsSession[]>;
  listUnfinished(filter?: {
    moduleId?: string;
    employeeId?: string;
    vehicleId?: string;
  }): Promise<OperationsSession[]>;
  /**
   * Sessions that currently occupy a vehicle (`started` | `in_progress`).
   * Model helper only — does not reject additional starts.
   */
  listVehicleOccupying(vehicleId: string, filter?: { moduleId?: string }): Promise<OperationsSession[]>;
  deleteSession(id: string): Promise<void>;
  putEvidence(item: SessionEvidenceItem): Promise<SessionEvidenceItem>;
  getEvidence(id: string): Promise<SessionEvidenceItem | null>;
  listEvidenceForSession(sessionId: string): Promise<SessionEvidenceItem[]>;
  deleteEvidence(id: string): Promise<void>;
};

export function createIndexedDbSessionRepository(): SessionRepository {
  return {
    async putSession(session) {
      const db = await openDb();
      const tx = db.transaction(SESSIONS, 'readwrite');
      tx.objectStore(SESSIONS).put(normalizeOperationsSession(session));
      await txDone(tx);
      db.close();
      return normalizeOperationsSession(session);
    },

    async getSession(id) {
      const db = await openDb();
      const tx = db.transaction(SESSIONS, 'readonly');
      const row = await storeGet<OperationsSession>(tx.objectStore(SESSIONS), id);
      await txDone(tx);
      db.close();
      return row ? normalizeOperationsSession(row) : null;
    },

    async listSessions(filter) {
      const db = await openDb();
      const tx = db.transaction(SESSIONS, 'readonly');
      let rows = await storeGetAll<OperationsSession>(tx.objectStore(SESSIONS));
      await txDone(tx);
      db.close();

      rows = rows.map(normalizeOperationsSession);

      if (filter?.moduleId) {
        rows = rows.filter((s) => s.moduleId === filter.moduleId);
      }
      if (filter?.employeeId) {
        rows = rows.filter((s) => s.employeeId === filter.employeeId);
      }
      if (filter?.vehicleId) {
        rows = rows.filter((s) => s.vehicleId === filter.vehicleId);
      }
      if (filter?.status) {
        const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
        rows = rows.filter((s) => statuses.includes(s.status));
      }
      return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },

    async listUnfinished(filter) {
      const rows = await this.listSessions({
        moduleId: filter?.moduleId,
        employeeId: filter?.employeeId,
        vehicleId: filter?.vehicleId,
      });
      return rows.filter((s) => isUnfinishedSessionStatus(s.status));
    },

    async listVehicleOccupying(vehicleId, filter) {
      return this.listSessions({
        vehicleId,
        moduleId: filter?.moduleId,
        status: [...VEHICLE_OCCUPYING_SESSION_STATUSES],
      });
    },

    async deleteSession(id) {
      const db = await openDb();
      const tx = db.transaction([SESSIONS, EVIDENCE], 'readwrite');
      tx.objectStore(SESSIONS).delete(id);
      const evidence = await storeGetAllFromIndex<SessionEvidenceItem>(
        tx.objectStore(EVIDENCE).index('sessionId'),
        id,
      );
      for (const item of evidence) {
        tx.objectStore(EVIDENCE).delete(item.id);
      }
      await txDone(tx);
      db.close();
    },

    async putEvidence(item) {
      const db = await openDb();
      const tx = db.transaction(EVIDENCE, 'readwrite');
      tx.objectStore(EVIDENCE).put(item);
      await txDone(tx);
      db.close();
      return item;
    },

    async getEvidence(id) {
      const db = await openDb();
      const tx = db.transaction(EVIDENCE, 'readonly');
      const row = await storeGet<SessionEvidenceItem>(tx.objectStore(EVIDENCE), id);
      await txDone(tx);
      db.close();
      return row ?? null;
    },

    async listEvidenceForSession(sessionId) {
      const db = await openDb();
      const tx = db.transaction(EVIDENCE, 'readonly');
      const rows = await storeGetAllFromIndex<SessionEvidenceItem>(
        tx.objectStore(EVIDENCE).index('sessionId'),
        sessionId,
      );
      await txDone(tx);
      db.close();
      return rows.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    },

    async deleteEvidence(id) {
      const db = await openDb();
      const tx = db.transaction(EVIDENCE, 'readwrite');
      tx.objectStore(EVIDENCE).delete(id);
      await txDone(tx);
      db.close();
    },
  };
}
