import { Skeleton } from '@saki-operations/ui';
import { useAppTranslation } from '@saki-operations/i18n';

import { FadeIn } from '@/app/screens/loading/fade-in';

/** Auth form skeleton used while login chrome prepares. */
export function AuthFormSkeleton() {
  const { t } = useAppTranslation();

  return (
    <FadeIn>
      <div
        className="glass w-full space-y-6 rounded-3xl p-6 sm:p-8"
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={t('shell.loading.authentication')}
      >
        <div className="mx-auto space-y-2 text-center">
          <Skeleton shape="text" className="mx-auto h-7 w-48" />
          <Skeleton shape="text" className="mx-auto h-4 w-64" />
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton shape="text" className="h-4 w-32" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton shape="text" className="h-4 w-24" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      </div>
    </FadeIn>
  );
}
