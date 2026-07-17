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

import { emitSyncEvent, emitSyncFile, operationEventType } from '@/modules/sync/emit';

/**
 * Final day: attach end odometer (if needed), mark day completed, complete session.
 * Total KM from start→end odometer; working hours = sum of daily hours.
 */
export async function commitMultiDayFinish(input: {
  sessionId: string;
  endOdometer: AcceptedOdometerReading | null;
  employeeId: string;
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

  if (input.endOdometer) {
    const odoFileId = await emitSyncFile({
      mimeType: input.endOdometer.photo.mimeType || 'image/jpeg',
      fileName: input.endOdometer.photo.fileName || 'end-odometer.jpg',
      blob: input.endOdometer.photo.blob,
    });
    await emitSyncEvent({
      entityType: 'odometer',
      entityId: session.id,
      eventType: 'odometer.confirmed',
      employeeId: input.employeeId,
      version: session.revision,
      payload: { slot: 'end', value: input.endOdometer.value, fileLocalId: odoFileId },
      fileLocalId: odoFileId,
    });
  }

  const moduleId = session.moduleId === 'hhco' ? 'hhco' : 'saki_tours';
  await emitSyncEvent({
    entityType: moduleId === 'hhco' ? 'delivery' : 'operation',
    entityId: session.id,
    eventType: operationEventType('completed', moduleId),
    employeeId: input.employeeId,
    version: session.revision,
    payload: {
      moduleId,
      multiDay: true,
      totalKm: session.totalKm,
      workingDurationMs: session.workingDurationMs,
    },
  });

  return session;
}
