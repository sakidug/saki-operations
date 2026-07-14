import type { AppPermission, AppRole } from '@saki-operations/types';

export const APP_ROLES = ['driver', 'assistant', 'office', 'admin'] as const satisfies readonly AppRole[];

export const APP_PERMISSIONS = [
  'employees.manage',
  'vehicles.manage',
  'reports.view',
  'payroll.manage',
  'settings.manage',
] as const satisfies readonly AppPermission[];

/** Default permission grants per role — used by auth issuance; UI comes later. */
export const ROLE_PERMISSIONS: Record<AppRole, AppPermission[]> = {
  driver: [],
  assistant: [],
  office: ['employees.manage', 'vehicles.manage', 'reports.view', 'settings.manage'],
  admin: [
    'employees.manage',
    'vehicles.manage',
    'reports.view',
    'payroll.manage',
    'settings.manage',
  ],
};

export const AUTH_PASSWORD_MIN_LENGTH = 12;

export const AUTH_RATE_LIMIT = {
  loginMaxAttempts: 5,
  loginWindowMs: 15 * 60 * 1000,
  lockoutMs: 15 * 60 * 1000,
} as const;

export function hasPermission(
  permissions: readonly AppPermission[],
  required: AppPermission | AppPermission[],
): boolean {
  const needed = Array.isArray(required) ? required : [required];
  return needed.every((permission) => permissions.includes(permission));
}

export function isAppRole(value: string): value is AppRole {
  return (APP_ROLES as readonly string[]).includes(value);
}
