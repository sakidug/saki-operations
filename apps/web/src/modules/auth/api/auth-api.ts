import type {
  AuthSession,
  AuthUser,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  ResetPasswordRequest,
} from '@saki-operations/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export class AuthApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AuthApiError';
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { accessToken?: string } = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (options.accessToken) {
    headers.set('Authorization', `Bearer ${options.accessToken}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const payload = (await response.json().catch(() => null)) as
    | { data?: T; message?: string | string[] }
    | null;

  if (!response.ok) {
    const message = Array.isArray(payload?.message)
      ? payload.message.join(', ')
      : payload?.message || 'Request failed';
    throw new AuthApiError(message, response.status);
  }

  return (payload?.data ?? payload) as T;
}

export const authApi = {
  login(body: LoginRequest) {
    return request<AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  refresh(refreshToken?: string) {
    return request<AuthSession>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },

  logout(accessToken: string, refreshToken?: string) {
    return request<{ success: boolean }>('/auth/logout', {
      method: 'POST',
      accessToken,
      body: JSON.stringify({ refreshToken }),
    });
  },

  me(accessToken: string) {
    return request<AuthUser>('/auth/me', {
      method: 'GET',
      accessToken,
    });
  },

  forgotPassword(body: ForgotPasswordRequest) {
    return request<{ success: boolean; message: string; devResetToken?: string }>(
      '/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    );
  },

  resetPassword(body: ResetPasswordRequest) {
    return request<{ success: boolean }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  changePassword(accessToken: string, body: ChangePasswordRequest) {
    return request<{ success: boolean }>('/auth/change-password', {
      method: 'POST',
      accessToken,
      body: JSON.stringify(body),
    });
  },
};
