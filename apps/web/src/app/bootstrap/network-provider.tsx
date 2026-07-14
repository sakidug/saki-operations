import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type NetworkStatus = 'online' | 'offline' | 'restored';

type NetworkContextValue = {
  isOnline: boolean;
  status: NetworkStatus;
  lastChangedAt: number | null;
};

const NetworkContext = createContext<NetworkContextValue | null>(null);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  const [status, setStatus] = useState<NetworkStatus>(
    typeof navigator === 'undefined' || navigator.onLine ? 'online' : 'offline',
  );
  const [lastChangedAt, setLastChangedAt] = useState<number | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setStatus('restored');
      setLastChangedAt(Date.now());
      window.setTimeout(() => setStatus('online'), 3200);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setStatus('offline');
      setLastChangedAt(Date.now());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const value = useMemo(
    () => ({ isOnline, status, lastChangedAt }),
    [isOnline, status, lastChangedAt],
  );

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within NetworkProvider');
  }
  return context;
}
