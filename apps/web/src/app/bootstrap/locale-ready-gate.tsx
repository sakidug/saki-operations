import { useEffect, useState, type ReactNode } from 'react';
import { useLocale } from '@saki-operations/i18n';

import { LanguageInitLoadingScreen } from '@/app/screens/loading/loading-experience';

/**
 * Blocks the tree until i18n is ready so waiting never shows a blank screen.
 */
export function LocaleReadyGate({ children }: { children: ReactNode }) {
  const { ready } = useLocale();
  const [showGate, setShowGate] = useState(!ready);

  useEffect(() => {
    if (ready) {
      setShowGate(false);
      return;
    }
    setShowGate(true);
  }, [ready]);

  if (showGate || !ready) {
    return <LanguageInitLoadingScreen />;
  }

  return children;
}
