export const APP_VERSION = '0.7.8';

export const STORAGE_KEYS = {
  languageSelected: 'saki-operations.language-selected',
  locale: 'saki-operations.locale',
  theme: 'saki-operations.theme',
  brand: 'saki-operations.brand',
  authSession: 'saki-operations.auth-session',
  pwaInstallDismissed: 'saki-operations.pwa-install-dismissed',
  lastKnownVersion: 'saki-operations.last-known-version',
} as const;

export const SPLASH_DURATION_MS = 2000;

export const BOOTSTRAP_STEPS = [
  'theme',
  'language',
  'session',
  'network',
  'version',
  'notifications',
] as const;

export type BootstrapStep = (typeof BOOTSTRAP_STEPS)[number];
