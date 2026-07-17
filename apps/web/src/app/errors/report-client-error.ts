import {
  environmentLabel,
  formatBuiltAtUtc,
  getClientBuildInfo,
} from '@/app/bootstrap/build-report';
import { STORAGE_KEYS } from '@/app/bootstrap/constants';

export type ClientErrorReport = {
  errorId: string;
  message: string;
  name?: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  appVersion: string;
  build: string;
  environment: string;
  builtAt: string;
  browser: string;
  operatingSystem: string;
  deviceType: string;
  screenSize: string;
  currentRoute: string;
  userRole: string;
};

function parseUserAgent(ua: string): {
  browser: string;
  operatingSystem: string;
  deviceType: string;
} {
  let browser = 'Unknown';
  let operatingSystem = 'Unknown';

  if (/Edg\//.test(ua)) browser = 'Microsoft Edge';
  else if (/Chrome\//.test(ua)) browser = 'Chrome';
  else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) browser = 'Safari';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';

  if (/Windows NT/i.test(ua)) operatingSystem = 'Windows';
  else if (/Android/i.test(ua)) operatingSystem = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) operatingSystem = 'iOS';
  else if (/Mac OS X/i.test(ua)) operatingSystem = 'macOS';
  else if (/Linux/i.test(ua)) operatingSystem = 'Linux';

  const deviceType = /Mobi|Android|iPhone|iPad/i.test(ua) ? 'Mobile / Tablet' : 'Desktop';
  return { browser, operatingSystem, deviceType };
}

function readStoredUserRole(): string {
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEYS.authSession) ||
      window.sessionStorage.getItem(STORAGE_KEYS.authSession);
    if (!raw) return 'Unknown';
    const parsed = JSON.parse(raw) as { user?: { role?: unknown } };
    return typeof parsed.user?.role === 'string' ? parsed.user.role : 'Unknown';
  } catch {
    return 'Unknown';
  }
}

/**
 * Hook for future server-side / observability ingestion.
 * Keep this side-effect free until a backend endpoint is approved.
 */
export async function reportClientErrorRemote(_report: ClientErrorReport): Promise<void> {
  return;
}

/**
 * Log unexpected client errors and forward to the remote reporting hook.
 */
export function reportClientError(report: ClientErrorReport): void {
  console.error('[Saki Operations] Unexpected rendering error', {
    errorId: report.errorId,
    message: report.message,
    name: report.name,
    stack: report.stack,
    componentStack: report.componentStack,
    url: report.url,
    appVersion: report.appVersion,
    build: report.build,
    environment: report.environment,
    builtAt: report.builtAt,
    browser: report.browser,
    operatingSystem: report.operatingSystem,
    deviceType: report.deviceType,
    screenSize: report.screenSize,
    currentRoute: report.currentRoute,
    userRole: report.userRole,
    timestamp: report.timestamp,
  });

  void reportClientErrorRemote(report).catch((cause) => {
    console.warn('[Saki Operations] Remote error report failed', cause);
  });
}

export function buildClientErrorReport(input: {
  errorId: string;
  error: unknown;
  componentStack?: string | null;
}): ClientErrorReport {
  const error = input.error instanceof Error ? input.error : new Error(String(input.error));
  const info = getClientBuildInfo();
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const { browser, operatingSystem, deviceType } = parseUserAgent(ua);

  return {
    errorId: input.errorId,
    message: error.message || 'Unknown error',
    name: error.name,
    stack: error.stack,
    componentStack: input.componentStack ?? undefined,
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: ua,
    timestamp: new Date().toISOString(),
    appVersion: info.version,
    build: info.build,
    environment: environmentLabel(info.environment),
    builtAt: formatBuiltAtUtc(info.builtAt),
    browser,
    operatingSystem,
    deviceType,
    screenSize:
      typeof window !== 'undefined'
        ? `${window.screen.width}x${window.screen.height} @ ${window.devicePixelRatio}x`
        : '',
    currentRoute: typeof window !== 'undefined' ? window.location.pathname : '',
    userRole: typeof window !== 'undefined' ? readStoredUserRole() : 'Unknown',
  };
}
