import { getDefaultOperationsSessionEngine, type OperationsSession } from '@saki-operations/operations-session';

import { emitSyncEvent, operationEventType } from '@/modules/sync/emit';
import { setVehicleStatus } from '@/modules/vehicles/lib/vehicle-store';

import type { StartOperationDraft } from '../types';
import { startGpsTracking } from './gps-tracking';
import { findActiveSessionByVehicle } from './vehicle-operational-status';

/**
 * Thrown when the selected vehicle already has an active operation.
 * No draft or session is created when this is raised (Operations V2 lock).
 */
export class VehicleActiveOperationError extends Error {
  readonly code = 'vehicle_active';
  constructor(readonly activeSession: OperationsSession) {
    super('This vehicle already has an active operation.');
    this.name = 'VehicleActiveOperationError';
  }
}

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
    !draft.companyId ||
    !draft.vehicleId ||
    !draft.driverId ||
    !draft.startOdometer ||
    draft.destination.trim().length === 0
  ) {
    throw new Error('Start Operation draft is incomplete');
  }

  // Operations V2 lock — one active operation per vehicle. Checked before any
  // draft/session is created so a locked vehicle never produces an orphan draft.
  const vehicleActive = await findActiveSessionByVehicle(draft.vehicleId);
  if (vehicleActive) {
    throw new VehicleActiveOperationError(vehicleActive);
  }

  const engine = getDefaultOperationsSessionEngine();
  const startTime = new Date().toISOString();

  let session = await engine.createDraft({
    moduleId: 'saki_tours',
    employeeId,
    vehicleId: draft.vehicleId,
    companyId: draft.companyId,
    driverId: draft.driverId,
    assistantIds: draft.assistantIds,
    operatorId: operatorId ?? employeeId,
    customFields: {
      companyName: draft.company?.name ?? null,
      companyShortName: draft.company?.shortName ?? null,
      driverName: draft.driver?.displayName ?? null,
      assistantNames: draft.assistants.map((assistant) => assistant.displayName),
      destination: draft.destination.trim(),
      // Legacy Tours fields remain present so old summary/history readers do not break.
      hireType: draft.hireType,
      startLocation: draft.startLocation.trim(),
      endingLocation: draft.endingLocation.trim(),
      numberOfDays: draft.numberOfDays,
      multiDay: false,
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

  session = await engine.setStartTime(session.id, startTime);
  session = await engine.start(session.id, startTime);
  session = await engine.markInProgress(session.id);

  // Operations V2 — denormalized vehicle status for the fleet catalog/admin views.
  // Local-first side effect; failure here must not fail the started operation.
  try {
    setVehicleStatus(draft.vehicleId, 'ON_TRIP');
  } catch {
    // vehicle-store is best-effort; the session repository remains the lock source of truth.
  }

  // Operations V2 Phase 5 — request location permission and begin local GPS
  // tracking only after the session has started successfully.
  startGpsTracking(session);

  await emitSyncEvent({
    entityType: 'operation',
    entityId: session.id,
    eventType: operationEventType('started', 'saki_tours'),
    employeeId: employeeId,
    version: session.revision,
    payload: {
      moduleId: 'saki_tours',
      vehicleId: draft.vehicleId,
      hireType: draft.hireType,
      startTime,
      startOdometer: draft.startOdometer.value,
      numberOfDays: draft.numberOfDays,
    },
  });

  return session;
}
