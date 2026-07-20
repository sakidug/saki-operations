import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, CalendarDays, Home, Settings, User } from 'lucide-react';
import { canAccessModule } from '@saki-operations/constants';
import { useAppTranslation } from '@saki-operations/i18n';

import { useSession } from '@/app/bootstrap/session-provider';
import { AppBottomNav } from '@/app/navigation/app-bottom-nav';
import { AppSidebar } from '@/app/navigation/app-sidebar';
import { AppTopNav } from '@/app/navigation/app-top-nav';
import { RouteTransition } from '@/app/navigation/route-transition';
import { useMediaQuery } from '@/app/navigation/use-media-query';
import { ConnectionBanner } from '@/app/shell/connection-banner';
import { InstallPrompt } from '@/app/shell/install-prompt';
import { UpdateBanner } from '@/app/shell/update-banner';
import { ResponsiveLayout } from '@/app/layouts/shell-layouts';
import { paths } from '@/app/router/paths';

export type ApplicationLayoutProps = {
  children?: ReactNode;
};

/**
 * Primary authenticated application chrome.
 * Phone: top + bottom nav. Tablet/Desktop: sidebar + top nav.
 */
export function ApplicationLayout({ children }: ApplicationLayoutProps) {
  const { t } = useAppTranslation();
  const { user } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isTablet = useMediaQuery('(min-width: 768px)');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const showFleetPlanner = Boolean(
    user && canAccessModule(user.permissions, 'fleetPlanner'),
  );

  const navItems = useMemo(() => {
    const items = [
      {
        key: 'home',
        label: t('shell.nav.home'),
        icon: <Home />,
        href: paths.home,
        active: location.pathname === paths.home,
      },
      ...(showFleetPlanner
        ? [
            {
              key: 'fleetPlanner',
              label: t('shell.nav.fleetPlanner'),
              icon: <CalendarDays />,
              href: paths.fleetPlanner,
              active: location.pathname.startsWith(paths.fleetPlanner),
            },
          ]
        : []),
      {
        key: 'notifications',
        label: t('shell.nav.notifications'),
        icon: <Bell />,
        href: paths.notifications,
        active: location.pathname === paths.notifications,
      },
      {
        key: 'profile',
        label: t('shell.nav.profile'),
        icon: <User />,
        href: paths.profile,
        active: location.pathname === paths.profile,
      },
      {
        key: 'settings',
        label: t('shell.nav.settings'),
        icon: <Settings />,
        href: paths.settings,
        active: location.pathname === paths.settings,
      },
    ];
    return items;
  }, [location.pathname, showFleetPlanner, t]);

  const showSidebar = isTablet;
  const showBottomNav = !isTablet;

  return (
    <div className="relative flex min-h-dvh w-full overflow-x-hidden bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg"
      >
        {t('shell.nav.skipToContent')}
      </a>
      {showSidebar ? (
        <>
          {!isDesktop && sidebarOpen ? (
            <button
              type="button"
              className="fixed inset-0 z-[90] bg-black/50 lg:hidden"
              aria-label={t('shell.nav.closeMenu')}
              onClick={() => setSidebarOpen(false)}
            />
          ) : null}
          <AppSidebar
            open={isDesktop ? true : sidebarOpen}
            items={navItems}
            onNavigate={(href) => {
              navigate(href);
              setSidebarOpen(false);
            }}
          />
        </>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopNav onMenuClick={() => setSidebarOpen(true)} showMenuButton={showSidebar && !isDesktop} />
        <ConnectionBanner />
        <UpdateBanner />
        <InstallPrompt />
        <main
          className={`min-w-0 flex-1 overflow-x-hidden ${showBottomNav ? 'pb-24' : 'pb-6'}`}
          id="main-content"
          tabIndex={-1}
        >
          <ResponsiveLayout>
            <RouteTransition>{children ?? <Outlet />}</RouteTransition>
          </ResponsiveLayout>
        </main>
        {showBottomNav ? (
          <AppBottomNav
            items={navItems}
            activeHref={location.pathname}
            onNavigate={(href) => navigate(href)}
          />
        ) : null}
      </div>
    </div>
  );
}
