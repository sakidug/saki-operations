import { Suspense, type ReactNode, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { ApplicationLayout } from '@/app/layouts/application-layout';
import { AuthenticationLayout } from '@/app/layouts/shell-layouts';
import { RedirectIfAuthenticated, RequireAuth, RequireBootstrap } from '@/app/router/guards';
import { paths } from '@/app/router/paths';
import { AuthCheckLoadingScreen, LoadingScreen } from '@/app/screens/loading/loading-experience';
import { SplashScreen } from '@/app/screens/splash/splash-screen';

const LanguageScreen = lazy(() =>
  import('@/app/screens/language/language-screen').then((m) => ({ default: m.LanguageScreen })),
);
const LoginScreen = lazy(() =>
  import('@/modules/auth/screens/login-screen').then((m) => ({ default: m.LoginScreen })),
);
const ForgotPasswordScreen = lazy(() =>
  import('@/modules/auth/screens/forgot-password-screen').then((m) => ({
    default: m.ForgotPasswordScreen,
  })),
);
const ResetPasswordScreen = lazy(() =>
  import('@/modules/auth/screens/reset-password-screen').then((m) => ({
    default: m.ResetPasswordScreen,
  })),
);
const ChangePasswordScreen = lazy(() =>
  import('@/modules/auth/screens/change-password-screen').then((m) => ({
    default: m.ChangePasswordScreen,
  })),
);
const HomeDashboardScreen = lazy(() =>
  import('@/modules/dashboard/screens/home-dashboard-screen').then((m) => ({
    default: m.HomeDashboardScreen,
  })),
);
const RoutePlaceholder = lazy(() =>
  import('@/app/screens/placeholders/route-placeholder').then((m) => ({
    default: m.RoutePlaceholder,
  })),
);
const SakiToursHomeScreen = lazy(() =>
  import('@/modules/saki-tours/screens/saki-tours-home-screen').then((m) => ({
    default: m.SakiToursHomeScreen,
  })),
);
const StartOperationWizardScreen = lazy(() =>
  import('@/modules/saki-tours/screens/start-operation-wizard-screen').then((m) => ({
    default: m.StartOperationWizardScreen,
  })),
);
const OperationStartedScreen = lazy(() =>
  import('@/modules/saki-tours/screens/operation-started-screen').then((m) => ({
    default: m.OperationStartedScreen,
  })),
);
const PreviousOperationsScreen = lazy(() =>
  import('@/modules/saki-tours/screens/previous-operations-screen').then((m) => ({
    default: m.PreviousOperationsScreen,
  })),
);
const PreviousOperationDetailScreen = lazy(() =>
  import('@/modules/saki-tours/screens/previous-operation-detail-screen').then((m) => ({
    default: m.PreviousOperationDetailScreen,
  })),
);
const ContinueOperationScreen = lazy(() =>
  import('@/modules/saki-tours/screens/continue-operation-screen').then((m) => ({
    default: m.ContinueOperationScreen,
  })),
);
const EndOperationWizardScreen = lazy(() =>
  import('@/modules/saki-tours/screens/end-operation-wizard-screen').then((m) => ({
    default: m.EndOperationWizardScreen,
  })),
);
const MultiDayDayCaptureScreen = lazy(() =>
  import('@/modules/saki-tours/screens/multi-day-day-capture-screen').then((m) => ({
    default: m.MultiDayDayCaptureScreen,
  })),
);
const OperationCompletedScreen = lazy(() =>
  import('@/modules/saki-tours/screens/operation-completed-screen').then((m) => ({
    default: m.OperationCompletedScreen,
  })),
);
const NotFoundScreen = lazy(() =>
  import('@/app/screens/errors/error-screens').then((m) => ({ default: m.NotFoundScreen })),
);
const OfflineScreen = lazy(() =>
  import('@/app/screens/errors/error-screens').then((m) => ({ default: m.OfflineScreen })),
);
const MaintenanceScreen = lazy(() =>
  import('@/app/screens/errors/error-screens').then((m) => ({ default: m.MaintenanceScreen })),
);
const GenericErrorScreen = lazy(() =>
  import('@/app/screens/errors/error-screens').then((m) => ({ default: m.GenericErrorScreen })),
);

function Suspend({
  children,
  fallback = <LoadingScreen />,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}

function AuthGate({ children }: { children: ReactNode }) {
  return (
    <AuthenticationLayout>
      <Suspend fallback={<AuthCheckLoadingScreen />}>{children}</Suspend>
    </AuthenticationLayout>
  );
}

export const appRouter = createBrowserRouter([
  {
    path: paths.splash,
    element: <SplashScreen />,
  },
  {
    path: paths.language,
    element: (
      <Suspend>
        <LanguageScreen />
      </Suspend>
    ),
  },
  {
    element: <RequireBootstrap />,
    children: [
      {
        element: <RedirectIfAuthenticated />,
        children: [
          {
            path: paths.login,
            element: (
              <AuthGate>
                <LoginScreen />
              </AuthGate>
            ),
          },
          {
            path: paths.forgotPassword,
            element: (
              <AuthGate>
                <ForgotPasswordScreen />
              </AuthGate>
            ),
          },
          {
            path: paths.resetPassword,
            element: (
              <AuthGate>
                <ResetPasswordScreen />
              </AuthGate>
            ),
          },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <ApplicationLayout />,
            children: [
              {
                path: paths.home,
                element: (
                  <Suspend>
                    <HomeDashboardScreen />
                  </Suspend>
                ),
              },
              {
                path: paths.profile,
                element: (
                  <Suspend>
                    <RoutePlaceholder titleKey="shell.placeholder.profile" />
                  </Suspend>
                ),
              },
              {
                path: paths.notifications,
                element: (
                  <Suspend>
                    <RoutePlaceholder titleKey="shell.placeholder.notifications" />
                  </Suspend>
                ),
              },
              {
                path: paths.settings,
                element: (
                  <Suspend>
                    <RoutePlaceholder titleKey="shell.placeholder.settings" />
                  </Suspend>
                ),
              },
              {
                path: paths.sakiTours,
                element: (
                  <Suspend>
                    <SakiToursHomeScreen />
                  </Suspend>
                ),
              },
              {
                path: paths.sakiToursStart,
                element: (
                  <Suspend>
                    <StartOperationWizardScreen />
                  </Suspend>
                ),
              },
              {
                path: paths.sakiToursHistoryDetail,
                element: (
                  <Suspend>
                    <PreviousOperationDetailScreen />
                  </Suspend>
                ),
              },
              {
                path: paths.sakiToursHistory,
                element: (
                  <Suspend>
                    <PreviousOperationsScreen />
                  </Suspend>
                ),
              },
              {
                path: paths.sakiToursOperationStarted,
                element: (
                  <Suspend>
                    <OperationStartedScreen />
                  </Suspend>
                ),
              },
              {
                path: paths.sakiToursOperationEnd,
                element: (
                  <Suspend>
                    <EndOperationWizardScreen />
                  </Suspend>
                ),
              },
              {
                path: paths.sakiToursOperationDay,
                element: (
                  <Suspend>
                    <MultiDayDayCaptureScreen />
                  </Suspend>
                ),
              },
              {
                path: paths.sakiToursOperationCompleted,
                element: (
                  <Suspend>
                    <OperationCompletedScreen />
                  </Suspend>
                ),
              },
              {
                path: paths.sakiToursOperation,
                element: (
                  <Suspend>
                    <ContinueOperationScreen />
                  </Suspend>
                ),
              },
              {
                path: paths.hhco,
                element: (
                  <Suspend>
                    <RoutePlaceholder titleKey="shell.placeholder.hhco" />
                  </Suspend>
                ),
              },
              {
                path: paths.changePassword,
                element: (
                  <Suspend>
                    <ChangePasswordScreen />
                  </Suspend>
                ),
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: paths.notFound,
    element: (
      <Suspend>
        <NotFoundScreen />
      </Suspend>
    ),
  },
  {
    path: paths.offline,
    element: (
      <Suspend>
        <OfflineScreen />
      </Suspend>
    ),
  },
  {
    path: paths.maintenance,
    element: (
      <Suspend>
        <MaintenanceScreen />
      </Suspend>
    ),
  },
  {
    path: paths.error,
    element: (
      <Suspend>
        <GenericErrorScreen />
      </Suspend>
    ),
  },
  { path: '*', element: <Navigate to={paths.notFound} replace /> },
]);
