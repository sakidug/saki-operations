/**
 * Production-safe admin bootstrap.
 *
 * Creates or updates exactly one admin user. Does not seed demo accounts.
 *
 * Usage (from repo root):
 *   ADMIN_PASSWORD='your-secure-password' pnpm create-admin
 *
 * Requires DATABASE_URL (e.g. via .env). Password must be at least 12 characters
 * (same policy as AUTH_PASSWORD_MIN_LENGTH / PasswordService).
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

/** Matches `PasswordService` / the development seeder. */
const BCRYPT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 12;

const ADMIN = {
  employeeId: 'EMP-ADM-001',
  phone: '0760081005',
  displayName: 'Sakidu Ganegoda',
  role: 'admin' as const,
};

const prisma = new PrismaClient();

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

function loadEnv() {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const root = resolve(scriptDir, '..');
  loadEnvFile(resolve(root, '.env'));
  loadEnvFile(resolve(root, 'database/.env'));
}

function requireAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error(
      'ADMIN_PASSWORD is required. Example: ADMIN_PASSWORD=\'…\' pnpm create-admin',
    );
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    );
  }
  return password;
}

async function main() {
  loadEnv();

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required (set it in the environment or .env).');
  }

  const password = requireAdminPassword();
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const fingerprint = createHash('sha256').update(password).digest('hex').slice(0, 8);
  const now = new Date();

  const user = await prisma.user.upsert({
    where: { employeeId: ADMIN.employeeId },
    update: {
      phone: ADMIN.phone,
      displayName: ADMIN.displayName,
      role: ADMIN.role,
      passwordHash,
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      passwordChangedAt: now,
    },
    create: {
      employeeId: ADMIN.employeeId,
      phone: ADMIN.phone,
      displayName: ADMIN.displayName,
      role: ADMIN.role,
      passwordHash,
      isActive: true,
      passwordChangedAt: now,
    },
  });

  // eslint-disable-next-line no-console
  console.log(
    `Admin ready: ${user.employeeId} (${user.displayName}) — password fingerprint ${fingerprint}.`,
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
