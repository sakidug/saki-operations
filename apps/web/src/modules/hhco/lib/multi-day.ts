import {
  calculateWorkingHours,
  type OperationsSession,
} from '@saki-operations/operations-session';

import { getSessionNumberOfDays, isMultiDaySession } from './session-display';

/** One day within a multi-day Tours operation (stored in customFields.days). */
export type MultiDayRecord = {
  day: number;
  startTime: string | null;
  endTime: string | null;
  startEvidenceId: string | null;
  endEvidenceId: string | null;
  /** Daily working hours when both start and end exist */
  workingDurationMs: number | null;
  status: 'pending' | 'in_progress' | 'completed';
};

export type DayTaskId =
  | 'start_work_time'
  | 'start_odometer'
  | 'end_work_time'
  | 'end_odometer'
  | 'finish';

export type DayTask = {
  id: DayTaskId;
  done: boolean;
};

export function createInitialMultiDayRecords(input: {
  numberOfDays: number;
  day1StartTime: string;
  day1StartEvidenceId: string | null;
}): MultiDayRecord[] {
  const { numberOfDays, day1StartTime, day1StartEvidenceId } = input;
  return Array.from({ length: numberOfDays }, (_, index) => {
    const day = index + 1;
    if (day === 1) {
      return {
        day: 1,
        startTime: day1StartTime,
        endTime: null,
        startEvidenceId: day1StartEvidenceId,
        endEvidenceId: null,
        workingDurationMs: null,
        status: 'in_progress' as const,
      };
    }
    return {
      day,
      startTime: null,
      endTime: null,
      startEvidenceId: null,
      endEvidenceId: null,
      workingDurationMs: null,
      status: 'pending' as const,
    };
  });
}

export function getMultiDayRecords(session: OperationsSession): MultiDayRecord[] {
  const raw = session.customFields.days;
  if (!Array.isArray(raw)) return [];
  return raw.filter(isMultiDayRecord);
}

function isMultiDayRecord(value: unknown): value is MultiDayRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as MultiDayRecord;
  return typeof record.day === 'number' && typeof record.status === 'string';
}

export function getCurrentDayNumber(session: OperationsSession): number {
  const days = getMultiDayRecords(session);
  const inProgress = days.find((d) => d.status === 'in_progress');
  if (inProgress) return inProgress.day;
  const pending = days.find((d) => d.status === 'pending');
  if (pending) return pending.day;

  const current = session.customFields.currentDay;
  if (typeof current === 'number' && current >= 1) {
    const record = days.find((d) => d.day === current);
    if (record && record.status !== 'completed') return current;
  }

  return getSessionNumberOfDays(session);
}

export function getCurrentDayRecord(session: OperationsSession): MultiDayRecord | null {
  const day = getCurrentDayNumber(session);
  return getMultiDayRecords(session).find((record) => record.day === day) ?? null;
}

export function isFinalDay(session: OperationsSession, day: number): boolean {
  return day === getSessionNumberOfDays(session);
}

/** Tasks required for a given day index (1-based). */
export function getRequiredTasksForDay(
  session: OperationsSession,
  day: number,
): DayTaskId[] {
  const total = getSessionNumberOfDays(session);
  if (day === 1) {
    return ['start_work_time', 'start_odometer', 'end_work_time'];
  }
  if (day === total) {
    return ['start_work_time', 'end_work_time', 'end_odometer', 'finish'];
  }
  return ['start_work_time', 'end_work_time'];
}

export function getDayTasks(session: OperationsSession, day: number): DayTask[] {
  const record = getMultiDayRecords(session).find((item) => item.day === day);
  const required = getRequiredTasksForDay(session, day);
  const hasEndOdometer = session.endOdometer != null;

  return required.map((id) => {
    switch (id) {
      case 'start_work_time':
        return { id, done: Boolean(record?.startTime) };
      case 'start_odometer':
        return { id, done: session.startOdometer != null };
      case 'end_work_time':
        return { id, done: Boolean(record?.endTime) };
      case 'end_odometer':
        return { id, done: hasEndOdometer };
      case 'finish':
        return {
          id,
          done: session.status === 'completed' || session.status === 'synced',
        };
      default:
        return { id, done: false };
    }
  });
}

/** Next incomplete task for the current day (or null if day is ready / finished). */
export function getNextDayTask(session: OperationsSession): DayTaskId | null {
  if (!isMultiDaySession(session)) return null;
  const day = getCurrentDayNumber(session);
  const tasks = getDayTasks(session, day);
  const next = tasks.find((task) => !task.done);
  return next?.id ?? null;
}

export function getMultiDayProgress(session: OperationsSession): {
  currentDay: number;
  totalDays: number;
  completedDays: number;
  percent: number;
} {
  const totalDays = getSessionNumberOfDays(session);
  const days = getMultiDayRecords(session);
  const completedDays = days.filter((d) => d.status === 'completed').length;
  const currentDay = getCurrentDayNumber(session);
  // Progress: completed full days + partial credit for current day tasks
  const tasks = getDayTasks(session, currentDay);
  const doneTasks = tasks.filter((t) => t.done && t.id !== 'finish').length;
  const actionable = tasks.filter((t) => t.id !== 'finish').length || 1;
  const partial = tasks.every((t) => t.done)
    ? 0
    : doneTasks / actionable / totalDays;
  const percent = Math.min(
    100,
    Math.round(((completedDays / totalDays) + partial) * 100),
  );
  return { currentDay, totalDays, completedDays, percent };
}

export function sumDailyWorkingHoursMs(days: MultiDayRecord[]): number {
  return days.reduce((sum, day) => sum + (day.workingDurationMs ?? 0), 0);
}

export function getMultiDayTotalWorkingMs(session: OperationsSession): number | null {
  const stored = session.customFields.totalDailyWorkingMs;
  if (typeof stored === 'number' && Number.isFinite(stored)) return stored;
  const days = getMultiDayRecords(session);
  if (days.length === 0) return session.workingDurationMs;
  const sum = sumDailyWorkingHoursMs(days);
  return sum > 0 ? sum : session.workingDurationMs;
}

export function computeDayWorkingMs(
  startTime: string,
  endTime: string,
): number {
  return calculateWorkingHours(startTime, endTime).durationMs;
}

export function patchDayInList(
  days: MultiDayRecord[],
  dayNumber: number,
  patch: Partial<MultiDayRecord>,
): MultiDayRecord[] {
  return days.map((day) => (day.day === dayNumber ? { ...day, ...patch } : day));
}

/** Evidence type id for a day's work-time capture (history prep). */
export function dayEvidenceType(
  day: number,
  slot: 'start' | 'end',
): string {
  return slot === 'start' ? `day_${day}_start_time` : `day_${day}_end_time`;
}
