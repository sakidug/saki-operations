import type { AppEnvironment, BuildInfo, HealthBuildPayload } from './types.js';

export function normalizeEnvironment(value: string | undefined | null): AppEnvironment {
  const v = String(value || '')
    .trim()
    .toLowerCase();
  if (v === 'production' || v === 'prod') return 'production';
  if (v === 'staging' || v === 'stage' || v === 'preview') return 'staging';
  return 'development';
}

export function environmentLabel(env: AppEnvironment): string {
  if (env === 'production') return 'Production';
  if (env === 'staging') return 'Staging';
  return 'Development';
}

/** Local display e.g. "16 Jul 2026, 9:45 PM" */
export function formatBuiltAtLocal(iso: string, locale = 'en-GB'): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const day = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
  const time = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
  return `${day}, ${time}`;
}

/** UTC display e.g. "2026-07-16 21:45 UTC" */
export function formatBuiltAtUtc(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm} UTC`;
}

/** Long released date e.g. "16 July 2026" */
export function formatReleasedDate(iso: string, locale = 'en-GB'): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/** Plain-text block for clipboard / bug reports */
export function formatBuildInfoCopy(info: BuildInfo): string {
  return [
    info.name,
    `Version: ${info.version}`,
    `Build: ${info.build}`,
    `Environment: ${environmentLabel(info.environment)}`,
    `Platform: ${info.platform}`,
    `Built: ${formatBuiltAtUtc(info.builtAt)}`,
    `Sync Engine: v${info.syncEngine}`,
    `Company: ${info.company}`,
    `Support: ${info.supportContact}`,
  ].join('\n');
}

export function toHealthPayload(
  info: BuildInfo,
  extras?: {
    status?: 'ok' | 'degraded';
    database?: HealthBuildPayload['database'];
    apiStatus?: HealthBuildPayload['apiStatus'];
    serverTime?: string;
    uptimeSeconds?: number;
  },
): HealthBuildPayload {
  return {
    name: info.name,
    version: info.version,
    build: info.build,
    environment: info.environment,
    builtAt: info.builtAt,
    status: extras?.status ?? 'ok',
    syncEngine: info.syncEngine,
    database: extras?.database,
    apiStatus: extras?.apiStatus,
    serverTime: extras?.serverTime,
    uptimeSeconds: extras?.uptimeSeconds,
  };
}
