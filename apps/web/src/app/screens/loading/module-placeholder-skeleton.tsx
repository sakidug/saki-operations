import { Skeleton } from '@saki-operations/ui';
import { useAppTranslation } from '@saki-operations/i18n';

import { FadeIn } from '@/app/screens/loading/fade-in';

/** Future module route loading shell. */
export function ModulePlaceholderSkeleton({ title }: { title?: string }) {
  const { t } = useAppTranslation();

  return (
    <FadeIn>
      <div
        className="mx-auto w-full max-w-2xl space-y-4"
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={title ? `${t('shell.loading.module')}: ${title}` : t('shell.loading.module')}
      >
        <div className="glass space-y-4 rounded-3xl p-6 sm:p-8">
          <Skeleton shape="circle" className="mx-auto size-12" />
          <Skeleton shape="text" className="mx-auto h-6 w-48" />
          <Skeleton shape="text" className="mx-auto h-4 w-72 max-w-full" />
          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        </div>
      </div>
    </FadeIn>
  );
}
