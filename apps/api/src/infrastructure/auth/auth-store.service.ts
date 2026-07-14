import { Injectable } from '@nestjs/common';
import type { AppRole } from '@saki-operations/types';
import type { PasswordResetToken, RefreshToken, User } from '@prisma/client';

import { PrismaService } from '../database/prisma.service';
import type { StoredUser } from './token.service';

/**
 * Prisma-backed auth persistence.
 * Sample users are created only via the development database seeder — never at runtime.
 */
@Injectable()
export class AuthStoreService {
  constructor(private readonly prisma: PrismaService) {}

  async findByIdentifier(identifier: string): Promise<StoredUser | null> {
    const normalized = identifier.trim();
    const phoneNormalized = normalized.replace(/\s+/g, '');

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { employeeId: { equals: normalized, mode: 'insensitive' } },
          { phone: phoneNormalized },
        ],
      },
    });

    return user ? this.mapUser(user) : null;
  }

  async findById(id: string): Promise<StoredUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.mapUser(user) : null;
  }

  async updateUser(
    user: StoredUser,
    options?: { passwordChanged?: boolean },
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: user.passwordHash,
        failedLoginAttempts: user.failedLoginAttempts,
        lockedUntil: user.lockedUntil,
        isActive: user.isActive,
        ...(options?.passwordChanged ? { passwordChangedAt: new Date() } : {}),
      },
    });
  }

  async registerRefresh(record: {
    jti: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    revokedAt: Date | null;
  }): Promise<void> {
    await this.prisma.refreshToken.create({
      data: {
        id: record.jti,
        userId: record.userId,
        tokenHash: record.tokenHash,
        expiresAt: record.expiresAt,
        revokedAt: record.revokedAt,
      },
    });
  }

  async getRefresh(jti: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({ where: { id: jti } });
  }

  async revokeRefresh(jti: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { id: jti, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async saveReset(record: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    usedAt: Date | null;
  }): Promise<void> {
    await this.prisma.passwordResetToken.create({
      data: {
        userId: record.userId,
        tokenHash: record.tokenHash,
        expiresAt: record.expiresAt,
        usedAt: record.usedAt,
      },
    });
  }

  async getReset(tokenHash: string): Promise<PasswordResetToken | null> {
    return this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  }

  async markResetUsed(tokenHash: string): Promise<void> {
    await this.prisma.passwordResetToken.updateMany({
      where: { tokenHash, usedAt: null },
      data: { usedAt: new Date() },
    });
  }

  private mapUser(user: User): StoredUser {
    return {
      id: user.id,
      employeeId: user.employeeId,
      phone: user.phone,
      displayName: user.displayName,
      passwordHash: user.passwordHash,
      role: user.role as AppRole,
      isActive: user.isActive,
      failedLoginAttempts: user.failedLoginAttempts,
      lockedUntil: user.lockedUntil,
    };
  }
}
