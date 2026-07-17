import {
  BUILTIN_EVIDENCE_TYPES,
  getDefaultOperationsSessionEngine,
  type OperationsSession,
} from '@saki-operations/operations-session';

import { emitSyncEvent, emitSyncFile, operationEventType } from '@/modules/sync/emit';

import type { EndOperationDraft } from '../types';

/**
 * Attach end evidence, complete the delivery, enqueue Saki Sync events.
 * Session stays completed until server acks `delivery.completed`.
 */
export async function commitEndOperation(input: {
  sessionId: string;
  draft: EndOperationDraft;
  employeeId: string;
}): Promise<OperationsSession> {
  const { sessionId, draft, employeeId } = input;

  if (!draft.endOdometer || !draft.endTime || draft.deliveryPhotos.length === 0) {
    throw new Error('End Operation draft is incomplete');
  }

  const engine = getDefaultOperationsSessionEngine();

  const attached = await engine.attachOdometerReading({
    sessionId,
    slot: 'end',
    reading: draft.endOdometer,
  });
  let session = attached.session;

  const withTimeEvidence = await engine.addEvidence({
    sessionId: session.id,
    type: BUILTIN_EVIDENCE_TYPES.endTime,
    photoBlob: draft.endTime.photoBlob,
    mimeType: draft.endTime.mimeType,
    fileName: draft.endTime.fileName,
    timestamp: draft.endTime.capturedAt,
    metadata: { source: 'device_clock', editableByDriver: false },
  });
  session = withTimeEvidence.session;

  for (const photo of draft.deliveryPhotos) {
    const withDeliveryPhoto = await engine.addEvidence({
      sessionId: session.id,
      type: 'delivery_photo',
      photoBlob: photo.photoBlob,
      mimeType: photo.mimeType,
      fileName: photo.fileName,
      timestamp: photo.capturedAt,
      metadata: { slot: 'delivery' },
    });
    session = withDeliveryPhoto.session;

    const fileLocalId = await emitSyncFile({
      mimeType: photo.mimeType,
      fileName: photo.fileName,
      blob: photo.photoBlob,
    });
    await emitSyncEvent({
      entityType: 'evidence',
      entityId: session.id,
      eventType: 'photo.added',
      employeeId: employeeId,
      version: session.revision,
      payload: { kind: 'delivery_photo', fileLocalId },
      fileLocalId,
    });
  }

  session = await engine.setEndTime(session.id, draft.endTime.capturedAt);
  session = await engine.complete(session.id, draft.endTime.capturedAt);

  const odoFileId = await emitSyncFile({
    mimeType: draft.endOdometer.photo.mimeType || 'image/jpeg',
    fileName: draft.endOdometer.photo.fileName || 'end-odometer.jpg',
    blob: draft.endOdometer.photo.blob,
  });
  await emitSyncEvent({
    entityType: 'odometer',
    entityId: session.id,
    eventType: 'odometer.confirmed',
    employeeId: employeeId,
    version: session.revision,
    payload: {
      slot: 'end',
      value: draft.endOdometer.value,
      source: draft.endOdometer.source,
      fileLocalId: odoFileId,
    },
    fileLocalId: odoFileId,
  });
  await emitSyncEvent({
    entityType: 'delivery',
    entityId: session.id,
    eventType: operationEventType('completed', 'hhco'),
    employeeId: employeeId,
    version: session.revision,
    payload: {
      moduleId: 'hhco',
      endTime: draft.endTime.capturedAt,
      totalKm: session.totalKm,
      workingDurationMs: session.workingDurationMs,
    },
  });

  return session;
}
