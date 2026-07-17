import type { AuthSession, AuthTokens } from '@saki-operations/types';

import { STORAGE_KEYS } from '@/app/bootstrap/constants';

/**
 * Phase 9.1 (H-03) token persistence strategy
 * ------------------------------------------
 * Refresh tokens are stored in an HttpOnly cookie (`saki_refresh_token`, path `/api/v1/auth`)
 * set by the API on login/refresh. The SPA uses `credentials: 'include'` so refresh/logout
 * work without reading the refresh token from JavaScript.
 *
 * Web storage retains only: user profile snapshot + access token + expiresIn + rememberMe.
 * Refresh tokens are NEVER written to localStorage/sessionStorage (XSS surface reduction).
 *
 * Access tokens remain Bearer-in-memory (and briefly persisted for reload restore) because
 * migrating access tokens into HttpOnly cookies would require a same-origin BFF or
 * cookie-auth JWT strategy — deferred (documented debt).
 */

type PersistedAuth = {
  user: AuthSession['user'];
  /** Access-only token bundle — refreshToken is always omitted when writing. */
  tokens: Omit<AuthTokens, 'refreshToken'> & { refreshToken?: never };
  rememberMe: boolean;
};

let memoryAccessToken: string | null = null;

function readRaw(): string | null {
  try {
    return (
      window.localStorage.getItem(STORAGE_KEYS.authSession) ||
      window.sessionStorage.getItem(STORAGE_KEYS.authSession)
    );
  } catch {
    return null;
  }
}

function stripRefresh(tokens: AuthTokens): PersistedAuth['tokens'] {
  return {
    accessToken: tokens.accessToken,
    tokenType: tokens.tokenType,
    expiresIn: tokens.expiresIn,
  };
}

export function getAccessToken(): string | null {
  if (memoryAccessToken) return memoryAccessToken;
  try {
    const raw = readRaw();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedAuth;
    memoryAccessToken = parsed.tokens.accessToken;
    return memoryAccessToken;
  } catch {
    return null;
  }
}

/**
 * @deprecated Refresh tokens are cookie-backed. Returns null after Phase 9.1
 * except briefly for legacy stored sessions that still contain refreshToken
 * (one-time migration during refresh).
 */
export function getRefreshToken(): string | null {
  try {
    const raw = readRaw();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      tokens?: { refreshToken?: unknown };
    };
    return typeof parsed.tokens?.refreshToken === 'string'
      ? parsed.tokens.refreshToken
      : null;
  } catch {
    return null;
  }
}

export function persistSession(session: AuthSession, rememberMe: boolean) {
  memoryAccessToken = session.tokens.accessToken;
  const payload: PersistedAuth = {
    user: session.user,
    tokens: stripRefresh(session.tokens),
    rememberMe,
  };
  const serialized = JSON.stringify(payload);
  if (rememberMe) {
    window.localStorage.setItem(STORAGE_KEYS.authSession, serialized);
    window.sessionStorage.removeItem(STORAGE_KEYS.authSession);
  } else {
    window.sessionStorage.setItem(STORAGE_KEYS.authSession, serialized);
    window.localStorage.removeItem(STORAGE_KEYS.authSession);
  }
}

export function clearPersistedSession() {
  memoryAccessToken = null;
  window.localStorage.removeItem(STORAGE_KEYS.authSession);
  window.sessionStorage.removeItem(STORAGE_KEYS.authSession);
}

export function hydrateAccessTokenFromStorage(): PersistedAuth | null {
  try {
    const raw = readRaw();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedAuth;
    memoryAccessToken = parsed.tokens.accessToken;
    return parsed;
  } catch {
    return null;
  }
}
