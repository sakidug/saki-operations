/**
 * Seed entrypoint — development sample data only.
 * Production is refused here and again inside each seeder.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const seedsDir = dirname(fileURLToPath(import.meta.url));
loadEnvFile(resolve(seedsDir, '../../.env'));
loadEnvFile(resolve(seedsDir, '../.env'));

async function run() {
  if (process.env.NODE_ENV === 'production') {
    console.error('Refusing to run database seeds in production.');
    process.exit(1);
  }

  await import('./dev-users');
}

run();
