import { APP_VERSION } from '@/app/bootstrap/constants';

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
};

/**
 * Hook for future server-side / observability ingestion.
 * Keep this side-effect free until a backend endpoint is approved.
 */
export async function reportClientErrorRemote(_report: ClientErrorReport): Promise<void> {
  // Reserved for Sentry / API error ingestion. Intentionally a no-op for now.
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

  return {
    errorId: input.errorId,
    message: error.message || 'Unknown error',
    name: error.name,
    stack: error.stack,
    componentStack: input.componentStack ?? undefined,
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    timestamp: new Date().toISOString(),
    appVersion: APP_VERSION,
  };
}
