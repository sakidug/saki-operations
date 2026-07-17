import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

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
  applyUpdate: () => void;
};

const PwaContext = createContext<PwaContextValue | null>(null);

/**
 * PWA shell — service worker registration, install prompt, update detection (Phase 9.1 / H-05).
 * Operational background sync (Saki Sync) remains Phase 9.2.
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
  const [versionBump, setVersionBump] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      // Periodic update checks while the app is open.
      window.setInterval(() => {
        void registration.update();
      }, 60 * 60 * 1000);
    },
  });

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    try {
      const previous = window.localStorage.getItem(STORAGE_KEYS.lastKnownVersion);
      if (previous && previous !== APP_VERSION) {
        setVersionBump(true);
      }
      window.localStorage.setItem(STORAGE_KEYS.lastKnownVersion, APP_VERSION);
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
    setNeedRefresh(false);
    setVersionBump(false);
  }, [setNeedRefresh]);

  const applyUpdate = useCallback(() => {
    void updateServiceWorker(true);
  }, [updateServiceWorker]);

  const value = useMemo(
    () => ({
      appVersion: APP_VERSION,
      canInstall: Boolean(deferredPrompt) && !installDismissed,
      installDismissed,
      updateAvailable: needRefresh || versionBump,
      promptInstall,
      dismissInstall,
      dismissUpdate,
      applyUpdate,
    }),
    [
      deferredPrompt,
      installDismissed,
      needRefresh,
      versionBump,
      promptInstall,
      dismissInstall,
      dismissUpdate,
      applyUpdate,
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
