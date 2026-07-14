import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { AUTH_RATE_LIMIT } from '@saki-operations/constants';

type Bucket = { count: number; resetAt: number };

/**
 * In-memory rate limiter — ready for Redis-backed replacement in production.
 */
@Injectable()
export class LoginRateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      ip?: string;
      body?: { identifier?: string };
    }>();
    const key = `${request.ip ?? 'unknown'}:${request.body?.identifier ?? 'unknown'}`.toLowerCase();
    const now = Date.now();
    const existing = this.buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      this.buckets.set(key, {
        count: 1,
        resetAt: now + AUTH_RATE_LIMIT.loginWindowMs,
      });
      return true;
    }

    if (existing.count >= AUTH_RATE_LIMIT.loginMaxAttempts) {
      throw new HttpException(
        'Too many login attempts. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    existing.count += 1;
    this.buckets.set(key, existing);
    return true;
  }
}
