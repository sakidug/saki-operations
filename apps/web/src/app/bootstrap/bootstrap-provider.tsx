import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  markLanguageSelected as persistLanguageSelected,
  runBootstrap,
  type BootstrapSnapshot,
} from '@/app/bootstrap/bootstrap';
import { APP_VERSION, SPLASH_DURATION_MS } from '@/app/bootstrap/constants';

export type BootstrapStatus = 'idle' | 'booting' | 'ready' | 'error';

type BootstrapContextValue = {
  status: BootstrapStatus;
  snapshot: BootstrapSnapshot | null;
  error: Error | null;
  appVersion: string;
  splashComplete: boolean;
  retry: () => void;
  /** Persist language gate and keep bootstrap snapshot in sync (avoids login↔language redirect loop). */
  acknowledgeLanguageSelected: () => void;
};

const BootstrapContext = createContext<BootstrapContextValue | null>(null);

export function BootstrapProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<BootstrapStatus>('idle');
  const [snapshot, setSnapshot] = useState<BootstrapSnapshot | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [splashComplete, setSplashComplete] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const startedAt = performance.now();

    async function boot() {
      setStatus('booting');
      setError(null);
      try {
        const result = await runBootstrap();
        if (cancelled) return;
        setSnapshot(result);
        setStatus('ready');

        const elapsed = performance.now() - startedAt;
        const remaining = Math.max(0, SPLASH_DURATION_MS - elapsed);
        window.setTimeout(() => {
          if (!cancelled) setSplashComplete(true);
        }, remaining);
      } catch (cause) {
        if (cancelled) return;
        setError(cause instanceof Error ? cause : new Error('Bootstrap failed'));
        setStatus('error');
        setSplashComplete(true);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setSplashComplete(false);
    setAttempt((value) => value + 1);
  }, []);

  const acknowledgeLanguageSelected = useCallback(() => {
    persistLanguageSelected();
    setSnapshot((previous) =>
      previous ? { ...previous, languageSelected: true, languageReady: true } : previous,
    );
  }, []);

  const value = useMemo(
    () => ({
      status,
      snapshot,
      error,
      appVersion: APP_VERSION,
      splashComplete,
      retry,
      acknowledgeLanguageSelected,
    }),
    [status, snapshot, error, splashComplete, retry, acknowledgeLanguageSelected],
  );

  return <BootstrapContext.Provider value={value}>{children}</BootstrapContext.Provider>;
}

export function useBootstrap() {
  const context = useContext(BootstrapContext);
  if (!context) {
    throw new Error('useBootstrap must be used within BootstrapProvider');
  }
  return context;
}
