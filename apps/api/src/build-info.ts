import {
  getBuildInfo,
  toHealthPayload,
  type BuildInfo,
  type HealthBuildPayload,
} from '@saki-operations/build-info';

/**
 * Frozen at process start from generated build meta + runtime APP_ENV/NODE_ENV.
 * Regenerated on each `nest build` / `dev` via scripts/generate-build-meta.mjs.
 */
export const BUILD_INFO: BuildInfo = getBuildInfo({
  environment: process.env.APP_ENV || process.env.NODE_ENV,
});

/** @deprecated Prefer BUILD_INFO.version */
export const APP_VERSION = BUILD_INFO.version;

export function getHealthBuildPayload(extras?: {
  status?: 'ok' | 'degraded';
  database?: HealthBuildPayload['database'];
  apiStatus?: HealthBuildPayload['apiStatus'];
  serverTime?: string;
  uptimeSeconds?: number;
}): HealthBuildPayload {
  return toHealthPayload(BUILD_INFO, extras);
}
