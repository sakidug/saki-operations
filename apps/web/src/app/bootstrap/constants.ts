import { getBuildInfo, getAppVersion } from '@saki-operations/build-info';

/**
 * Application version — from root package.json via @saki-operations/build-info
 * (generated at build time). Never hardcode release numbers here.
 */
export const APP_VERSION: string = getAppVersion();

/** Full build identity for dashboard / About / error reports. */
export function getClientBuildInfo() {
  const env =
    (typeof import.meta !== 'undefined' &&
      (import.meta.env.VITE_APP_ENV as string | undefined)) ||
    (typeof import.meta !== 'undefined' && import.meta.env.MODE) ||
    undefined;
  return getBuildInfo({ environment: env });
}

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
