/**
 * Resolve build metadata for Saki Operations.
 * Used by Vite (web) and Nest (API) via generate-build-meta.mjs.
 * Never hardcode version numbers — root package.json is the source of truth.
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

/**
 * @typedef {'development' | 'staging' | 'production'} AppEnvironment
 * @typedef {{
 *   name: string;
 *   version: string;
 *   build: string;
 *   builtAt: string;
 *   environment: AppEnvironment;
 *   syncEngine: string;
 *   company: string;
 *   website: string;
 *   copyrightYear: number;
 *   platform: string;
 * }} BuildMeta
 */

/** @param {string} value @returns {AppEnvironment} */
export function normalizeEnvironment(value) {
  const v = String(value || '')
    .trim()
    .toLowerCase();
  if (v === 'production' || v === 'prod') return 'production';
  if (v === 'staging' || v === 'stage' || v === 'preview') return 'staging';
  return 'development';
}

function findRootPackage() {
  let dir = ROOT;
  for (let i = 0; i < 6; i++) {
    const candidate = join(dir, 'package.json');
    if (existsSync(candidate)) {
      const pkg = JSON.parse(readFileSync(candidate, 'utf8'));
      if (pkg.name === 'saki-operations') return pkg;
    }
    const parent = join(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error('[build-meta] Root package.json (saki-operations) not found');
}

function resolveGitSha() {
  const fromEnv =
    process.env.GITHUB_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.SOURCE_VERSION ||
    process.env.GIT_COMMIT ||
    process.env.COMMIT_SHA ||
    process.env.CF_PAGES_COMMIT_SHA;
  if (fromEnv && typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.trim().slice(0, 7);
  }
  try {
    return execSync('git rev-parse --short=7 HEAD', {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return 'unknown';
  }
}

/**
 * @param {{ environment?: string }} [opts]
 * @returns {BuildMeta}
 */
export function resolveBuildMeta(opts = {}) {
  const pkg = findRootPackage();
  const envHint =
    opts.environment ||
    process.env.APP_ENV ||
    process.env.VITE_APP_ENV ||
    process.env.NODE_ENV ||
    'development';

  return {
    name: process.env.APP_NAME || 'Saki Operations',
    version: String(pkg.version),
    build: resolveGitSha(),
    builtAt: new Date().toISOString(),
    environment: normalizeEnvironment(envHint),
    syncEngine: '1',
    company: 'Saki Tours & Weddings (Pvt) Ltd',
    website: 'https://sakitours.com',
    copyrightYear: new Date().getUTCFullYear(),
    platform: 'Web PWA',
    supportContact: 'operations@sakitours.com',
    license: 'Proprietary',
  };
}
