/**
 * Shared authentication, authorization, and domain contracts.
 */

export type ApiResponse<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiError = {
  statusCode: number;
  message: string;
  error?: string;
  path?: string;
  timestamp?: string;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

/** Application roles — prepared in Phase 4; permission UI later. */
export type AppRole = 'driver' | 'assistant' | 'office' | 'admin';

/**
 * Fine-grained permissions for the operations platform (Phase 9.1).
 * Server RolesGuard / PermissionsGuard and web RequirePermission enforce these.
 */
export type AppPermission =
  | 'operations.tours'
  | 'operations.hhco'
  | 'leave.view'
  | 'leave.manage'
  | 'vehicles.view'
  | 'vehicles.manage'
  | 'employees.view'
  | 'employees.manage'
  | 'office.view'
  | 'reports.view'
  | 'payroll.manage'
  | 'settings.manage';
export type AuthUser = {
  id: string;
  employeeId: string;
  phone: string | null;
  displayName: string;
  role: AppRole;
  permissions: AppPermission[];
};

export type AuthTokens = {
  accessToken: string;
  /**
   * Omitted from production login/refresh JSON (HttpOnly cookie is SoT).
   * Optional for clients after Phase 9.4 / H-01.
   */
  refreshToken?: string;
  tokenType: 'Bearer';
  expiresIn: number;
};

export type AuthSession = {
  user: AuthUser;
  tokens: AuthTokens;
};

export type LoginRequest = {
  identifier: string;
  password: string;
  rememberMe?: boolean;
};

export type ForgotPasswordRequest = {
  identifier: string;
};

export type ResetPasswordRequest = {
  token: string;
  password: string;
  confirmPassword: string;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type JwtAccessPayload = {
  sub: string;
  employeeId: string;
  role: AppRole;
  permissions: AppPermission[];
  typ: 'access';
};

export type JwtRefreshPayload = {
  sub: string;
  jti: string;
  typ: 'refresh';
};

export * from './selectors.js';
