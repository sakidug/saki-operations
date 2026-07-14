import { STORAGE_KEYS, APP_VERSION, type BootstrapStep } from './constants';

export type BootstrapSnapshot = {
  themeReady: boolean;
  languageReady: boolean;
  languageSelected: boolean;
  sessionChecked: boolean;
  hasSession: boolean;
  networkReady: boolean;
  isOnline: boolean;
  versionReady: boolean;
  appVersion: string;
  versionChanged: boolean;
  notificationsReady: boolean;
  completedSteps: BootstrapStep[];
};

function readHasSession(): boolean {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.authSession);
    return Boolean(raw);
  } catch {
    return false;
  }
}

function readLanguageSelected(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEYS.languageSelected) === 'true';
  } catch {
    return false;
  }
}

function detectVersionChange(): boolean {
  try {
    const previous = window.localStorage.getItem(STORAGE_KEYS.lastKnownVersion);
    if (!previous) {
      return false;
    }
    return previous !== APP_VERSION;
  } catch {
    return false;
  }
}

/**
 * Application lifecycle bootstrap — prepares shell concerns only.
 * No business logic, API calls, or domain data.
 */
export async function runBootstrap(): Promise<BootstrapSnapshot> {
  const completedSteps: BootstrapStep[] = [];

  // Theme — ThemeProvider already applied; mark ready.
  completedSteps.push('theme');
  await pause(120);

  // Language — locale persistence handled by i18n package.
  const languageSelected = readLanguageSelected();
  completedSteps.push('language');
  await pause(120);

  // Authentication session — inspect reserved storage key only.
  const hasSession = readHasSession();
  completedSteps.push('session');
  await pause(120);

  // Network / offline status
  const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine;
  completedSteps.push('network');
  await pause(120);

  // Application version
  const versionChanged = detectVersionChange();
  completedSteps.push('version');
  await pause(120);

  // Future notifications channel — reserved readiness flag only.
  completedSteps.push('notifications');
  await pause(120);

  return {
    themeReady: true,
    languageReady: true,
    languageSelected,
    sessionChecked: true,
    hasSession,
    networkReady: true,
    isOnline,
    versionReady: true,
    appVersion: APP_VERSION,
    versionChanged,
    notificationsReady: true,
    completedSteps,
  };
}

function pause(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function markLanguageSelected() {
  window.localStorage.setItem(STORAGE_KEYS.languageSelected, 'true');
}

export function clearLanguageSelected() {
  window.localStorage.removeItem(STORAGE_KEYS.languageSelected);
}
