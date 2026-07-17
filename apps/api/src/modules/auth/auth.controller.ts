import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AuthSession, AuthUser } from '@saki-operations/types';
import type { Request, Response } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { LoginRateLimitGuard } from '../../common/guards/login-rate-limit.guard';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshDto,
  ResetPasswordDto,
} from './dto/auth.dto';

const REFRESH_COOKIE = 'saki_refresh_token';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @UseGuards(LoginRateLimitGuard)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.auth.login(dto);
    this.setRefreshCookie(res, requireRefreshToken(session), Boolean(dto.rememberMe));
    // H-01 — never return refreshToken in JSON; HttpOnly cookie is SoT.
    return { data: toPublicSession(session) };
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = dto.refreshToken || readCookie(req, REFRESH_COOKIE);
    if (!token) {
      throw new UnauthorizedException('Refresh token required');
    }
    const session = await this.auth.refresh(token);
    this.setRefreshCookie(res, requireRefreshToken(session), true);
    return { data: toPublicSession(session) };
  }

  @Post('logout')
  async logout(
    @CurrentUser() user: AuthUser,
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = dto.refreshToken || readCookie(req, REFRESH_COOKIE);
    const result = await this.auth.logout(user, token);
    this.clearRefreshCookie(res);
    return { data: result };
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return { data: user };
  }

  @Public()
  @UseGuards(LoginRateLimitGuard)
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto).then((data) => ({ data }));
  }

  @Public()
  @UseGuards(LoginRateLimitGuard)
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto).then((data) => ({ data }));
  }

  @Post('change-password')
  changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(user, dto).then((data) => ({ data }));
  }

  private setRefreshCookie(res: Response, token: string, rememberMe: boolean) {
    const isProd = this.config.get<string>('app.nodeEnv') === 'production';
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: rememberMe ? 7 * 86400000 : undefined,
    });
  }

  private clearRefreshCookie(res: Response) {
    res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
  }
}

function readCookie(req: Request, name: string): string | undefined {
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
  return cookies?.[name];
}

function requireRefreshToken(session: AuthSession): string {
  const token = session.tokens.refreshToken;
  if (!token) {
    throw new UnauthorizedException('Refresh token missing from session issue');
  }
  return token;
}

/** Strip refreshToken from API responses (Phase 9.4 / H-01). */
function toPublicSession(session: AuthSession): AuthSession {
  return {
    user: session.user,
    tokens: {
      accessToken: session.tokens.accessToken,
      tokenType: session.tokens.tokenType,
      expiresIn: session.tokens.expiresIn,
    },
  };
}
