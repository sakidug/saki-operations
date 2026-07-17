import { SetMetadata } from '@nestjs/common';
import type { AppPermission } from '@saki-operations/types';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: AppPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
/** @deprecated Prefer `Permissions` — kept as alias for older call sites. */
export const RequirePermissions = Permissions;
