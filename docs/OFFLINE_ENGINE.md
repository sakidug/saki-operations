# Offline Engine

## Client stores

| Store | Technology | Purpose |
| ----- | ---------- | ------- |
| Operations sessions + evidence | IndexedDB `saki-operations-sessions` | Tours / HHCO field sessions |
| OCR capture queue | IndexedDB `saki-operations-ocr` | Pre-accept photo buffer |
| **Saki Sync queue** | IndexedDB `saki-operations-sync` | Events, files, audit, meta |
| Leave / vehicles / employees | `localStorage` via `local-persist` | Office modules (still device-local data + now emit sync events for leave) |

## Guaranteed workflow

```
User Action
  ↓
Save locally (session engine / store)
  ↓
Create Sync Event (+ optional file)
  ↓
Continue working (UI never waits on upload)
  ↓
Reconnect / Sync now
  ↓
Automatic drain (batch uploads)
  ↓
Server acknowledgement
  ↓
Event → uploaded; completed ops → markSynced
```

## Survival

Queued events survive:

- App restart / browser refresh (IndexedDB)
- Offline periods (drain no-ops without access token / network)
- Failed uploads (retrying + exponential backoff, then failed)

## What offline does *not* mean

- Service worker asset cache ≠ business sync (assets are Phase 9.1 PWA; events are Phase 9.2)
- Office Leave/Vehicles/Employees multi-device merge of **records** is still evolving — Leave emits events; vehicles/employees can be extended similarly without changing the engine
