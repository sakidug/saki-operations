import { hasPermission } from '@saki-operations/constants';
import type { AppPermission } from '@saki-operations/types';

import { readJson, writeJson } from '@/lib/local-persist';

export type EmployeeRole = 'driver' | 'office' | 'admin';

export type EmployeeRecord = {
  id: string;
  employeeId: string;
  displayName: string;
  phone: string;
  email: string;
  role: EmployeeRole;
  permissions: string[];
  emergencyContactName: string;
  emergencyContactPhone: string;
  /** Optional local data URL placeholder for profile photo. */
  photoDataUrl?: string;
};

type EmployeeStoreState = {
  employees: EmployeeRecord[];
};

const STORAGE_KEY = 'saki.ops.employees.v1';

const SEED_EMPLOYEES: EmployeeRecord[] = [
  {
    id: 'emp_drv_001',
    employeeId: 'EMP-DRV-001',
    displayName: 'Demo Driver',
    phone: '0770000001',
    email: 'driver@saki.local',
    role: 'driver',
    permissions: ['operations.start', 'operations.end', 'leave.apply', 'profile.view'],
    emergencyContactName: 'Nimal Perera',
    emergencyContactPhone: '0771111001',
  },
  {
    id: 'emp_ast_001',
    employeeId: 'EMP-AST-001',
    displayName: 'Demo Assistant',
    phone: '0770000002',
    email: 'assistant@saki.local',
    role: 'driver',
    permissions: ['operations.assist', 'leave.apply', 'profile.view'],
    emergencyContactName: 'Kamala Silva',
    emergencyContactPhone: '0771111002',
  },
  {
    id: 'emp_off_001',
    employeeId: 'EMP-OFF-001',
    displayName: 'Demo Office',
    phone: '0770000003',
    email: 'office@saki.local',
    role: 'office',
    permissions: [
      'leave.manage',
      'vehicles.manage',
      'employees.view',
      'reports.view',
      'profile.view',
    ],
    emergencyContactName: 'Ruwan Fernando',
    emergencyContactPhone: '0771111003',
  },
  {
    id: 'emp_adm_001',
    employeeId: 'EMP-ADM-001',
    displayName: 'Demo Admin',
    phone: '0770000004',
    email: 'admin@saki.local',
    role: 'admin',
    permissions: [
      'leave.manage',
      'vehicles.manage',
      'employees.manage',
      'reports.view',
      'settings.manage',
      'profile.view',
    ],
    emergencyContactName: 'Saki Operations Desk',
    emergencyContactPhone: '0112000000',
  },
];

function load(): EmployeeStoreState {
  const existing = readJson<EmployeeStoreState | null>(STORAGE_KEY, null);
  if (existing?.employees?.length) {
    return existing;
  }
  const seeded = { employees: SEED_EMPLOYEES };
  writeJson(STORAGE_KEY, seeded);
  return seeded;
}

function save(state: EmployeeStoreState): void {
  writeJson(STORAGE_KEY, state);
}

export function listEmployees(filter?: 'driver' | 'office' | 'all'): EmployeeRecord[] {
  const list = [...load().employees];
  const filtered =
    filter === 'driver'
      ? list.filter((e) => e.role === 'driver')
      : filter === 'office'
        ? list.filter((e) => e.role === 'office' || e.role === 'admin')
        : list;
  return filtered.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export function getEmployee(employeeId: string): EmployeeRecord | undefined {
  return load().employees.find((e) => e.employeeId === employeeId || e.id === employeeId);
}

export function getEmployeeBySessionId(employeeId: string): EmployeeRecord | undefined {
  return load().employees.find((e) => e.employeeId === employeeId);
}

export function setEmployeePhoto(employeeId: string, photoDataUrl: string): EmployeeRecord | undefined {
  const state = load();
  const employee = state.employees.find((e) => e.employeeId === employeeId || e.id === employeeId);
  if (!employee) return undefined;
  employee.photoDataUrl = photoDataUrl;
  save(state);
  return { ...employee };
}

export function canManageEmployees(
  roleOrPermissions: string | readonly AppPermission[],
): boolean {
  if (Array.isArray(roleOrPermissions)) {
    return hasPermission(roleOrPermissions, 'employees.manage');
  }
  return roleOrPermissions === 'admin' || roleOrPermissions === 'office';
}

/** Drivers may only open their own employee profile. */
export function canViewEmployeeProfile(
  viewerRoleOrPermissions: string | readonly AppPermission[],
  viewerEmployeeId: string,
  targetEmployeeId: string,
): boolean {
  if (canManageEmployees(viewerRoleOrPermissions)) return true;
  return viewerEmployeeId === targetEmployeeId;
}
