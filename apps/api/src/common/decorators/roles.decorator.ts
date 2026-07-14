import { SetMetadata } from '@nestjs/common';
import type { AppRole } from '@saki-operations/types';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
