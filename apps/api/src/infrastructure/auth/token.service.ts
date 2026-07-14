import { createHash, randomBytes, randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ROLE_PERMISSIONS } from '@saki-operations/constants';
import type {
  AppRole,
  AuthTokens,
  AuthUser,
  JwtAccessPayload,
  JwtRefreshPayload,
} from '@saki-operations/types';

export type StoredUser = {
  id: string;
  employeeId: string;
  phone: string | null;
  displayName: string;
  passwordHash: string;
  role: AppRole;
  isActive: boolean;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
};

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  toAuthUser(user: StoredUser): AuthUser {
    return {
      id: user.id,
      employeeId: user.employeeId,
      phone: user.phone,
      displayName: user.displayName,
      role: user.role,
      permissions: ROLE_PERMISSIONS[user.role],
    };
  }

  async issueTokens(user: StoredUser): Promise<{ tokens: AuthTokens; refreshJti: string }> {
    const refreshJti = randomUUID();
    const accessExpires = this.config.get<string>('app.jwt.accessExpiresIn', '15m');
    const refreshExpires = this.config.get<string>('app.jwt.refreshExpiresIn', '7d');

    const accessPayload: JwtAccessPayload = {
      sub: user.id,
      employeeId: user.employeeId,
      role: user.role,
      permissions: ROLE_PERMISSIONS[user.role],
      typ: 'access',
    };

    const refreshPayload: JwtRefreshPayload = {
      sub: user.id,
      jti: refreshJti,
      typ: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(accessPayload as Record<string, unknown>, {
        expiresIn: accessExpires as `${number}${'s' | 'm' | 'h' | 'd'}`,
      }),
      this.jwt.signAsync(refreshPayload as Record<string, unknown>, {
        expiresIn: refreshExpires as `${number}${'s' | 'm' | 'h' | 'd'}`,
      }),
    ]);

    return {
      refreshJti,
      tokens: {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: parseExpirySeconds(accessExpires),
      },
    };
  }

  async verifyRefresh(token: string): Promise<JwtRefreshPayload> {
    const payload = await this.jwt.verifyAsync<JwtRefreshPayload>(token);
    if (payload.typ !== 'refresh') {
      throw new Error('Invalid refresh token type');
    }
    return payload;
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  createResetToken(): { raw: string; hash: string } {
    const raw = randomBytes(32).toString('hex');
    return { raw, hash: this.hashToken(raw) };
  }
}

function parseExpirySeconds(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim());
  if (!match) return 900;
  const amount = Number(match[1]);
  const unit = match[2];
  switch (unit) {
    case 's':
      return amount;
    case 'm':
      return amount * 60;
    case 'h':
      return amount * 3600;
    case 'd':
      return amount * 86400;
    default:
      return 900;
  }
}
