import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthUser, JwtAccessPayload } from '@saki-operations/types';

import { AuthStoreService } from './auth-store.service';
import { TokenService } from './token.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly store: AuthStoreService,
    private readonly tokens: TokenService,
  ) {
    const secret = config.get<string>('app.jwt.secret');
    if (!secret) {
      throw new Error('[FATAL] app.jwt.secret is not configured for JwtStrategy');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtAccessPayload): Promise<AuthUser> {
    if (payload.typ !== 'access') {
      throw new UnauthorizedException('Invalid access token');
    }
    const user = await this.store.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }
    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      throw new UnauthorizedException('Account temporarily locked');
    }
    return this.tokens.toAuthUser(user);
  }
}
