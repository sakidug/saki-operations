import { Skeleton } from '@saki-operations/ui';
import { useAppTranslation } from '@saki-operations/i18n';

import { FadeIn } from '@/app/screens/loading/fade-in';

/** Dashboard layout placeholders while session user resolves. */
export function DashboardSkeleton() {
  const { t } = useAppTranslation();

  return (
    <FadeIn className="mx-auto flex w-full max-w-5xl flex-col gap-5 sm:gap-6 lg:gap-7">
      <div role="status" aria-live="polite" aria-busy="true" aria-label={t('shell.loading.dashboard')}>
        <div className="glass space-y-4 rounded-3xl p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <Skeleton shape="circle" className="size-14 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton shape="text" className="h-5 w-40" />
              <Skeleton shape="text" className="h-4 w-28" />
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="glass space-y-2 rounded-2xl p-4">
              <Skeleton shape="text" className="h-3 w-16" />
              <Skeleton shape="text" className="h-5 w-20" />
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="glass min-h-[13.5rem] space-y-3 rounded-3xl p-5">
              <Skeleton shape="circle" className="size-10" />
              <Skeleton shape="text" className="h-5 w-2/3" />
              <Skeleton shape="text" className="h-4 w-full" />
              <Skeleton shape="text" className="h-4 w-4/5" />
            </div>
          ))}
        </div>

        <div className="mt-5 glass flex flex-wrap gap-2 rounded-2xl p-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-24 rounded-lg" />
          ))}
        </div>
      </div>
    </FadeIn>
  );
}
