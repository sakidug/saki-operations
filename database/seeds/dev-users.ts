/**
 * Development-only database seeder.
 *
 * SAFETY:
 * - Refuses to run when NODE_ENV === "production"
 * - Requires ALLOW_DEV_SEED=true explicitly
 * - Never imported by the API runtime
 *
 * Usage:
 *   ALLOW_DEV_SEED=true pnpm db:seed
 */

import { createHash } from 'node:crypto';

import { PrismaClient, type Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

type SeedUser = {
  employeeId: string;
  phone: string;
  displayName: string;
  role: Role;
};

const DEV_USERS: SeedUser[] = [
  {
    employeeId: 'EMP-DRV-001',
    phone: '0770000001',
    displayName: 'Demo Driver',
    role: 'driver',
  },
  {
    employeeId: 'EMP-AST-001',
    phone: '0770000002',
    displayName: 'Demo Assistant',
    role: 'assistant',
  },
  {
    employeeId: 'EMP-OFF-001',
    phone: '0770000003',
    displayName: 'Demo Office',
    role: 'office',
  },
  {
    employeeId: 'EMP-ADM-001',
    phone: '0770000004',
    displayName: 'Demo Admin',
    role: 'admin',
  },
];

function assertDevelopmentOnly() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed: NODE_ENV is production.');
  }
  if (process.env.ALLOW_DEV_SEED !== 'true') {
    throw new Error(
      'Refusing to seed: set ALLOW_DEV_SEED=true to create development sample users.',
    );
  }
}

async function main() {
  assertDevelopmentOnly();

  const password = process.env.DEV_SEED_PASSWORD || 'SakiOps@2026Secure';
  if (password.length < 12) {
    throw new Error('DEV_SEED_PASSWORD must be at least 12 characters.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  // Avoid printing the password; print a fingerprint only.
  const fingerprint = createHash('sha256').update(password).digest('hex').slice(0, 8);

  for (const user of DEV_USERS) {
    await prisma.user.upsert({
      where: { employeeId: user.employeeId },
      update: {
        phone: user.phone,
        displayName: user.displayName,
        role: user.role,
        passwordHash,
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      create: {
        employeeId: user.employeeId,
        phone: user.phone,
        displayName: user.displayName,
        role: user.role,
        passwordHash,
        isActive: true,
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log(
    `Dev seed complete: ${DEV_USERS.length} users upserted (password fingerprint ${fingerprint}).`,
  );
  // eslint-disable-next-line no-console
  console.log('Sample employee IDs: EMP-DRV-001, EMP-AST-001, EMP-OFF-001, EMP-ADM-001');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
