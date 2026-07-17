import type { OperationsSession } from '@saki-operations/operations-session';

import { getHistorySyncKind } from '../lib/history';

export function historySyncBadgeVariant(kind: ReturnType<typeof getHistorySyncKind>) {
  if (kind === 'synced') return 'success' as const;
  if (kind === 'failed') return 'danger' as const;
  if (kind === 'uploading') return 'info' as const;
  return 'warning' as const;
}

export function historySyncLabelKey(kind: ReturnType<typeof getHistorySyncKind>) {
  if (kind === 'synced') return 'hhcoOps.history.sync.synced';
  if (kind === 'uploading') return 'hhcoOps.history.sync.uploading';
  if (kind === 'failed') return 'hhcoOps.history.sync.failed';
  return 'hhcoOps.history.sync.waiting';
}

export function historySyncForSession(session: OperationsSession) {
  return getHistorySyncKind(session);
}
