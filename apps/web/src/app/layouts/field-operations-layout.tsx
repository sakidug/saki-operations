import { Outlet } from 'react-router-dom';

import { FullScreenLayout, ResponsiveLayout } from '@/app/layouts/shell-layouts';
import { ConnectionBanner } from '@/app/shell/connection-banner';
import { InstallPrompt } from '@/app/shell/install-prompt';
import { UpdateBanner } from '@/app/shell/update-banner';

/**
 * Minimal chrome for guest field operations (no admin nav).
 */
export function FieldOperationsLayout() {
  return (
    <FullScreenLayout>
      <ConnectionBanner />
      <UpdateBanner />
      <ResponsiveLayout className="pb-8">
        <Outlet />
      </ResponsiveLayout>
      <InstallPrompt />
    </FullScreenLayout>
  );
}
