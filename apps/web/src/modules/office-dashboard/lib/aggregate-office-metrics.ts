import type { OperationsSession } from '@saki-operations/operations-session';
import { getDefaultOperationsSessionEngine } from '@saki-operations/operations-session';

import { listEmployees, type EmployeeRecord } from '@/modules/employees/lib/employee-store';
import { listVehicles, type VehicleRecord } from '@/modules/vehicles/lib/vehicle-store';

export type OfficeActivityItem = {
  id: string;
  moduleId: string;
  employeeId: string;
  vehicleId: string | null;
  endedAt: string;
  totalKm: number | null;
  workingDurationMs: number | null;
};

export type OfficeDashboardMetrics = {
  liveOperations: number;
  liveDeliveries: number;
  employeesOnline: number;
  vehiclesActive: number;
  pendingSync: number;
  operationsToday: number;
  deliveriesToday: number;
  multiDayActive: number;
  recentActivity: OfficeActivityItem[];
};

type EmployeeWithOptionalStatus = EmployeeRecord & {
  status?: 'available' | 'busy' | 'offline' | string;
};

function isSameLocalDay(iso: string | null | undefined, now: Date): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isMultiDaySession(session: OperationsSession): boolean {
  if (session.customFields.multiDay === true) return true;
  const days = session.customFields.numberOfDays;
  return typeof days === 'number' && days > 1;
}

function isPendingSyncSession(session: OperationsSession): boolean {
  if (session.status === 'completed') return true;
  if (session.uploadStatus === 'pending' || session.uploadStatus === 'failed') return true;
  return false;
}

function isVehicleMarkedActive(vehicle: VehicleRecord): boolean {
  const availability = vehicle.availability as string;
  return availability === 'assigned' || availability === 'busy' || availability === 'unavailable';
}

function countAvailableEmployees(liveEmployeeIds: Set<string>): number {
  const employees = listEmployees() as EmployeeWithOptionalStatus[];
  const hasExplicitStatus = employees.some((e) => typeof e.status === 'string');
  if (hasExplicitStatus) {
    return employees.filter((e) => e.status === 'available').length;
  }
  if (liveEmployeeIds.size > 0) return liveEmployeeIds.size;
  // Seed / local approximate: treat all recorded employees as available when idle.
  return employees.length;
}

/**
 * Aggregate LOCAL offline IndexedDB + store data for the Office Dashboard.
 */
export async function aggregateOfficeDashboardMetrics(
  now = new Date(),
): Promise<OfficeDashboardMetrics> {
  const engine = getDefaultOperationsSessionEngine();

  const [
    liveToursStarted,
    liveToursInProgress,
    liveHhcoStarted,
    liveHhcoInProgress,
    completedTours,
    syncedTours,
    completedHhco,
    syncedHhco,
    allSessions,
  ] = await Promise.all([
    engine.listSessions({ moduleId: 'saki_tours', status: 'started' }),
    engine.listSessions({ moduleId: 'saki_tours', status: 'in_progress' }),
    engine.listSessions({ moduleId: 'hhco', status: 'started' }),
    engine.listSessions({ moduleId: 'hhco', status: 'in_progress' }),
    engine.listSessions({ moduleId: 'saki_tours', status: 'completed' }),
    engine.listSessions({ moduleId: 'saki_tours', status: 'synced' }),
    engine.listSessions({ moduleId: 'hhco', status: 'completed' }),
    engine.listSessions({ moduleId: 'hhco', status: 'synced' }),
    engine.listSessions(),
  ]);

  const liveTours = dedupeSessions([...liveToursStarted, ...liveToursInProgress]);
  const liveHhco = dedupeSessions([...liveHhcoStarted, ...liveHhcoInProgress]);
  const liveAll = [...liveTours, ...liveHhco];

  const liveEmployeeIds = new Set(liveAll.map((s) => s.employeeId).filter(Boolean));
  const liveVehicleIds = new Set(
    liveAll.map((s) => s.vehicleId).filter((id): id is string => Boolean(id)),
  );

  const vehicles = listVehicles();
  const storeActiveVehicleIds = new Set(
    vehicles.filter(isVehicleMarkedActive).map((v) => v.id),
  );
  for (const id of liveVehicleIds) storeActiveVehicleIds.add(id);

  const finished = dedupeSessions([
    ...completedTours,
    ...syncedTours,
    ...completedHhco,
    ...syncedHhco,
  ]);

  const pendingSync = allSessions.filter(isPendingSyncSession).length;

  const operationsToday = finished.filter(
    (s) => s.moduleId === 'saki_tours' && isSameLocalDay(s.endTime ?? s.updatedAt, now),
  ).length;
  const deliveriesToday = finished.filter(
    (s) => s.moduleId === 'hhco' && isSameLocalDay(s.endTime ?? s.updatedAt, now),
  ).length;

  const multiDayActive = liveAll.filter(isMultiDaySession).length;

  const recentActivity = finished
    .slice()
    .sort((a, b) => {
      const aTime = Date.parse(a.endTime ?? a.updatedAt);
      const bTime = Date.parse(b.endTime ?? b.updatedAt);
      return bTime - aTime;
    })
    .slice(0, 10)
    .map((session) => ({
      id: session.id,
      moduleId: String(session.moduleId),
      employeeId: session.employeeId,
      vehicleId: session.vehicleId,
      endedAt: session.endTime ?? session.updatedAt,
      totalKm: session.totalKm,
      workingDurationMs: session.workingDurationMs,
    }));

  return {
    liveOperations: liveTours.length,
    liveDeliveries: liveHhco.length,
    employeesOnline: countAvailableEmployees(liveEmployeeIds),
    vehiclesActive: storeActiveVehicleIds.size,
    pendingSync,
    operationsToday,
    deliveriesToday,
    multiDayActive,
    recentActivity,
  };
}

function dedupeSessions(sessions: OperationsSession[]): OperationsSession[] {
  const byId = new Map<string, OperationsSession>();
  for (const session of sessions) {
    byId.set(session.id, session);
  }
  return [...byId.values()];
}
