import { Suspense, type ReactNode, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { ApplicationLayout } from '@/app/layouts/application-layout';
import { AuthenticationLayout } from '@/app/layouts/shell-layouts';
import { RedirectIfAuthenticated, RequireAuth, RequireBootstrap, RequirePermission } from '@/app/router/guards';
import { MODULE_ACCESS_PERMISSION } from '@saki-operations/constants';
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
const ShellReadyScreen = lazy(() =>
  import('@/app/screens/placeholders/shell-ready-screen').then((m) => ({
    default: m.ShellReadyScreen,
  })),
);
const SettingsAboutScreen = lazy(() =>
  import('@/modules/settings/screens/settings-about-screen').then((m) => ({
    default: m.SettingsAboutScreen,
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
const HhcoHomeScreen = lazy(() =>
  import('@/modules/hhco/screens/hhco-home-screen').then((m) => ({
    default: m.HhcoHomeScreen,
  })),
);
const HhcoStartWizardScreen = lazy(() =>
  import('@/modules/hhco/screens/start-operation-wizard-screen').then((m) => ({
    default: m.StartOperationWizardScreen,
  })),
);
const HhcoPreviousOperationsScreen = lazy(() =>
  import('@/modules/hhco/screens/previous-operations-screen').then((m) => ({
    default: m.PreviousOperationsScreen,
  })),
);
const HhcoPreviousOperationDetailScreen = lazy(() =>
  import('@/modules/hhco/screens/previous-operation-detail-screen').then((m) => ({
    default: m.PreviousOperationDetailScreen,
  })),
);
const HhcoContinueOperationScreen = lazy(() =>
  import('@/modules/hhco/screens/continue-operation-screen').then((m) => ({
    default: m.ContinueOperationScreen,
  })),
);
const HhcoOperationStartedScreen = lazy(() =>
  import('@/modules/hhco/screens/operation-started-screen').then((m) => ({
    default: m.OperationStartedScreen,
  })),
);
const HhcoEndOperationWizardScreen = lazy(() =>
  import('@/modules/hhco/screens/end-operation-wizard-screen').then((m) => ({
    default: m.EndOperationWizardScreen,
  })),
);
const HhcoMultiDayDayCaptureScreen = lazy(() =>
  import('@/modules/hhco/screens/multi-day-day-capture-screen').then((m) => ({
    default: m.MultiDayDayCaptureScreen,
  })),
);
const HhcoOperationCompletedScreen = lazy(() =>
  import('@/modules/hhco/screens/operation-completed-screen').then((m) => ({
    default: m.OperationCompletedScreen,
  })),
);
const LeaveHomeScreen = lazy(() =>
  import('@/modules/leave/screens/leave-home-screen').then((m) => ({
    default: m.LeaveHomeScreen,
  })),
);
const ApplyLeaveScreen = lazy(() =>
  import('@/modules/leave/screens/apply-leave-screen').then((m) => ({
    default: m.ApplyLeaveScreen,
  })),
);
const LeaveDetailScreen = lazy(() =>
  import('@/modules/leave/screens/leave-detail-screen').then((m) => ({
    default: m.LeaveDetailScreen,
  })),
);
const VehicleListScreen = lazy(() =>
  import('@/modules/vehicles/screens/vehicle-list-screen').then((m) => ({
    default: m.VehicleListScreen,
  })),
);
const VehicleDetailScreen = lazy(() =>
  import('@/modules/vehicles/screens/vehicle-detail-screen').then((m) => ({
    default: m.VehicleDetailScreen,
  })),
);
const EmployeeListScreen = lazy(() =>
  import('@/modules/employees/screens/employee-list-screen').then((m) => ({
    default: m.EmployeeListScreen,
  })),
);
const EmployeeDetailScreen = lazy(() =>
  import('@/modules/employees/screens/employee-detail-screen').then((m) => ({
    default: m.EmployeeDetailScreen,
  })),
);
const OfficeDashboardScreen = lazy(() =>
  import('@/modules/office-dashboard/screens/office-dashboard-screen').then((m) => ({
    default: m.OfficeDashboardScreen,
  })),
);
const ReportsHomeScreen = lazy(() =>
  import('@/modules/reports/screens/reports-home-screen').then((m) => ({
    default: m.ReportsHomeScreen,
  })),
);
const ReportDetailScreen = lazy(() =>
  import('@/modules/reports/screens/report-detail-screen').then((m) => ({
    default: m.ReportDetailScreen,
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
                    <ShellReadyScreen kind="profile" />
                  </Suspend>
                ),
              },
              {
                path: paths.notifications,
                element: (
                  <Suspend>
                    <ShellReadyScreen kind="notifications" />
                  </Suspend>
                ),
              },
              {
                path: paths.settings,
                element: (
                  <Suspend>
                    <SettingsAboutScreen />
                  </Suspend>
                ),
              },
              {
                element: <RequirePermission permission={MODULE_ACCESS_PERMISSION.tours} />,
                children: [
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
                ],
              },
              {
                element: <RequirePermission permission={MODULE_ACCESS_PERMISSION.hhco} />,
                children: [
                  {
                    path: paths.hhco,
                    element: (
                      <Suspend>
                        <HhcoHomeScreen />
                      </Suspend>
                    ),
                  },
                  {
                    path: paths.hhcoStart,
                    element: (
                      <Suspend>
                        <HhcoStartWizardScreen />
                      </Suspend>
                    ),
                  },
                  {
                    path: paths.hhcoHistoryDetail,
                    element: (
                      <Suspend>
                        <HhcoPreviousOperationDetailScreen />
                      </Suspend>
                    ),
                  },
                  {
                    path: paths.hhcoHistory,
                    element: (
                      <Suspend>
                        <HhcoPreviousOperationsScreen />
                      </Suspend>
                    ),
                  },
                  {
                    path: paths.hhcoDeliveryStarted,
                    element: (
                      <Suspend>
                        <HhcoOperationStartedScreen />
                      </Suspend>
                    ),
                  },
                  {
                    path: paths.hhcoDeliveryEnd,
                    element: (
                      <Suspend>
                        <HhcoEndOperationWizardScreen />
                      </Suspend>
                    ),
                  },
                  {
                    path: paths.hhcoDeliveryDay,
                    element: (
                      <Suspend>
                        <HhcoMultiDayDayCaptureScreen />
                      </Suspend>
                    ),
                  },
                  {
                    path: paths.hhcoDeliveryCompleted,
                    element: (
                      <Suspend>
                        <HhcoOperationCompletedScreen />
                      </Suspend>
                    ),
                  },
                  {
                    path: paths.hhcoDelivery,
                    element: (
                      <Suspend>
                        <HhcoContinueOperationScreen />
                      </Suspend>
                    ),
                  },
                ],
              },
              {
                element: <RequirePermission permission={MODULE_ACCESS_PERMISSION.leave} />,
                children: [
                  {
                    path: paths.leave,
                    element: (
                      <Suspend>
                        <LeaveHomeScreen />
                      </Suspend>
                    ),
                  },
                  {
                    path: paths.leaveApply,
                    element: (
                      <Suspend>
                        <ApplyLeaveScreen />
                      </Suspend>
                    ),
                  },
                  {
                    path: paths.leaveDetail,
                    element: (
                      <Suspend>
                        <LeaveDetailScreen />
                      </Suspend>
                    ),
                  },
                ],
              },
              {
                element: <RequirePermission permission={MODULE_ACCESS_PERMISSION.vehicles} />,
                children: [
                  {
                    path: paths.vehicles,
                    element: (
                      <Suspend>
                        <VehicleListScreen />
                      </Suspend>
                    ),
                  },
                  {
                    path: paths.vehicleDetail,
                    element: (
                      <Suspend>
                        <VehicleDetailScreen />
                      </Suspend>
                    ),
                  },
                ],
              },
              {
                element: <RequirePermission permission={MODULE_ACCESS_PERMISSION.employees} />,
                children: [
                  {
                    path: paths.employees,
                    element: (
                      <Suspend>
                        <EmployeeListScreen />
                      </Suspend>
                    ),
                  },
                  {
                    path: paths.employeeDetail,
                    element: (
                      <Suspend>
                        <EmployeeDetailScreen />
                      </Suspend>
                    ),
                  },
                ],
              },
              {
                element: <RequirePermission permission={MODULE_ACCESS_PERMISSION.officeDashboard} />,
                children: [
                  {
                    path: paths.officeDashboard,
                    element: (
                      <Suspend>
                        <OfficeDashboardScreen />
                      </Suspend>
                    ),
                  },
                ],
              },
              {
                element: <RequirePermission permission={MODULE_ACCESS_PERMISSION.reports} />,
                children: [
                  {
                    path: paths.reportDetail,
                    element: (
                      <Suspend>
                        <ReportDetailScreen />
                      </Suspend>
                    ),
                  },
                  {
                    path: paths.reports,
                    element: (
                      <Suspend>
                        <ReportsHomeScreen />
                      </Suspend>
                    ),
                  },
                ],
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
