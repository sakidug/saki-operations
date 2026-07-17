export type AppEnvironment = 'development' | 'staging' | 'production';

/** Immutable build identity shared by Web and API. */
export type BuildInfo = {
  name: string;
  version: string;
  /** Short git SHA (7 chars) or CI commit abbrev */
  build: string;
  /** ISO-8601 UTC timestamp when this build artifact was produced */
  builtAt: string;
  environment: AppEnvironment;
  /** Saki Sync engine contract major version */
  syncEngine: string;
  company: string;
  website: string;
  copyrightYear: number;
  platform: string;
  supportContact: string;
  license: string;
};

export type HealthBuildPayload = {
  name: string;
  version: string;
  build: string;
  environment: AppEnvironment;
  builtAt: string;
  status: 'ok' | 'degraded';
  syncEngine: string;
  database?: 'connected' | 'disconnected' | 'unknown';
  apiStatus?: 'online' | 'degraded';
  serverTime?: string;
  uptimeSeconds?: number;
};
