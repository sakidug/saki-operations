import {
  getDefaultOperationsSessionEngine,
  type OperationsSession,
} from '@saki-operations/operations-session';

import { ACTIVE_OPERATION_STATUSES } from './session-display';

/**
 * Find the employee's active HHCO delivery (started | in_progress).
 * When `employeeId` is omitted, returns the newest active HHCO session on this device.
 */
export async function findActiveHhcoSession(
  employeeId?: string | null,
): Promise<OperationsSession | null> {
  const engine = getDefaultOperationsSessionEngine();
  const unfinished = await engine.resumeUnfinished({
    moduleId: 'hhco',
    ...(employeeId ? { employeeId } : {}),
  });

  const active = unfinished.filter((session) =>
    (ACTIVE_OPERATION_STATUSES as readonly string[]).includes(session.status),
  );

  if (active.length === 0) return null;

  active.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  return active[0] ?? null;
}
