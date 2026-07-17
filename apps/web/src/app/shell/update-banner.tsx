import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@saki-operations/ui';
import { useAppTranslation } from '@saki-operations/i18n';

import { useBootstrap } from '@/app/bootstrap/bootstrap-provider';
import { usePwa } from '@/app/bootstrap/pwa-provider';

/** Service-worker update notification (Phase 9.1). */
export function UpdateBanner() {
  const { snapshot, appVersion } = useBootstrap();
  const { updateAvailable, dismissUpdate, applyUpdate } = usePwa();
  const { t } = useAppTranslation();
  const [dismissed, setDismissed] = useState(false);

  const visible = !dismissed && (updateAvailable || Boolean(snapshot?.versionChanged));

  if (!visible) return null;

  return (
    <div className="border-b border-primary/30 bg-primary/10 px-4 py-3">
      <div className="container-app flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <RefreshCw className="mt-0.5 size-5 text-primary" aria-hidden />
          <div>
            <p className="text-sm font-semibold">{t('shell.pwa.updateTitle')}</p>
            <p className="text-xs text-muted-foreground">
              {t('shell.pwa.updateDescription', { version: appVersion })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => {
              applyUpdate();
              setDismissed(true);
            }}
          >
            {t('shell.pwa.updateAction')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              dismissUpdate();
              setDismissed(true);
            }}
          >
            {t('actions.dismiss')}
          </Button>
        </div>
      </div>
    </div>
  );
}
