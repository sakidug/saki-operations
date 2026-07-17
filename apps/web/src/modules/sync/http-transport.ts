import type { BatchAckItem, SyncEvent, SyncFileRecord, SyncTransport } from '@saki-operations/sync';

import { getAccessToken } from '@/modules/auth/session/token-storage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

async function api<T>(
  path: string,
  options: RequestInit & { accessToken?: string } = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  const token = options.accessToken ?? getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const payload = (await response.json().catch(() => null)) as
    | { data?: T; message?: string | string[] }
    | null;

  if (!response.ok) {
    const message = Array.isArray(payload?.message)
      ? payload.message.join(', ')
      : payload?.message || `Sync request failed (${response.status})`;
    throw new Error(message);
  }

  return (payload?.data ?? payload) as T;
}

/** HTTP transport for Saki Sync → Nest `/sync` API. */
export function createHttpSyncTransport(): SyncTransport {
  return {
    async uploadEvents(events: SyncEvent[]): Promise<BatchAckItem[]> {
      const data = await api<{ acks: BatchAckItem[] }>('/sync/events/batch', {
        method: 'POST',
        body: JSON.stringify({
          events: events.map((e) => ({
            eventId: e.eventId,
            entityType: e.entityType,
            entityId: e.entityId,
            eventType: e.eventType,
            deviceId: e.deviceId,
            userId: e.userId,
            timestamp: e.timestamp,
            payload: e.payload,
            version: e.version,
          })),
        }),
      });
      return data.acks;
    },

    async uploadFile(file: SyncFileRecord, accessToken: string) {
      return api<{ remoteUrl: string; remoteKey: string }>('/sync/files', {
        method: 'POST',
        accessToken,
        body: JSON.stringify({
          localId: file.localId,
          mimeType: file.mimeType,
          fileName: file.fileName,
          dataUrl: file.dataUrl,
          eventId: file.eventId,
        }),
      });
    },

    async pullDelta(since: string | null) {
      const qs = since ? `?since=${encodeURIComponent(since)}` : '';
      return api<{ events: SyncEvent[]; serverTime: string }>(`/sync/delta${qs}`);
    },
  };
}
