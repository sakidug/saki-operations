import {
  getDefaultOperationsSessionEngine,
  parseOdometerNumber,
  type OperationsSession,
} from '@saki-operations/operations-session';

import { emitSyncEvent, emitSyncFile, operationEventType } from '@/modules/sync/emit';
import { setVehicleStatus } from '@/modules/vehicles/lib/vehicle-store';

import type { EndOperationDraft } from '../types';
import { stopGpsTracking } from './gps-tracking';

/**
 * Attach end odometer evidence, auto-stamp device completion time, complete the session.
 * Sync event payloads are intentionally unchanged (Phase 3 scope).
 * Session stays `completed` + queued until the server acks `operation.completed`.
 */
export async function commitEndOperation(input: {
  sessionId: string;
  draft: EndOperationDraft;
  employeeId: string;
}): Promise<OperationsSession> {
  const { sessionId, draft, employeeId } = input;

  if (!draft.endOdometer) {
    throw new Error('End Operation draft is incomplete');
  }

  const endKm = parseOdometerNumber(draft.endOdometer.value);
  if (endKm == null) {
    throw new Error('End odometer reading is invalid');
  }

  const engine = getDefaultOperationsSessionEngine();
  const endTime = new Date().toISOString();

  const attached = await engine.attachOdometerReading({
    sessionId,
    slot: 'end',
    reading: draft.endOdometer,
  });
  let session = attached.session;

  if (session.startOdometer != null) {
    const distanceKm = endKm - session.startOdometer;
    if (!Number.isFinite(distanceKm) || distanceKm < 0) {
      throw new Error('End KM must be greater than or equal to Start KM');
    }
  }

  session = await engine.setEndTime(session.id, endTime);
  // Engine complete() also sets totalKm / distanceKm from start/end odometers.
  session = await engine.complete(session.id, endTime);
  stopGpsTracking(session.id);

  // Operations V2 — release the vehicle back to AVAILABLE once the operation finishes.
  // Local-first side effect; failure here must not fail the completed operation.
  if (session.vehicleId) {
    try {
      setVehicleStatus(session.vehicleId, 'AVAILABLE');
    } catch {
      // vehicle-store is best-effort; the session repository remains the lock source of truth.
    }
  }

  const odoFileId = await emitSyncFile({
    mimeType: draft.endOdometer.photo.mimeType || 'image/jpeg',
    fileName: draft.endOdometer.photo.fileName || 'end-odometer.jpg',
    blob: draft.endOdometer.photo.blob,
  });
  await emitSyncEvent({
    entityType: 'odometer',
    entityId: session.id,
    eventType: 'odometer.confirmed',
    employeeId: employeeId,
    version: session.revision ?? 1,
    payload: {
      slot: 'end',
      value: draft.endOdometer.value,
      source: draft.endOdometer.source,
      fileLocalId: odoFileId,
    },
    fileLocalId: odoFileId,
  });
  await emitSyncEvent({
    entityType: 'operation',
    entityId: session.id,
    eventType: operationEventType('completed', 'saki_tours'),
    employeeId: employeeId,
    version: session.revision ?? 1,
    payload: {
      moduleId: 'saki_tours',
      endTime,
      totalKm: session.totalKm,
      workingDurationMs: session.workingDurationMs,
    },
  });

  return session;
}
