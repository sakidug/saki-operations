import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { hasPermission } from '@saki-operations/constants';
import { useAppTranslation } from '@saki-operations/i18n';
import type { AppPermission } from '@saki-operations/types';

import { useBootstrap } from '@/app/bootstrap/bootstrap-provider';
import { STORAGE_KEYS } from '@/app/bootstrap/constants';
import { useSession } from '@/app/bootstrap/session-provider';
import { paths } from '@/app/router/paths';
import {
  AuthCheckLoadingScreen,
  LoadingScreen,
} from '@/app/screens/loading/loading-experience';

function readLanguageSelected(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEYS.languageSelected) === 'true';
  } catch {
    return false;
  }
}

/** Ensures bootstrap/splash completed and language chosen before continuing. */
export function RequireBootstrap({ children }: { children?: React.ReactNode }) {
  const { status, splashComplete, snapshot } = useBootstrap();
  const { t } = useAppTranslation();
  const location = useLocation();

  if (status === 'booting' || !splashComplete) {
    return <LoadingScreen message={t('shell.loading.application')} />;
  }

  const languageSelected = Boolean(snapshot?.languageSelected) || readLanguageSelected();

  if (snapshot && !languageSelected && location.pathname !== paths.language) {
    return <Navigate to={paths.language} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

/** Protects authenticated application routes. */
export function RequireAuth() {
  const { status, isAuthenticated } = useSession();
  const location = useLocation();

  if (status === 'loading') {
    return <AuthCheckLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to={paths.login} replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

/**
 * Requires one or more AppPermission values from the authenticated session (Phase 9.1).
 * Server ModulesController enforces the same permissions on API gates.
 */
export function RequirePermission({
  permission,
}: {
  permission: AppPermission | AppPermission[];
}) {
  const { status, isAuthenticated, user } = useSession();
  const location = useLocation();

  if (status === 'loading') {
    return <AuthCheckLoadingScreen />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={paths.login} replace state={{ from: location.pathname }} />;
  }

  if (!hasPermission(user.permissions, permission)) {
    return <Navigate to={paths.home} replace />;
  }

  return <Outlet />;
}

/** Redirects authenticated office/admin users away from guest-only screens. */
export function RedirectIfAuthenticated() {
  const { status, isAuthenticated, user } = useSession();

  if (status === 'loading') {
    return <AuthCheckLoadingScreen />;
  }

  if (isAuthenticated && (user?.role === 'office' || user?.role === 'admin')) {
    return <Navigate to={paths.home} replace />;
  }

  return <Outlet />;
}
