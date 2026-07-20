import { useCallback, useEffect, useState } from 'react';
import type { OperationsSession } from '@saki-operations/operations-session';

import { findAnyActiveOperation } from './find-active-operation';

/** Loads the newest device-wide active operation for the guest entry screen. */
export function useAnyActiveOperation() {
  const [session, setSession] = useState<OperationsSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const active = await findAnyActiveOperation();
      setSession(active);
      return active;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { session, loading, refresh };
}
