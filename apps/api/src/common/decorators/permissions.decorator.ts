import { SetMetadata } from '@nestjs/common';
import type { AppPermission } from '@saki-operations/types';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: AppPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
