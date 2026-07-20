import {
  BUILTIN_EVIDENCE_TYPES,
  getDefaultOperationsSessionEngine,
  type OperationsSession,
} from '@saki-operations/operations-session';

import { emitSyncEvent, operationEventType } from '@/modules/sync/emit';

import type { StartOperationDraft } from '../types';
import { isMultiDay } from '../types';
import { createInitialMultiDayRecords } from './multi-day';

/**
 * Persist a fully collected Start Operation draft into the Session Engine.
 * Offline-safe — IndexedDB write happens inside the engine.
 * Multi-day sessions initialize daily records (Day 1 start already captured).
 *
 * Note: if this throws after `createDraft`, an orphan `draft` may remain in IndexedDB
 * (does not block Start; see KNOWN_ISSUES KI-018).
 */
export async function commitStartOperation(input: {
  employeeId: string;
  operatorId?: string | null;
  draft: StartOperationDraft;
}): Promise<OperationsSession> {
  const { draft, employeeId, operatorId } = input;

  if (
    !draft.driverId ||
    !draft.vehicleId ||
    !draft.dealerId ||
    !draft.startOdometer ||
    !draft.startTime
  ) {
    throw new Error('Start Operation draft is incomplete');
  }

  const engine = getDefaultOperationsSessionEngine();
  const multiDay = isMultiDay(draft.numberOfDays);

  let session = await engine.createDraft({
    moduleId: 'hhco',
    employeeId,
    vehicleId: draft.vehicleId,
    driverId: draft.driverId,
    operatorId: operatorId ?? employeeId,
    customFields: {
      dealerId: draft.dealerId,
      driverName: draft.driver?.displayName ?? null,
      startLocation: draft.startLocation.trim(),
      destination: draft.destination.trim(),
      endingLocation: draft.endingLocation.trim(),
      numberOfDays: draft.numberOfDays,
      multiDay,
      vehicleRegistration: draft.vehicle?.registrationNumber ?? null,
      vehicleName: draft.vehicle?.name ?? null,
      currentDay: 1,
      days: [] as unknown[],
      totalDailyWorkingMs: null,
    },
  });

  const attached = await engine.attachOdometerReading({
    sessionId: session.id,
    slot: 'start',
    reading: draft.startOdometer,
  });
  session = attached.session;

  const withTimeEvidence = await engine.addEvidence({
    sessionId: session.id,
    type: multiDay ? 'day_1_start_time' : BUILTIN_EVIDENCE_TYPES.startTime,
    photoBlob: draft.startTime.photoBlob,
    mimeType: draft.startTime.mimeType,
    fileName: draft.startTime.fileName,
    timestamp: draft.startTime.capturedAt,
    metadata: {
      source: 'device_clock',
      editableByDriver: false,
      day: 1,
      slot: 'start',
    },
  });
  session = withTimeEvidence.session;

  session = await engine.setStartTime(session.id, draft.startTime.capturedAt);
  session = await engine.start(session.id, draft.startTime.capturedAt);
  session = await engine.markInProgress(session.id);

  if (multiDay) {
    const days = createInitialMultiDayRecords({
      numberOfDays: draft.numberOfDays,
      day1StartTime: draft.startTime.capturedAt,
      day1StartEvidenceId: withTimeEvidence.evidence.id,
    });
    session = await engine.patchCustomFields(session.id, {
      multiDay: true,
      currentDay: 1,
      days,
      totalDailyWorkingMs: null,
    });
  }

  await emitSyncEvent({
    entityType: 'delivery',
    entityId: session.id,
    eventType: operationEventType('started', 'hhco'),
    employeeId: employeeId,
    version: session.revision,
    payload: {
      moduleId: 'hhco',
      vehicleId: draft.vehicleId,
      dealerId: draft.dealerId,
      startTime: draft.startTime.capturedAt,
      startOdometer: draft.startOdometer.value,
      numberOfDays: draft.numberOfDays,
    },
  });

  return session;
}
