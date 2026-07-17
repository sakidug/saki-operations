# Sync Events

## Envelope

Every event includes:

| Field | Description |
| ----- | ----------- |
| `eventId` | UUID (idempotency key) |
| `entityType` | `operation` \| `delivery` \| `evidence` \| `odometer` \| `leave` \| … |
| `entityId` | Domain id (e.g. session id, leave id) |
| `eventType` | See catalogue below |
| `deviceId` | Stable per install (`localStorage`) |
| `userId` | Authenticated user id |
| `timestamp` | UTC ISO-8601 |
| `payload` | Event-specific JSON |
| `version` | Optimistic concurrency token |
| `retryCount` | Client retry attempts |
| `syncStatus` | `pending` \| `uploading` \| `uploaded` \| `conflict` \| `failed` \| `retrying` \| `cancelled` |

## Event catalogue (v0.9.2)

| Event type | Emitted from |
| ---------- | ------------ |
| `operation.started` | Tours start commit |
| `operation.completed` | Tours end / multi-day finish |
| `delivery.started` | HHCO start commit |
| `delivery.completed` | HHCO end / multi-day finish |
| `odometer.confirmed` | End odometer accepts |
| `photo.added` | HHCO delivery photos |
| `leave.requested` | Leave apply |
| `leave.approved` / `leave.rejected` | Leave decide |

Additional types are reserved in `SyncEventType` for vehicle/employee updates and heartbeats.

## API

- `POST /api/v1/sync/events/batch` — `{ events: [...] }` → `{ acks: [...] }`
- `POST /api/v1/sync/files` — `{ localId, mimeType, fileName, dataUrl, eventId? }`
- `GET /api/v1/sync/delta?since=` — incremental download for the authenticated user

## Batching

Client drains up to **25** events per request with exponential backoff on transport failure.
