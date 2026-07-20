import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AuthSession, AuthUser, LoginRequest } from '@saki-operations/types';

import { authApi, AuthApiError } from '@/modules/auth/api/auth-api';
import {
  clearPersistedSession,
  getAccessToken,
  getRefreshToken,
  hydrateAccessTokenFromStorage,
  persistSession,
} from '@/modules/auth/session/token-storage';

type SessionStatus = 'loading' | 'authenticated' | 'anonymous';

type SessionContextValue = {
  status: SessionStatus;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (input: LoginRequest) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
  restore: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const refreshTimer = useRef<number | null>(null);
  const refreshRef = useRef<() => Promise<boolean>>(async () => false);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimer.current) {
      window.clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
  }, []);

  const scheduleRefresh = useCallback(
    (expiresIn: number) => {
      clearRefreshTimer();
      const delayMs = Math.max(5_000, (expiresIn - 60) * 1000);
      refreshTimer.current = window.setTimeout(() => {
        void refreshRef.current();
      }, delayMs);
    },
    [clearRefreshTimer],
  );

  const applySession = useCallback(
    (session: AuthSession, rememberMe: boolean) => {
      persistSession(session, rememberMe);
      setUser(session.user);
      setStatus('authenticated');
      scheduleRefresh(session.tokens.expiresIn);
    },
    [scheduleRefresh],
  );

  const refreshSession = useCallback(async () => {
    try {
      const refreshToken = getRefreshToken() || undefined;
      const session = await authApi.refresh(refreshToken);
      const persisted = hydrateAccessTokenFromStorage();
      applySession(session, persisted?.rememberMe ?? true);
      return true;
    } catch {
      clearPersistedSession();
      clearRefreshTimer();
      setUser(null);
      setStatus('anonymous');
      return false;
    }
  }, [applySession, clearRefreshTimer]);

  refreshRef.current = refreshSession;

  const restore = useCallback(async () => {
    const persisted = hydrateAccessTokenFromStorage();
    if (!persisted) {
      setStatus('anonymous');
      setUser(null);
      return;
    }

    try {
      const me = await authApi.me(persisted.tokens.accessToken);
      setUser(me);
      setStatus('authenticated');
      scheduleRefresh(persisted.tokens.expiresIn);
    } catch (error) {
      if (error instanceof AuthApiError && error.status === 401) {
        await refreshSession();
        return;
      }
      clearPersistedSession();
      setUser(null);
      setStatus('anonymous');
    }
  }, [refreshSession, scheduleRefresh]);

  useEffect(() => {
    void restore();
    return () => clearRefreshTimer();
  }, [restore, clearRefreshTimer]);

  const login = useCallback(
    async (input: LoginRequest) => {
      const session = await authApi.login(input);
      applySession(session, Boolean(input.rememberMe));
      return session.user;
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken() || undefined;
    try {
      if (accessToken) {
        await authApi.logout(accessToken, refreshToken);
      }
    } catch {
      // still clear local session
    }
    clearPersistedSession();
    clearRefreshTimer();
    setUser(null);
    setStatus('anonymous');
  }, [clearRefreshTimer]);

  const value = useMemo(
    () => ({
      status,
      user,
      isAuthenticated: status === 'authenticated' && Boolean(user),
      login,
      logout,
      refresh: refreshSession,
      restore,
    }),
    [status, user, login, logout, refreshSession, restore],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
}
