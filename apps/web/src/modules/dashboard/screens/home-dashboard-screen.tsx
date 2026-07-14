import { useAppTranslation } from '@saki-operations/i18n';
import type { AppRole } from '@saki-operations/types';

import { useSession } from '@/app/bootstrap/session-provider';
import { FadeIn } from '@/app/screens/loading/fade-in';
import { DashboardSkeleton } from '@/app/screens/loading/dashboard-skeleton';
import { HomeHeader } from '@/modules/dashboard/components/home-header';
import { HomeModuleCards } from '@/modules/dashboard/components/home-module-cards';
import { HomeQuickActions } from '@/modules/dashboard/components/home-quick-actions';
import { HomeStatusArea } from '@/modules/dashboard/components/home-status-area';

function roleLabelKey(role: AppRole): string {
  return `roles.${role}`;
}

/**
 * Post-auth Home Dashboard — premium landing for module entry.
 * Does not implement Tours / HHCO / Office business screens.
 */
export function HomeDashboardScreen() {
  const { t } = useAppTranslation();
  const { user } = useSession();

  if (!user) {
    return <DashboardSkeleton />;
  }

  return (
    <FadeIn className="mx-auto flex w-full max-w-5xl flex-col gap-5 sm:gap-6 lg:gap-7">
      <HomeHeader
        displayName={user.displayName}
        roleLabel={t(roleLabelKey(user.role))}
      />
      <HomeStatusArea pendingSyncCount={0} />
      <HomeModuleCards />
      <HomeQuickActions />
    </FadeIn>
  );
}
