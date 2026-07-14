import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useAppTranslation } from '@saki-operations/i18n';

import { FadeIn } from '@/app/screens/loading/fade-in';

/**
 * Indicates in-app route transitions so content never flashes blank.
 * Shows a slim top progress cue and fades the new page in.
 */
export function RouteTransition({ children }: { children: ReactNode }) {
  const { t } = useAppTranslation();
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setPending(true);
    const duration = reduceMotion ? 0 : 220;
    const timer = window.setTimeout(() => setPending(false), duration);
    return () => window.clearTimeout(timer);
  }, [location.pathname, reduceMotion]);

  return (
    <div className="relative min-h-full">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-0.5 overflow-hidden"
        aria-hidden={!pending}
      >
        <motion.div
          className="h-full origin-left bg-primary"
          initial={false}
          animate={
            pending
              ? reduceMotion
                ? { opacity: 1, scaleX: 1 }
                : { opacity: 1, scaleX: [0.15, 0.85] }
              : { opacity: 0, scaleX: 1 }
          }
          transition={
            reduceMotion
              ? { duration: 0 }
              : pending
                ? { duration: 0.45, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' }
                : { duration: 0.2 }
          }
          style={{ transformOrigin: 'left center' }}
        />
      </div>

      {pending ? (
        <span className="sr-only" role="status" aria-live="polite">
          {t('shell.loading.route')}
        </span>
      ) : null}

      <FadeIn key={location.pathname}>{children}</FadeIn>
    </div>
  );
}
