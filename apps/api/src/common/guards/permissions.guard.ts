import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { hasPermission } from '@saki-operations/constants';
import type { AppPermission, AuthUser } from '@saki-operations/types';

import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

/** Enforces @Permissions(...) metadata on handlers/controllers (Phase 9.1). */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AppPermission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;
    if (!user || !hasPermission(user.permissions, required)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
