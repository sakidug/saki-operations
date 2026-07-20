import {
  getDefaultOperationsSessionEngine,
  type OperationsSession,
} from '@saki-operations/operations-session';

import { ACTIVE_OPERATION_STATUSES } from './session-display';

/**
 * Find the employee's active Tours operation (started | in_progress).
 * When `employeeId` is omitted, returns the newest active Tours session on this device.
 */
export async function findActiveToursSession(
  employeeId?: string | null,
): Promise<OperationsSession | null> {
  const engine = getDefaultOperationsSessionEngine();
  const unfinished = await engine.resumeUnfinished({
    moduleId: 'saki_tours',
    ...(employeeId ? { employeeId } : {}),
  });

  const active = unfinished.filter((session) =>
    (ACTIVE_OPERATION_STATUSES as readonly string[]).includes(session.status),
  );

  if (active.length === 0) return null;

  active.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  return active[0] ?? null;
}
