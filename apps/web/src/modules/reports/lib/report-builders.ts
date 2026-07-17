import type { OperationsSession } from '@saki-operations/operations-session';
import { getDefaultOperationsSessionEngine } from '@saki-operations/operations-session';

import { getEmployee, listEmployees } from '@/modules/employees/lib/employee-store';
import { getVehicle, listVehicles } from '@/modules/vehicles/lib/vehicle-store';

export type ReportType =
  | 'daily'
  | 'monthly'
  | 'employee'
  | 'vehicle'
  | 'tours'
  | 'hhco';

export type ReportPeriod = 'daily' | 'monthly';

export type ReportColumn = {
  key: string;
  labelKey: string;
};

export type ReportRow = Record<string, string | number>;

export type BuiltReport = {
  reportType: ReportType;
  period: ReportPeriod;
  titleKey: string;
  columns: ReportColumn[];
  rows: ReportRow[];
  summary: {
    sessions: number;
    totalKm: number;
    workingDurationMs: number;
  };
  generatedAt: string;
};

function dedupeSessions(sessions: OperationsSession[]): OperationsSession[] {
  const byId = new Map<string, OperationsSession>();
  for (const session of sessions) byId.set(session.id, session);
  return [...byId.values()];
}

function sessionAnchor(session: OperationsSession): Date | null {
  const d = new Date(session.endTime ?? session.startTime ?? session.updatedAt);
  return Number.isNaN(d.getTime()) ? null : d;
}

function inPeriod(session: OperationsSession, period: ReportPeriod, now: Date): boolean {
  const anchor = sessionAnchor(session);
  if (!anchor) return false;
  if (period === 'daily') {
    return (
      anchor.getFullYear() === now.getFullYear() &&
      anchor.getMonth() === now.getMonth() &&
      anchor.getDate() === now.getDate()
    );
  }
  return anchor.getFullYear() === now.getFullYear() && anchor.getMonth() === now.getMonth();
}

function isFinished(session: OperationsSession): boolean {
  return session.status === 'completed' || session.status === 'synced';
}

function workingMs(session: OperationsSession): number {
  return session.workingDurationMs ?? 0;
}

function kmOf(session: OperationsSession): number {
  return session.totalKm ?? 0;
}

async function loadFinishedSessions(moduleId?: 'saki_tours' | 'hhco'): Promise<OperationsSession[]> {
  const engine = getDefaultOperationsSessionEngine();
  const filter = moduleId ? { moduleId } : {};
  const [completed, synced] = await Promise.all([
    engine.listSessions({ ...filter, status: 'completed' }),
    engine.listSessions({ ...filter, status: 'synced' }),
  ]);
  return dedupeSessions([...completed, ...synced]).filter(isFinished);
}

function formatHours(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0';
  return (ms / 3_600_000).toFixed(2);
}

function baseSummary(sessions: OperationsSession[]) {
  return {
    sessions: sessions.length,
    totalKm: sessions.reduce((sum, s) => sum + kmOf(s), 0),
    workingDurationMs: sessions.reduce((sum, s) => sum + workingMs(s), 0),
  };
}

function moduleLabel(moduleId: string): string {
  if (moduleId === 'hhco') return 'HHCO';
  if (moduleId === 'saki_tours') return 'Saki Tours';
  return moduleId;
}

function buildSummaryRows(sessions: OperationsSession[], period: ReportPeriod): BuiltReport {
  const byModule = new Map<string, OperationsSession[]>();
  for (const session of sessions) {
    const key = String(session.moduleId);
    const list = byModule.get(key) ?? [];
    list.push(session);
    byModule.set(key, list);
  }

  const moduleRows: ReportRow[] = [...byModule.entries()].map(([moduleId, list]) => ({
    module: moduleLabel(moduleId),
    sessions: list.length,
    hours: formatHours(list.reduce((sum, s) => sum + workingMs(s), 0)),
    km: list.reduce((sum, s) => sum + kmOf(s), 0),
  }));

  const detailRows: ReportRow[] = sessions
    .slice()
    .sort((a, b) => Date.parse(b.endTime ?? b.updatedAt) - Date.parse(a.endTime ?? a.updatedAt))
    .map((session) => ({
      module: moduleLabel(String(session.moduleId)),
      employee: getEmployee(session.employeeId)?.displayName ?? session.employeeId,
      vehicle:
        (session.vehicleId && getVehicle(session.vehicleId)?.name) ||
        session.vehicleId ||
        '—',
      hours: formatHours(workingMs(session)),
      km: kmOf(session),
      ended: session.endTime ?? session.updatedAt,
    }));

  return {
    reportType: period === 'daily' ? 'daily' : 'monthly',
    period,
    titleKey: period === 'daily' ? 'reportsOps.types.daily' : 'reportsOps.types.monthly',
    columns: [
      { key: 'module', labelKey: 'reportsOps.columns.module' },
      { key: 'employee', labelKey: 'reportsOps.columns.employee' },
      { key: 'vehicle', labelKey: 'reportsOps.columns.vehicle' },
      { key: 'sessions', labelKey: 'reportsOps.columns.sessions' },
      { key: 'hours', labelKey: 'reportsOps.columns.hours' },
      { key: 'km', labelKey: 'reportsOps.columns.km' },
      { key: 'ended', labelKey: 'reportsOps.columns.ended' },
    ],
    // Module totals first, then session detail lines (sessions/ended filled when relevant).
    rows: [
      ...moduleRows,
      ...detailRows.map((row) => ({ ...row, sessions: '' })),
    ],
    summary: baseSummary(sessions),
    generatedAt: new Date().toISOString(),
  };
}

function buildEmployeeRows(sessions: OperationsSession[], period: ReportPeriod): BuiltReport {
  const byEmployee = new Map<string, OperationsSession[]>();
  for (const session of sessions) {
    const list = byEmployee.get(session.employeeId) ?? [];
    list.push(session);
    byEmployee.set(session.employeeId, list);
  }

  const knownIds = new Set([...byEmployee.keys(), ...listEmployees().map((e) => e.employeeId)]);
  const rows: ReportRow[] = [...knownIds]
    .map((employeeId) => {
      const list = byEmployee.get(employeeId) ?? [];
      const employee = getEmployee(employeeId);
      return {
        employee: employee?.displayName ?? employeeId,
        employeeId,
        sessions: list.length,
        hours: formatHours(list.reduce((sum, s) => sum + workingMs(s), 0)),
        km: list.reduce((sum, s) => sum + kmOf(s), 0),
      };
    })
    .filter((row) => Number(row.sessions) > 0)
    .sort((a, b) => String(a.employee).localeCompare(String(b.employee)));

  return {
    reportType: 'employee',
    period,
    titleKey: 'reportsOps.types.employee',
    columns: [
      { key: 'employee', labelKey: 'reportsOps.columns.employee' },
      { key: 'employeeId', labelKey: 'reportsOps.columns.employeeId' },
      { key: 'sessions', labelKey: 'reportsOps.columns.sessions' },
      { key: 'hours', labelKey: 'reportsOps.columns.hours' },
      { key: 'km', labelKey: 'reportsOps.columns.km' },
    ],
    rows,
    summary: baseSummary(sessions),
    generatedAt: new Date().toISOString(),
  };
}

function buildVehicleRows(sessions: OperationsSession[], period: ReportPeriod): BuiltReport {
  const byVehicle = new Map<string, OperationsSession[]>();
  for (const session of sessions) {
    const key = session.vehicleId ?? 'unassigned';
    const list = byVehicle.get(key) ?? [];
    list.push(session);
    byVehicle.set(key, list);
  }

  const rows: ReportRow[] = [...byVehicle.entries()]
    .map(([vehicleId, list]) => {
      const vehicle = vehicleId === 'unassigned' ? undefined : getVehicle(vehicleId);
      return {
        vehicle: vehicle?.name ?? (vehicleId === 'unassigned' ? '—' : vehicleId),
        registration: vehicle?.registrationNumber ?? '—',
        sessions: list.length,
        hours: formatHours(list.reduce((sum, s) => sum + workingMs(s), 0)),
        km: list.reduce((sum, s) => sum + kmOf(s), 0),
      };
    })
    .sort((a, b) => String(a.vehicle).localeCompare(String(b.vehicle)));

  // Ensure fleet vehicles with zero activity still appear for monthly overview when none filtered out
  if (rows.length === 0) {
    for (const vehicle of listVehicles()) {
      rows.push({
        vehicle: vehicle.name,
        registration: vehicle.registrationNumber,
        sessions: 0,
        hours: '0',
        km: 0,
      });
    }
  }

  return {
    reportType: 'vehicle',
    period,
    titleKey: 'reportsOps.types.vehicle',
    columns: [
      { key: 'vehicle', labelKey: 'reportsOps.columns.vehicle' },
      { key: 'registration', labelKey: 'reportsOps.columns.registration' },
      { key: 'sessions', labelKey: 'reportsOps.columns.sessions' },
      { key: 'hours', labelKey: 'reportsOps.columns.hours' },
      { key: 'km', labelKey: 'reportsOps.columns.km' },
    ],
    rows,
    summary: baseSummary(sessions),
    generatedAt: new Date().toISOString(),
  };
}

function buildModuleRows(
  sessions: OperationsSession[],
  period: ReportPeriod,
  reportType: 'tours' | 'hhco',
): BuiltReport {
  const rows: ReportRow[] = sessions
    .slice()
    .sort((a, b) => Date.parse(b.endTime ?? b.updatedAt) - Date.parse(a.endTime ?? a.updatedAt))
    .map((session) => ({
      employee: getEmployee(session.employeeId)?.displayName ?? session.employeeId,
      vehicle:
        (session.vehicleId && getVehicle(session.vehicleId)?.name) ||
        session.vehicleId ||
        '—',
      hours: formatHours(workingMs(session)),
      km: kmOf(session),
      ended: session.endTime ?? session.updatedAt,
      sync: session.status === 'synced' || session.uploadStatus === 'synced' ? 'synced' : 'pending',
    }));

  return {
    reportType,
    period,
    titleKey: reportType === 'tours' ? 'reportsOps.types.tours' : 'reportsOps.types.hhco',
    columns: [
      { key: 'employee', labelKey: 'reportsOps.columns.employee' },
      { key: 'vehicle', labelKey: 'reportsOps.columns.vehicle' },
      { key: 'hours', labelKey: 'reportsOps.columns.hours' },
      { key: 'km', labelKey: 'reportsOps.columns.km' },
      { key: 'ended', labelKey: 'reportsOps.columns.ended' },
      { key: 'sync', labelKey: 'reportsOps.columns.sync' },
    ],
    rows,
    summary: baseSummary(sessions),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Build report tables from IndexedDB operations sessions (local-first).
 */
export async function buildReport(
  reportType: ReportType,
  period: ReportPeriod,
  now = new Date(),
): Promise<BuiltReport> {
  const moduleFilter =
    reportType === 'tours' ? ('saki_tours' as const) : reportType === 'hhco' ? ('hhco' as const) : undefined;

  const allFinished = await loadFinishedSessions(moduleFilter);
  const sessions = allFinished.filter((s) => inPeriod(s, period, now));

  if (reportType === 'daily' || reportType === 'monthly') {
    // Period reports always use matching period filter.
    const periodForced: ReportPeriod = reportType === 'daily' ? 'daily' : 'monthly';
    const scoped = allFinished.filter((s) => inPeriod(s, periodForced, now));
    return buildSummaryRows(scoped, periodForced);
  }

  if (reportType === 'employee') return buildEmployeeRows(sessions, period);
  if (reportType === 'vehicle') return buildVehicleRows(sessions, period);
  if (reportType === 'tours' || reportType === 'hhco') {
    return buildModuleRows(sessions, period, reportType);
  }

  return buildSummaryRows(sessions, period);
}

export const REPORT_TYPES: ReportType[] = [
  'daily',
  'monthly',
  'employee',
  'vehicle',
  'tours',
  'hhco',
];

export function isReportType(value: string | undefined): value is ReportType {
  return REPORT_TYPES.includes(value as ReportType);
}

export function isReportPeriod(value: string | null | undefined): value is ReportPeriod {
  return value === 'daily' || value === 'monthly';
}
