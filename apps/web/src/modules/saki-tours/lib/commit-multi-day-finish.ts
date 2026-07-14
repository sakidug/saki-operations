import {
  getDefaultOperationsSessionEngine,
  type OperationsSession,
} from '@saki-operations/operations-session';
import type { AcceptedOdometerReading } from '@saki-operations/ocr';

import {
  getCurrentDayNumber,
  getMultiDayRecords,
  isFinalDay,
  patchDayInList,
  sumDailyWorkingHoursMs,
} from './multi-day';
import { isMultiDaySession } from './session-display';

/**
 * Final day: attach end odometer (if needed), mark day completed, complete session.
 * Total KM from start→end odometer; working hours = sum of daily hours.
 */
export async function commitMultiDayFinish(input: {
  sessionId: string;
  endOdometer: AcceptedOdometerReading | null;
  isOnline: boolean;
}): Promise<OperationsSession> {
  const engine = getDefaultOperationsSessionEngine();
  let session = await engine.getSession(input.sessionId);
  if (!session) throw new Error('Session not found');
  if (!isMultiDaySession(session)) throw new Error('Not a multi-day session');

  const day = getCurrentDayNumber(session);
  if (!isFinalDay(session, day)) {
    throw new Error('End odometer / finish is only allowed on the final day');
  }

  const days = getMultiDayRecords(session);
  const record = days.find((item) => item.day === day);
  if (!record?.startTime || !record.endTime) {
    throw new Error('Final day start and end work times are required first');
  }

  if (session.endOdometer == null) {
    if (!input.endOdometer) {
      throw new Error('End odometer is required');
    }
    const attached = await engine.attachOdometerReading({
      sessionId: session.id,
      slot: 'end',
      reading: input.endOdometer,
    });
    session = attached.session;
  }

  const updatedDays = patchDayInList(days, day, { status: 'completed' });
  const totalDailyWorkingMs = sumDailyWorkingHoursMs(updatedDays);

  session = await engine.patchCustomFields(session.id, {
    days: updatedDays,
    currentDay: day,
    totalDailyWorkingMs,
  });

  session = await engine.complete(session.id, record.endTime);
  session = await engine.setWorkingDurationMs(session.id, totalDailyWorkingMs);
  session = await engine.patchCustomFields(session.id, {
    days: updatedDays,
    totalDailyWorkingMs,
  });

  if (input.isOnline) {
    session = await engine.markSynced(session.id);
  }

  return session;
}
