import { useCallback, useEffect, useState } from 'react';
import type { OperationsSession } from '@saki-operations/operations-session';

import { findActiveToursSession } from '../lib/find-active-session';

export function useActiveToursSession(employeeId: string | null | undefined) {
  const [session, setSession] = useState<OperationsSession | null>(null);
  const [loading, setLoading] = useState(Boolean(employeeId));

  const refresh = useCallback(async () => {
    if (!employeeId) {
      setSession(null);
      setLoading(false);
      return null;
    }
    setLoading(true);
    try {
      const active = await findActiveToursSession(employeeId);
      setSession(active);
      return active;
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { session, loading, refresh };
}
