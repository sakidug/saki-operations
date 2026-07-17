import { GENERATED_BUILD_META } from './generated.js';
import {
  environmentLabel,
  formatBuildInfoCopy,
  formatBuiltAtLocal,
  formatBuiltAtUtc,
  formatReleasedDate,
  normalizeEnvironment,
  toHealthPayload,
} from './format.js';
import type { AppEnvironment, BuildInfo, HealthBuildPayload } from './types.js';

export type { AppEnvironment, BuildInfo, HealthBuildPayload };
export {
  environmentLabel,
  formatBuildInfoCopy,
  formatBuiltAtLocal,
  formatBuiltAtUtc,
  formatReleasedDate,
  normalizeEnvironment,
  toHealthPayload,
};
export { GENERATED_BUILD_META };

/**
 * Runtime build identity. Optional environment override (e.g. Nest NODE_ENV / APP_ENV)
 * without regenerating the artifact metadata.
 */
export function getBuildInfo(options?: { environment?: string }): BuildInfo {
  const environment = normalizeEnvironment(
    options?.environment ?? GENERATED_BUILD_META.environment,
  );
  return {
    name: GENERATED_BUILD_META.name,
    version: GENERATED_BUILD_META.version,
    build: GENERATED_BUILD_META.build,
    builtAt: GENERATED_BUILD_META.builtAt,
    environment,
    syncEngine: GENERATED_BUILD_META.syncEngine,
    company: GENERATED_BUILD_META.company,
    website: GENERATED_BUILD_META.website,
    copyrightYear: GENERATED_BUILD_META.copyrightYear,
    platform: GENERATED_BUILD_META.platform,
    supportContact: GENERATED_BUILD_META.supportContact,
    license: GENERATED_BUILD_META.license,
  };
}

/** Convenience — root package.json version for bootstrap / PWA. */
export function getAppVersion(): string {
  return GENERATED_BUILD_META.version;
}

export const TECHNOLOGY_STACK = [
  'React 19',
  'Vite',
  'NestJS',
  'PostgreSQL',
  'Prisma',
  'PWA',
] as const;
