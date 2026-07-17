# Conflict Resolution

## Strategy

**Optimistic concurrency** on `(entityType, entityId)`:

1. Server stores `SyncEntityState.version`
2. Client sends `event.version` reflecting the entity revision known at emit time
3. If `event.version < serverVersion` → ack `conflict` (event still stored for audit)
4. If accepted → server increments version and updates `lastEventId` / device / user

## Duplicate uploads

Same `eventId` twice → ack `duplicate` (idempotent success for the client).

## Clock differences

Ordering uses server `createdAt` for delta pulls and client `timestamp` for local queue order. Conflicts are decided by **version**, not wall clock.

## Deleted / missing entities

Client `markSynced` after `operation.completed` / `delivery.completed` is best-effort — missing local sessions are ignored.

## Retry after failure

- Transport errors → `retrying` with exponential backoff (cap ~5 minutes)
- After `MAX_RETRIES` (12) → `failed`
- User **Retry failed** resets failed events to `pending` (conflicts stay until manually addressed)

## Audit

Every ingest writes `sync_audit_logs` with who / device / action / result / previous & new version snapshots.

## Multi-device same record

Last accepted non-stale write wins at the server version cursor. Divergent offline branches surface as `conflict` for operator review (full merge UI is future work).
