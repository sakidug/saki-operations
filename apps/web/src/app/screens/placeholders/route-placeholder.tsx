import { useEffect, useState } from 'react';
import { Construction } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import { EmptyState } from '@saki-operations/ui';
import { useAppTranslation } from '@saki-operations/i18n';

import { FadeIn } from '@/app/screens/loading/fade-in';
import { ModulePlaceholderSkeleton } from '@/app/screens/loading/module-placeholder-skeleton';

/**
 * Route placeholder for screens not built yet.
 * Shows a glass module skeleton briefly so navigation never renders blank.
 */
export function RoutePlaceholder({ titleKey }: { titleKey: string }) {
  const { t } = useAppTranslation();
  const reduceMotion = useReducedMotion();
  const title = t(titleKey);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    const timer = window.setTimeout(() => setReady(true), reduceMotion ? 0 : 180);
    return () => window.clearTimeout(timer);
  }, [titleKey, reduceMotion]);

  if (!ready) {
    return <ModulePlaceholderSkeleton title={title} />;
  }

  return (
    <FadeIn>
      <EmptyState
        icon={<Construction aria-hidden />}
        title={title}
        description={t('shell.placeholder.description')}
        className="glass min-h-[16rem] border-solid sm:min-h-[18rem]"
      />
    </FadeIn>
  );
}
