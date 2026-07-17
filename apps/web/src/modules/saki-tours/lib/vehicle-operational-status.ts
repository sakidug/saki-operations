import {
  getDefaultOperationsSessionEngine,
  type OperationsSession,
} from '@saki-operations/operations-session';
import type { VehicleOperationalStatus } from '@saki-operations/types';

import { getVehicle } from '@/modules/vehicles/lib/vehicle-store';

export type ToursVehicleStatus = {
  status: VehicleOperationalStatus;
  /** The active operation occupying this vehicle, when status is ON_TRIP. */
  activeSession: OperationsSession | null;
};

/**
 * Local-first active-operation lookup for a vehicle.
 * Uses the Phase 1 engine repository method `listActiveByVehicle`
 * (sessions in `started` | `in_progress`). Returns the most recent one.
 */
export async function findActiveSessionByVehicle(
  vehicleId: string,
): Promise<OperationsSession | null> {
  if (!vehicleId) return null;
  const engine = getDefaultOperationsSessionEngine();
  const active = await engine.listActiveByVehicle(vehicleId);
  if (active.length === 0) return null;
  active.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  return active[0] ?? null;
}

/**
 * Resolve a vehicle's operational status for the Start Operation picker.
 * Precedence: active operation (ON_TRIP) → vehicle-store SERVICE → AVAILABLE.
 */
export async function resolveToursVehicleStatus(
  vehicleId: string,
): Promise<ToursVehicleStatus> {
  const activeSession = await findActiveSessionByVehicle(vehicleId);
  if (activeSession) {
    return { status: 'ON_TRIP', activeSession };
  }
  const record = getVehicle(vehicleId);
  if (record?.status === 'SERVICE') {
    return { status: 'SERVICE', activeSession: null };
  }
  return { status: 'AVAILABLE', activeSession: null };
}

export async function resolveToursVehicleStatuses(
  vehicleIds: readonly string[],
): Promise<Map<string, ToursVehicleStatus>> {
  const entries = await Promise.all(
    vehicleIds.map(
      async (id) => [id, await resolveToursVehicleStatus(id)] as const,
    ),
  );
  return new Map(entries);
}
