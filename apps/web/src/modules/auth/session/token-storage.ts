import type { AuthSession, AuthTokens } from '@saki-operations/types';

import { STORAGE_KEYS } from '@/app/bootstrap/constants';

type PersistedAuth = {
  user: AuthSession['user'];
  tokens: AuthTokens;
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

export function getRefreshToken(): string | null {
  try {
    const raw = readRaw();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedAuth;
    return parsed.tokens.refreshToken;
  } catch {
    return null;
  }
}

export function persistSession(session: AuthSession, rememberMe: boolean) {
  memoryAccessToken = session.tokens.accessToken;
  const payload: PersistedAuth = {
    user: session.user,
    tokens: session.tokens,
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
