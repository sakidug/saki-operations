import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@saki-operations/ui';
import { useAppTranslation } from '@saki-operations/i18n';

import { useBootstrap } from '@/app/bootstrap/bootstrap-provider';
import { usePwa } from '@/app/bootstrap/pwa-provider';

/** Future update notification slot — ready for service worker updates later. */
export function UpdateBanner() {
  const { snapshot, appVersion } = useBootstrap();
  const { updateAvailable, dismissUpdate } = usePwa();
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
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => {
            dismissUpdate();
            setDismissed(true);
          }}
        >
          {t('actions.confirm')}
        </Button>
      </div>
    </div>
  );
}
