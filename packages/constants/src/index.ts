import type { AppPermission, AppRole } from '@saki-operations/types';

export const APP_ROLES = ['driver', 'assistant', 'office', 'admin'] as const satisfies readonly AppRole[];

export const APP_PERMISSIONS = [
  'operations.tours',
  'operations.hhco',
  'leave.view',
  'leave.manage',
  'vehicles.view',
  'vehicles.manage',
  'employees.view',
  'employees.manage',
  'office.view',
  'reports.view',
  'payroll.manage',
  'settings.manage',
] as const satisfies readonly AppPermission[];

const FIELD_OPS: AppPermission[] = [
  'operations.tours',
  'operations.hhco',
  'leave.view',
  'vehicles.view',
  'employees.view',
];

/** Default permission grants per role — issued in JWT and enforced by guards. */
export const ROLE_PERMISSIONS: Record<AppRole, AppPermission[]> = {
  driver: [...FIELD_OPS],
  assistant: [...FIELD_OPS],
  office: [
    ...FIELD_OPS,
    'leave.manage',
    'vehicles.manage',
    'employees.manage',
    'office.view',
    'reports.view',
    'settings.manage',
  ],
  admin: [...APP_PERMISSIONS],
};

/** Module → required permission for SPA routes and API module gates. */
export const MODULE_ACCESS_PERMISSION = {
  tours: 'operations.tours',
  hhco: 'operations.hhco',
  leave: 'leave.view',
  vehicles: 'vehicles.view',
  employees: 'employees.view',
  officeDashboard: 'office.view',
  reports: 'reports.view',
} as const satisfies Record<string, AppPermission>;

export type ModuleAccessKey = keyof typeof MODULE_ACCESS_PERMISSION;

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

export function canAccessModule(
  permissions: readonly AppPermission[],
  module: ModuleAccessKey,
): boolean {
  return hasPermission(permissions, MODULE_ACCESS_PERMISSION[module]);
}

export function isAppRole(value: string): value is AppRole {
  return (APP_ROLES as readonly string[]).includes(value);
}
