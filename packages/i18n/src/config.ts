import i18n from 'i18next';
import { initReactI18next, setDefaults } from 'react-i18next';

import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  isAppLocale,
  type AppLocale,
} from './constants';
import enCommon from './locales/en/common.json';
import enUi from './locales/en/ui.json';
import siCommon from './locales/si/common.json';
import siUi from './locales/si/ui.json';

// Disable Suspense before any React render. react-i18next defaults to useSuspense: true.
// Splash/guards call useTranslation on first paint. Without a Suspense boundary, suspend
// prevents commit → I18nProvider effects never run → permanent empty #root.
setDefaults({ useSuspense: false });

const resources = {
  en: {
    common: enCommon,
    ui: enUi,
  },
  si: {
    common: siCommon,
    ui: siUi,
  },
} as const;

export function getInitialLocale(): AppLocale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored && isAppLocale(stored)) return stored;
  const browser = window.navigator.language.toLowerCase();
  if (browser.startsWith('si')) return 'si';
  return DEFAULT_LOCALE;
}

const initOptions = (lng: AppLocale) =>
  ({
    resources,
    lng,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: [...SUPPORTED_LOCALES],
    defaultNS: 'common',
    ns: ['common', 'ui'],
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
    react: {
      useSuspense: false,
    },
  }) as const;

let initialized = false;

/** Bundled resources allow a sync-ready init before React mounts. */
function bootI18n() {
  if (initialized || i18n.isInitialized) {
    initialized = true;
    return;
  }
  const lng = getInitialLocale();
  i18n.use(initReactI18next);
  // init is sync when resources are inlined (no backend) — keeps first paint callable via t().
  void i18n.init(initOptions(lng));
  initialized = true;
}

bootI18n();

export async function initI18n(locale?: AppLocale) {
  const lng = locale ?? getInitialLocale();

  if (!initialized || !i18n.isInitialized) {
    bootI18n();
  }

  if (i18n.language !== lng) {
    await i18n.changeLanguage(lng);
  }

  return i18n;
}

export function persistLocale(locale: AppLocale) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  document.documentElement.lang = locale;
}

export { i18n };
