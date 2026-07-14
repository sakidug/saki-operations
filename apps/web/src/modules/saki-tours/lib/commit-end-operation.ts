import {
  BUILTIN_EVIDENCE_TYPES,
  getDefaultOperationsSessionEngine,
  type OperationsSession,
} from '@saki-operations/operations-session';

import type { EndOperationDraft } from '../types';

/**
 * Attach end evidence, complete the session, and prepare sync.
 * Offline: status completed + upload queued.
 * Online: markSynced (immediate sync preparation until Sync phase drains the queue).
 */
export async function commitEndOperation(input: {
  sessionId: string;
  draft: EndOperationDraft;
  isOnline: boolean;
}): Promise<OperationsSession> {
  const { sessionId, draft, isOnline } = input;

  if (!draft.endOdometer || !draft.endTime) {
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

  session = await engine.setEndTime(session.id, draft.endTime.capturedAt);
  session = await engine.complete(session.id, draft.endTime.capturedAt);

  if (isOnline) {
    session = await engine.markSynced(session.id);
  }

  return session;
}
