import type {
  OperationsSession,
  SessionEvidenceItem,
  UploadStatus,
} from '@saki-operations/operations-session';
import { getDefaultOperationsSessionEngine } from '@saki-operations/operations-session';

import {
  getMultiDayRecords,
  getMultiDayTotalWorkingMs,
} from './multi-day';
import {
  getSessionHireTypeKey,
  getSessionNumberOfDays,
  getSessionVehicleLabel,
  getSessionVehicleName,
  isMultiDaySession,
} from './session-display';

export type HistorySyncFilter = 'all' | UploadStatus | 'waiting';

export type HistoryFilters = {
  query: string;
  month: number | 'all'; // 1–12 or all
  year: number | 'all';
  sync: HistorySyncFilter;
};

export type MonthStats = {
  operations: number;
  workingDurationMs: number;
  totalKm: number;
};

/** Completed + synced Tours sessions for an employee (offline IndexedDB). */
export async function listPreviousToursOperations(
  employeeId: string,
): Promise<OperationsSession[]> {
  const engine = getDefaultOperationsSessionEngine();
  const [completed, synced] = await Promise.all([
    engine.listSessions({
      moduleId: 'saki_tours',
      employeeId,
      status: 'completed',
    }),
    engine.listSessions({
      moduleId: 'saki_tours',
      employeeId,
      status: 'synced',
    }),
  ]);

  const byId = new Map<string, OperationsSession>();
  for (const session of [...completed, ...synced]) {
    byId.set(session.id, session);
  }

  return [...byId.values()].sort((a, b) => {
    const aTime = Date.parse(a.endTime ?? a.startTime ?? a.updatedAt);
    const bTime = Date.parse(b.endTime ?? b.startTime ?? b.updatedAt);
    return bTime - aTime;
  });
}

export function getSessionWorkingMs(session: OperationsSession): number | null {
  if (isMultiDaySession(session)) {
    return getMultiDayTotalWorkingMs(session);
  }
  return session.workingDurationMs;
}

export function getHistorySyncKind(
  session: OperationsSession,
): 'synced' | 'pending' | 'uploading' | 'failed' {
  if (session.status === 'synced' || session.uploadStatus === 'synced') return 'synced';
  if (session.uploadStatus === 'uploading') return 'uploading';
  if (session.uploadStatus === 'failed') return 'failed';
  return 'pending';
}

export function matchesHistorySearch(
  session: OperationsSession,
  query: string,
  tHire: (key: string) => string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const vehicle = getSessionVehicleLabel(session).toLowerCase();
  const vehicleName = getSessionVehicleName(session).toLowerCase();
  const hire = tHire(getSessionHireTypeKey(session)).toLowerCase();
  const hireRaw =
    typeof session.customFields.hireType === 'string'
      ? session.customFields.hireType.toLowerCase()
      : '';

  return (
    vehicle.includes(q) ||
    vehicleName.includes(q) ||
    hire.includes(q) ||
    hireRaw.includes(q)
  );
}

export function matchesHistoryFilters(
  session: OperationsSession,
  filters: HistoryFilters,
  tHire: (key: string) => string,
): boolean {
  if (!matchesHistorySearch(session, filters.query, tHire)) return false;

  const anchor = new Date(session.endTime ?? session.startTime ?? session.createdAt);
  if (Number.isNaN(anchor.getTime())) return false;

  if (filters.year !== 'all' && anchor.getFullYear() !== filters.year) return false;
  if (filters.month !== 'all' && anchor.getMonth() + 1 !== filters.month) return false;

  const sync = getHistorySyncKind(session);
  if (filters.sync === 'all') return true;
  if (filters.sync === 'waiting') return sync === 'pending';
  if (filters.sync === 'synced') return sync === 'synced';
  if (filters.sync === 'uploading') return sync === 'uploading';
  if (filters.sync === 'failed') return sync === 'failed';
  if (filters.sync === 'pending') return sync === 'pending';
  return true;
}

export function computeMonthStats(
  sessions: OperationsSession[],
  now = new Date(),
): MonthStats {
  const year = now.getFullYear();
  const month = now.getMonth();

  let operations = 0;
  let workingDurationMs = 0;
  let totalKm = 0;

  for (const session of sessions) {
    const anchor = new Date(session.endTime ?? session.startTime ?? session.createdAt);
    if (Number.isNaN(anchor.getTime())) continue;
    if (anchor.getFullYear() !== year || anchor.getMonth() !== month) continue;

    operations += 1;
    workingDurationMs += getSessionWorkingMs(session) ?? 0;
    totalKm += session.totalKm ?? 0;
  }

  return { operations, workingDurationMs, totalKm };
}

export function formatCompactHours(durationMs: number): string {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return '0h';
  const hours = Math.floor(durationMs / 3_600_000);
  const minutes = Math.floor((durationMs % 3_600_000) / 60_000);
  if (hours > 0 && minutes === 0) return `${hours}h`;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export function formatHistoryDateRange(
  session: OperationsSession,
  locale: string,
): string {
  const start = session.startTime ? new Date(session.startTime) : null;
  const end = session.endTime ? new Date(session.endTime) : null;
  const multi = isMultiDaySession(session);

  if (!start || Number.isNaN(start.getTime())) return '—';

  if (!multi || !end || Number.isNaN(end.getTime())) {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(start);
  }

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  if (sameDay) {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(start);
  }

  const startLabel = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
  }).format(start);
  const endLabel = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: start.getFullYear() === end.getFullYear() ? undefined : 'numeric',
  }).format(end);

  return `${startLabel} – ${endLabel}`;
}

export type TimelineEvent = {
  id: string;
  kind:
    | 'started'
    | 'start_odometer'
    | 'day'
    | 'end_odometer'
    | 'completed';
  titleKey: string;
  timestamp: string | null;
  subtitle?: string | null;
  day?: number;
  startTime?: string | null;
  endTime?: string | null;
  showEndOdometer?: boolean;
};

export function buildOperationTimeline(session: OperationsSession): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      id: 'started',
      kind: 'started',
      titleKey: 'toursOps.history.timeline.started',
      timestamp: session.startTime,
    },
  ];

  if (session.startOdometer != null) {
    events.push({
      id: 'start_odometer',
      kind: 'start_odometer',
      titleKey: 'toursOps.history.timeline.startOdometer',
      timestamp: session.startTime,
      subtitle: String(session.startOdometer),
    });
  }

  if (isMultiDaySession(session)) {
    const days = getMultiDayRecords(session);
    const total = getSessionNumberOfDays(session);
    for (const day of days) {
      events.push({
        id: `day_${day.day}`,
        kind: 'day',
        titleKey: 'toursOps.history.timeline.day',
        timestamp: day.startTime ?? day.endTime,
        day: day.day,
        startTime: day.startTime,
        endTime: day.endTime,
        showEndOdometer: day.day === total && session.endOdometer != null,
      });
    }
  }

  if (session.endOdometer != null && !isMultiDaySession(session)) {
    events.push({
      id: 'end_odometer',
      kind: 'end_odometer',
      titleKey: 'toursOps.history.timeline.endOdometer',
      timestamp: session.endTime,
      subtitle: String(session.endOdometer),
    });
  }

  if (isMultiDaySession(session) && session.endOdometer != null) {
    // End odometer already noted on final day card; still add terminal marker when no day records.
    const days = getMultiDayRecords(session);
    if (days.length === 0) {
      events.push({
        id: 'end_odometer',
        kind: 'end_odometer',
        titleKey: 'toursOps.history.timeline.endOdometer',
        timestamp: session.endTime,
        subtitle: String(session.endOdometer),
      });
    }
  }

  events.push({
    id: 'completed',
    kind: 'completed',
    titleKey: 'toursOps.history.timeline.completed',
    timestamp: session.endTime ?? session.updatedAt,
  });

  return events;
}

export type EvidenceGalleryItem = {
  id: string;
  type: string;
  labelKey: string;
  /** Day number for multi-day evidence labels (`day_N_*`). */
  day?: number;
  photoDataUrl: string;
  timestamp: string;
};

export function evidenceDayNumber(type: string): number | undefined {
  const match = /^day_(\d+)_(?:start|end)_time$/.exec(type);
  if (!match) return undefined;
  const day = Number(match[1]);
  return Number.isFinite(day) && day > 0 ? day : undefined;
}

export function evidenceLabelKey(type: string): string {
  if (type === 'start_odometer') return 'toursOps.history.photos.startOdometer';
  if (type === 'end_odometer') return 'toursOps.history.photos.endOdometer';
  if (type === 'start_time') return 'toursOps.history.photos.startTime';
  if (type === 'end_time') return 'toursOps.history.photos.endTime';
  if (/^day_\d+_start_time$/.test(type)) return 'toursOps.history.photos.dayStartTime';
  if (/^day_\d+_end_time$/.test(type)) return 'toursOps.history.photos.dayEndTime';
  return 'toursOps.history.photos.generic';
}

export function toEvidenceGallery(
  evidence: SessionEvidenceItem[],
): EvidenceGalleryItem[] {
  return evidence
    .filter((item) => Boolean(item.photoDataUrl))
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))
    .map((item) => {
      const type = String(item.type);
      return {
        id: item.id,
        type,
        labelKey: evidenceLabelKey(type),
        day: evidenceDayNumber(type),
        photoDataUrl: item.photoDataUrl as string,
        timestamp: item.timestamp,
      };
    });
}

export function availableFilterYears(sessions: OperationsSession[]): number[] {
  const years = new Set<number>();
  for (const session of sessions) {
    const d = new Date(session.endTime ?? session.startTime ?? session.createdAt);
    if (!Number.isNaN(d.getTime())) years.add(d.getFullYear());
  }
  const nowYear = new Date().getFullYear();
  years.add(nowYear);
  return [...years].sort((a, b) => b - a);
}
