import { Download } from 'lucide-react';
import { Button } from '@saki-operations/ui';
import { useAppTranslation } from '@saki-operations/i18n';

import { usePwa } from '@/app/bootstrap/pwa-provider';

export function InstallPrompt() {
  const { canInstall, promptInstall, dismissInstall } = usePwa();
  const { t } = useAppTranslation();

  if (!canInstall) return null;

  return (
    <div className="border-b border-border/60 bg-card/80 px-4 py-3 backdrop-blur">
      <div className="container-app flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/15 p-2 text-primary">
            <Download className="size-5" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold">{t('shell.pwa.installTitle')}</p>
            <p className="text-xs text-muted-foreground sm:text-sm">{t('shell.pwa.installDescription')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={dismissInstall}>
            {t('actions.close')}
          </Button>
          <Button type="button" size="sm" onClick={() => void promptInstall()}>
            {t('shell.pwa.installAction')}
          </Button>
        </div>
      </div>
    </div>
  );
}
