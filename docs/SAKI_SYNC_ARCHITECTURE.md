# Saki Sync Architecture

**Phase:** 9.2 · **Package:** `@saki-operations/sync` · **API:** `/api/v1/sync`

## Goal

Offline-first, **event-sourced** synchronization. Devices never push full tables. Every user action becomes a durable **Sync Event** that is queued locally, uploaded when online, acknowledged by the server, and audited.

## Layers

```
User Action
  → Local domain write (IndexedDB / localStorage)
  → emitSyncEvent() / emitSyncFile()
  → SyncEngine queue (IndexedDB: events, files, audit, meta)
  → HTTP transport (batch events + file upload)
  → Nest SyncModule (auth + permissions + ingest)
  → Postgres (sync_events, sync_entity_states, sync_audit_logs, sync_blobs)
  → Ack → client marks event uploaded → session markSynced when applicable
```

## Core components

| Component | Location |
| --------- | -------- |
| Event types + statuses | `packages/sync/src/types.ts` |
| IndexedDB repository | `packages/sync/src/repository.ts` |
| SyncEngine (drain, retry, backoff) | `packages/sync/src/engine.ts` |
| Web transport | `apps/web/src/modules/sync/http-transport.ts` |
| Web provider + UX wiring | `apps/web/src/modules/sync/sync-provider.tsx` |
| Emit helpers | `apps/web/src/modules/sync/emit.ts` |
| API ingest | `apps/api/src/modules/sync/` |

## Principles

1. **Local write first** — never block drivers on network  
2. **Events, not records** — `operation.completed`, `odometer.confirmed`, `leave.approved`, …  
3. **Idempotent ingest** — unique `eventId` → duplicate ack  
4. **Optimistic concurrency** — stale `version` → conflict  
5. **Files separate** — photos/attachments upload via `/sync/files`, metadata via events  
6. **Auth on every request** — JWT + `@Roles` on SyncController  

## File storage

Blobs are written under `storage/uploads/sync/` (configurable via `SYNC_UPLOAD_DIR`).  
R2 remains optional (KI-007) — the blob registry is DB-backed so a future R2 adapter can swap the storage backend without changing the event model.

## Auto drain triggers

- Network restored (`useNetwork`)
- Authenticated interval (60s)
- Manual **Sync now** / **Retry failed** on Home
- Optional Background Sync tag `saki-sync-drain` when browser supports it

See also: [OFFLINE_ENGINE.md](./OFFLINE_ENGINE.md), [SYNC_EVENTS.md](./SYNC_EVENTS.md), [CONFLICT_RESOLUTION.md](./CONFLICT_RESOLUTION.md).
