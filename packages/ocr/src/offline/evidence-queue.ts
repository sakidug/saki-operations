/**
 * Offline photo evidence queue (IndexedDB).
 * Module-agnostic — parent later attaches `attachmentKey` (trip / delivery id).
 */

import type { OcrSyncStatus } from '../types';

const DB_NAME = 'saki-operations-ocr';
const DB_VERSION = 1;
const STORE = 'evidence';

export type QueuedEvidenceRecord = {
  clientLocalId: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
  capturedAt: string;
  syncStatus: OcrSyncStatus;
  attachmentKey: string | null;
  /** Base64 data URL for durable offline restore (images are small enough for KM photos) */
  dataUrl: string;
  odometerValue: string | null;
  confidence: number | null;
  createdAt: string;
  updatedAt: string;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'clientLocalId' });
        store.createIndex('syncStatus', 'syncStatus', { unique: false });
        store.createIndex('attachmentKey', 'attachmentKey', { unique: false });
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

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

export async function enqueueEvidence(
  record: Omit<QueuedEvidenceRecord, 'createdAt' | 'updatedAt' | 'syncStatus'> & {
    syncStatus?: OcrSyncStatus;
  },
): Promise<QueuedEvidenceRecord> {
  const now = new Date().toISOString();
  const full: QueuedEvidenceRecord = {
    ...record,
    syncStatus: record.syncStatus ?? 'queued',
    createdAt: now,
    updatedAt: now,
  };

  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).put(full);
  await txDone(tx);
  db.close();
  return full;
}

export async function updateEvidenceSyncStatus(
  clientLocalId: string,
  syncStatus: OcrSyncStatus,
): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  const existing = await new Promise<QueuedEvidenceRecord | undefined>((resolve, reject) => {
    const req = store.get(clientLocalId);
    req.onsuccess = () => resolve(req.result as QueuedEvidenceRecord | undefined);
    req.onerror = () => reject(req.error);
  });
  if (existing) {
    store.put({ ...existing, syncStatus, updatedAt: new Date().toISOString() });
  }
  await txDone(tx);
  db.close();
}

export async function listQueuedEvidence(
  filter?: { syncStatus?: OcrSyncStatus },
): Promise<QueuedEvidenceRecord[]> {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readonly');
  const store = tx.objectStore(STORE);
  const rows = await new Promise<QueuedEvidenceRecord[]>((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result as QueuedEvidenceRecord[]) ?? []);
    req.onerror = () => reject(req.error);
  });
  await txDone(tx);
  db.close();

  if (!filter?.syncStatus) return rows;
  return rows.filter((row) => row.syncStatus === filter.syncStatus);
}

export async function attachEvidenceToParent(
  clientLocalId: string,
  attachmentKey: string,
): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  const existing = await new Promise<QueuedEvidenceRecord | undefined>((resolve, reject) => {
    const req = store.get(clientLocalId);
    req.onsuccess = () => resolve(req.result as QueuedEvidenceRecord | undefined);
    req.onerror = () => reject(req.error);
  });
  if (existing) {
    store.put({
      ...existing,
      attachmentKey,
      updatedAt: new Date().toISOString(),
    });
  }
  await txDone(tx);
  db.close();
}
