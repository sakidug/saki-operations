import type { OperationsSession } from '@saki-operations/operations-session';

import { getHistorySyncKind } from '../lib/history';

export function historySyncBadgeVariant(kind: ReturnType<typeof getHistorySyncKind>) {
  if (kind === 'synced') return 'success' as const;
  if (kind === 'failed') return 'danger' as const;
  if (kind === 'uploading') return 'info' as const;
  return 'warning' as const;
}

export function historySyncLabelKey(kind: ReturnType<typeof getHistorySyncKind>) {
  if (kind === 'synced') return 'toursOps.history.sync.synced';
  if (kind === 'uploading') return 'toursOps.history.sync.uploading';
  if (kind === 'failed') return 'toursOps.history.sync.failed';
  return 'toursOps.history.sync.waiting';
}

export function historySyncForSession(session: OperationsSession) {
  return getHistorySyncKind(session);
}
