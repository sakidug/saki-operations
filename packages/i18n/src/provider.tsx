import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';

import {
  DEFAULT_LOCALE,
  LOCALE_META,
  SUPPORTED_LOCALES,
  type AppLocale,
} from './constants';
import { i18n, initI18n, persistLocale } from './config';

type I18nContextValue = {
  locale: AppLocale;
  locales: typeof SUPPORTED_LOCALES;
  setLocale: (locale: AppLocale) => Promise<void>;
  ready: boolean;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export type I18nProviderProps = {
  children: ReactNode;
  defaultLocale?: AppLocale;
};

export function I18nProvider({ children, defaultLocale = DEFAULT_LOCALE }: I18nProviderProps) {
  const [ready, setReady] = useState(i18n.isInitialized);
  const [locale, setLocaleState] = useState<AppLocale>(defaultLocale);

  useEffect(() => {
    void initI18n(defaultLocale).then((instance) => {
      const next = (instance.language?.split('-')[0] as AppLocale) || defaultLocale;
      setLocaleState(next);
      persistLocale(next);
      setReady(true);
    });
  }, [defaultLocale]);

  const setLocale = useCallback(async (next: AppLocale) => {
    await i18n.changeLanguage(next);
    persistLocale(next);
    setLocaleState(next);
  }, []);

  const value = useMemo(
    () => ({
      locale,
      locales: SUPPORTED_LOCALES,
      setLocale,
      ready,
    }),
    [locale, setLocale, ready],
  );

  return (
    <I18nextProvider i18n={i18n}>
      <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
    </I18nextProvider>
  );
}

export function useLocale() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useLocale must be used within I18nProvider');
  }
  return context;
}

export function useAppTranslation(namespace?: string | string[]) {
  return useTranslation(namespace);
}

export { LOCALE_META, SUPPORTED_LOCALES, DEFAULT_LOCALE };
export type { AppLocale };
