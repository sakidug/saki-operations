import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { APP_VERSION, STORAGE_KEYS } from '@/app/bootstrap/constants';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type PwaContextValue = {
  appVersion: string;
  canInstall: boolean;
  installDismissed: boolean;
  updateAvailable: boolean;
  promptInstall: () => Promise<void>;
  dismissInstall: () => void;
  dismissUpdate: () => void;
};

const PwaContext = createContext<PwaContextValue | null>(null);

/**
 * PWA shell helpers — install prompt + version awareness.
 * Service workers are intentionally not registered in this phase.
 */
export function PwaProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installDismissed, setInstallDismissed] = useState(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEYS.pwaInstallDismissed) === 'true';
    } catch {
      return false;
    }
  });
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    try {
      const previous = window.localStorage.getItem(STORAGE_KEYS.lastKnownVersion);
      if (previous && previous !== APP_VERSION) {
        setUpdateAvailable(true);
      }
    } catch {
      // ignore
    }

    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const dismissInstall = useCallback(() => {
    setInstallDismissed(true);
    try {
      window.localStorage.setItem(STORAGE_KEYS.pwaInstallDismissed, 'true');
    } catch {
      // ignore
    }
  }, []);

  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
    try {
      window.localStorage.setItem(STORAGE_KEYS.lastKnownVersion, APP_VERSION);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(
    () => ({
      appVersion: APP_VERSION,
      canInstall: Boolean(deferredPrompt) && !installDismissed,
      installDismissed,
      updateAvailable,
      promptInstall,
      dismissInstall,
      dismissUpdate,
    }),
    [
      deferredPrompt,
      installDismissed,
      updateAvailable,
      promptInstall,
      dismissInstall,
      dismissUpdate,
    ],
  );

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}

export function usePwa() {
  const context = useContext(PwaContext);
  if (!context) {
    throw new Error('usePwa must be used within PwaProvider');
  }
  return context;
}
