import { Bell, Settings, UserRound } from 'lucide-react';
import { Badge, Card, cn } from '@saki-operations/ui';
import { useAppTranslation } from '@saki-operations/i18n';

import { FadeIn } from '@/app/screens/loading/fade-in';
import { useSession } from '@/app/bootstrap/session-provider';

type ShellReadyScreenProps = {
  kind: 'notifications' | 'profile' | 'settings';
};

/**
 * Intentional shell screens for areas not yet built as full modules.
 * Uses existing session data only — no new product features.
 */
export function ShellReadyScreen({ kind }: ShellReadyScreenProps) {
  const { t } = useAppTranslation();
  const { user } = useSession();

  const icon =
    kind === 'notifications' ? (
      <Bell className="size-6" aria-hidden />
    ) : kind === 'profile' ? (
      <UserRound className="size-6" aria-hidden />
    ) : (
      <Settings className="size-6" aria-hidden />
    );

  return (
    <FadeIn className="mx-auto flex w-full max-w-lg flex-col gap-5">
      <header className="space-y-2">
        <Badge variant="secondary" className="rounded-md">
          {t(`shell.ready.${kind}.badge`)}
        </Badge>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {t(`shell.ready.${kind}.title`)}
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          {t(`shell.ready.${kind}.description`)}
        </p>
      </header>

      <Card variant="glass" padding="lg" className="space-y-4">
        <div
          className={cn(
            'flex size-12 items-center justify-center rounded-2xl',
            'bg-primary/10 text-primary',
          )}
        >
          {icon}
        </div>

        {kind === 'profile' && user ? (
          <dl className="grid gap-3 text-sm">
            <div className="rounded-xl bg-muted/40 px-3 py-2.5">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {t('shell.ready.profile.name')}
              </dt>
              <dd className="mt-1 font-semibold text-foreground">{user.displayName}</dd>
            </div>
            <div className="rounded-xl bg-muted/40 px-3 py-2.5">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {t('shell.ready.profile.employeeId')}
              </dt>
              <dd className="mt-1 font-mono text-base font-semibold text-foreground">
                {user.employeeId}
              </dd>
            </div>
            <div className="rounded-xl bg-muted/40 px-3 py-2.5">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {t('shell.ready.profile.role')}
              </dt>
              <dd className="mt-1 font-semibold capitalize text-foreground">{user.role}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">{t(`shell.ready.${kind}.body`)}</p>
        )}

        <p className="text-xs text-muted-foreground">{t('shell.ready.footnote')}</p>
      </Card>
    </FadeIn>
  );
}
