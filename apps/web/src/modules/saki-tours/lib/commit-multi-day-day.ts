import {
  getDefaultOperationsSessionEngine,
  type OperationsSession,
} from '@saki-operations/operations-session';

import type { TimeEvidenceCapture } from '../types';
import {
  computeDayWorkingMs,
  dayEvidenceType,
  getCurrentDayNumber,
  getMultiDayRecords,
  isFinalDay,
  patchDayInList,
  sumDailyWorkingHoursMs,
} from './multi-day';
import { isMultiDaySession } from './session-display';

/**
 * Capture today's start work time on a multi-day session (middle / final days).
 * Day 1 start is already stored during Start Operation.
 */
export async function commitMultiDayStartTime(input: {
  sessionId: string;
  capture: TimeEvidenceCapture;
}): Promise<OperationsSession> {
  const engine = getDefaultOperationsSessionEngine();
  let session = await engine.getSession(input.sessionId);
  if (!session) throw new Error('Session not found');
  if (!isMultiDaySession(session)) throw new Error('Not a multi-day session');

  const day = getCurrentDayNumber(session);
  const days = getMultiDayRecords(session);
  const record = days.find((item) => item.day === day);
  if (!record) throw new Error(`Day ${day} record missing`);
  if (record.startTime) throw new Error(`Day ${day} start time already captured`);
  if (day === 1) throw new Error('Day 1 start time is captured during Start Operation');

  const { session: nextSession, evidence } = await engine.addEvidence({
    sessionId: session.id,
    type: dayEvidenceType(day, 'start'),
    photoBlob: input.capture.photoBlob,
    mimeType: input.capture.mimeType,
    fileName: input.capture.fileName,
    timestamp: input.capture.capturedAt,
    metadata: { source: 'device_clock', editableByDriver: false, day, slot: 'start' },
  });
  session = nextSession;

  const updatedDays = patchDayInList(days, day, {
    startTime: input.capture.capturedAt,
    startEvidenceId: evidence.id,
    status: 'in_progress',
  });

  return engine.patchCustomFields(session.id, {
    days: updatedDays,
    currentDay: day,
  });
}

/**
 * Capture today's end work time. Completes the day when not final;
 * on final day leaves day open until end odometer + finish.
 */
export async function commitMultiDayEndTime(input: {
  sessionId: string;
  capture: TimeEvidenceCapture;
}): Promise<OperationsSession> {
  const engine = getDefaultOperationsSessionEngine();
  let session = await engine.getSession(input.sessionId);
  if (!session) throw new Error('Session not found');
  if (!isMultiDaySession(session)) throw new Error('Not a multi-day session');

  const day = getCurrentDayNumber(session);
  const days = getMultiDayRecords(session);
  const record = days.find((item) => item.day === day);
  if (!record?.startTime) throw new Error(`Day ${day} start time required first`);
  if (record.endTime) throw new Error(`Day ${day} end time already captured`);

  const workingDurationMs = computeDayWorkingMs(record.startTime, input.capture.capturedAt);

  const { session: nextSession, evidence } = await engine.addEvidence({
    sessionId: session.id,
    type: dayEvidenceType(day, 'end'),
    photoBlob: input.capture.photoBlob,
    mimeType: input.capture.mimeType,
    fileName: input.capture.fileName,
    timestamp: input.capture.capturedAt,
    metadata: { source: 'device_clock', editableByDriver: false, day, slot: 'end' },
  });
  session = nextSession;

  const final = isFinalDay(session, day);
  let updatedDays = patchDayInList(days, day, {
    endTime: input.capture.capturedAt,
    endEvidenceId: evidence.id,
    workingDurationMs,
    status: final ? 'in_progress' : 'completed',
  });

  let currentDay = day;
  if (!final) {
    currentDay = day + 1;
    updatedDays = patchDayInList(updatedDays, currentDay, { status: 'in_progress' });
  }

  const totalDailyWorkingMs = sumDailyWorkingHoursMs(updatedDays);

  session = await engine.patchCustomFields(session.id, {
    days: updatedDays,
    currentDay,
    totalDailyWorkingMs,
  });

  // Only stamp session.endTime on the final day — intermediate days must not
  // inflate workingDurationMs to an overnight wall-clock span.
  if (final) {
    session = await engine.setEndTime(session.id, input.capture.capturedAt);
  }

  return session;
}
