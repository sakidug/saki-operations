import {
  getDefaultOperationsSessionEngine,
  type OperationsSession,
} from '@saki-operations/operations-session';

import {
  buildHhcoDeliveryPath,
  buildSakiToursOperationPath,
} from '@/app/router/paths';

const ACTIVE_STATUSES = new Set(['started', 'in_progress']);

/**
 * Device-wide active operation (any module / employee).
 * Used by the guest entry screen when no JWT identity exists.
 */
export async function findAnyActiveOperation(): Promise<OperationsSession | null> {
  const engine = getDefaultOperationsSessionEngine();
  const unfinished = await engine.resumeUnfinished();
  const active = unfinished.filter((session) => ACTIVE_STATUSES.has(session.status));

  if (active.length === 0) return null;

  active.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  return active[0] ?? null;
}

export function buildActiveOperationContinuePath(session: OperationsSession): string {
  if (session.moduleId === 'hhco') {
    return buildHhcoDeliveryPath(session.id);
  }
  return buildSakiToursOperationPath(session.id);
}
