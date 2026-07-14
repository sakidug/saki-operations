import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AUTH_PASSWORD_MIN_LENGTH, AUTH_RATE_LIMIT } from '@saki-operations/constants';
import type { AuthSession, AuthUser } from '@saki-operations/types';

import { AuditService } from '../../infrastructure/auth/audit.service';
import { AuthStoreService } from '../../infrastructure/auth/auth-store.service';
import { PasswordService } from '../../infrastructure/auth/password.service';
import { TokenService } from '../../infrastructure/auth/token.service';
import type {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  ResetPasswordDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly store: AuthStoreService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
  ) {}

  async login(dto: LoginDto): Promise<AuthSession> {
    const user = await this.store.findByIdentifier(dto.identifier);
    if (!user || !user.isActive) {
      this.audit.record('auth.login.failed', undefined, { reason: 'not_found' });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      this.audit.record('auth.login.locked', user.id);
      throw new UnauthorizedException('Account temporarily locked');
    }

    const valid = await this.passwords.verify(dto.password, user.passwordHash);
    if (!valid) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= AUTH_RATE_LIMIT.loginMaxAttempts) {
        user.lockedUntil = new Date(Date.now() + AUTH_RATE_LIMIT.lockoutMs);
        user.failedLoginAttempts = 0;
        this.audit.record('auth.account.locked', user.id);
      }
      await this.store.updateUser(user);
      this.audit.record('auth.login.failed', user.id, { reason: 'bad_password' });
      throw new UnauthorizedException('Invalid credentials');
    }

    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    await this.store.updateUser(user);

    const { tokens, refreshJti } = await this.tokens.issueTokens(user);
    await this.store.registerRefresh({
      jti: refreshJti,
      userId: user.id,
      tokenHash: this.tokens.hashToken(tokens.refreshToken),
      expiresAt: new Date(Date.now() + parseExpiryMsFromToken(tokens.refreshToken)),
      revokedAt: null,
    });

    this.audit.record('auth.login.success', user.id, { rememberMe: Boolean(dto.rememberMe) });

    return {
      user: this.tokens.toAuthUser(user),
      tokens,
    };
  }

  async refresh(refreshToken: string): Promise<AuthSession> {
    let payload;
    try {
      payload = await this.tokens.verifyRefresh(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const stored = await this.store.getRefresh(payload.jti);
    if (
      !stored ||
      stored.revokedAt ||
      stored.expiresAt.getTime() <= Date.now() ||
      stored.tokenHash !== this.tokens.hashToken(refreshToken)
    ) {
      throw new UnauthorizedException('Refresh token revoked or expired');
    }

    const user = await this.store.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    await this.store.revokeRefresh(payload.jti);
    const issued = await this.tokens.issueTokens(user);
    await this.store.registerRefresh({
      jti: issued.refreshJti,
      userId: user.id,
      tokenHash: this.tokens.hashToken(issued.tokens.refreshToken),
      expiresAt: new Date(Date.now() + parseExpiryMsFromToken(issued.tokens.refreshToken)),
      revokedAt: null,
    });

    this.audit.record('auth.token.refreshed', user.id);
    return {
      user: this.tokens.toAuthUser(user),
      tokens: issued.tokens,
    };
  }

  async logout(user: AuthUser, refreshToken?: string) {
    if (refreshToken) {
      try {
        const payload = await this.tokens.verifyRefresh(refreshToken);
        await this.store.revokeRefresh(payload.jti);
      } catch {
        // ignore invalid refresh on logout
      }
    } else {
      await this.store.revokeAllForUser(user.id);
    }
    this.audit.record('auth.logout', user.id);
    return { success: true };
  }

  me(user: AuthUser) {
    return user;
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.store.findByIdentifier(dto.identifier);
    if (user) {
      const { raw, hash } = this.tokens.createResetToken();
      await this.store.saveReset({
        userId: user.id,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        usedAt: null,
      });
      this.audit.record('auth.password.forgot', user.id, {
        delivery: 'placeholder',
        resetTokenPreview: process.env.NODE_ENV === 'production' ? undefined : raw,
      });
      return {
        success: true,
        message: 'If an account exists, reset instructions were sent.',
        ...(process.env.NODE_ENV === 'production' ? {} : { devResetToken: raw }),
      };
    }

    this.audit.record('auth.password.forgot', undefined, { reason: 'not_found' });
    return {
      success: true,
      message: 'If an account exists, reset instructions were sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    this.assertPasswordPolicy(dto.password);

    const hash = this.tokens.hashToken(dto.token);
    const record = await this.store.getReset(hash);
    if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = await this.store.findById(record.userId);
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    user.passwordHash = await this.passwords.hash(dto.password);
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    await this.store.updateUser(user, { passwordChanged: true });
    await this.store.markResetUsed(hash);
    await this.store.revokeAllForUser(user.id);
    this.audit.record('auth.password.reset', user.id);
    return { success: true };
  }

  async changePassword(user: AuthUser, dto: ChangePasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    this.assertPasswordPolicy(dto.newPassword);

    const stored = await this.store.findById(user.id);
    if (!stored) {
      throw new UnauthorizedException('User not found');
    }

    const valid = await this.passwords.verify(dto.currentPassword, stored.passwordHash);
    if (!valid) {
      this.audit.record('auth.password.change.failed', user.id);
      throw new UnauthorizedException('Current password is incorrect');
    }

    stored.passwordHash = await this.passwords.hash(dto.newPassword);
    await this.store.updateUser(stored, { passwordChanged: true });
    await this.store.revokeAllForUser(stored.id);
    this.audit.record('auth.password.changed', user.id);
    return { success: true };
  }

  private assertPasswordPolicy(password: string) {
    if (password.length < AUTH_PASSWORD_MIN_LENGTH) {
      throw new BadRequestException(
        `Password must be at least ${AUTH_PASSWORD_MIN_LENGTH} characters`,
      );
    }
  }
}

function parseExpiryMsFromToken(token: string): number {
  try {
    const [, payload] = token.split('.');
    if (!payload) return 7 * 86400000;
    const json = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      exp?: number;
      iat?: number;
    };
    if (json.exp && json.iat) {
      return Math.max(0, (json.exp - json.iat) * 1000);
    }
  } catch {
    // fall through
  }
  return 7 * 86400000;
}
