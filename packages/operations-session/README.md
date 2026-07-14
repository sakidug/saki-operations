# @saki-operations/operations-session

Reusable **Operations Session Engine** for Saki Operations.

Powers (later):

- Saki Tours Operations
- HHCO Helmet Delivery Operations

This package has **no business UI** and does not know Tours vs HHCO rules beyond a free-form `moduleId` + `customFields`.

## Lifecycle

`draft` → `started` → `in_progress` → `completed` → `synced`

Unfinished sessions (`draft` | `started` | `in_progress`) can be resumed after crash / reload.

## Example

```ts
import {
  OperationsSessionEngine,
  BUILTIN_EVIDENCE_TYPES,
} from '@saki-operations/operations-session';

const engine = new OperationsSessionEngine();

const draft = await engine.createDraft({
  moduleId: 'saki_tours',
  employeeId: 'emp_1',
  vehicleId: 'veh_1',
  customFields: { hireType: 'wedding' },
});

await engine.start(draft.id);
await engine.markInProgress(draft.id);

// After OCR Accept from @saki-operations/ocr:
// await engine.attachOdometerReading({ sessionId, slot: 'start', reading });

await engine.complete(draft.id);
// later, after upload:
await engine.markSynced(draft.id);
```

## Offline

All sessions and evidence photos are stored in IndexedDB (`saki-operations-sessions`).
Photos are kept as data URLs with `uploadStatus: pending` until Sync drains the queue.
