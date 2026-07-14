import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

import { cn } from '@saki-operations/ui';

import { fadeUpTransition } from '@/lib/motion';

export type FadeInProps = {
  children: ReactNode;
  className?: string;
  /** Delay in seconds. Ignored when reduced motion is preferred. */
  delay?: number;
};

/**
 * Smooth content entrance. Opacity-only when reduced motion is preferred.
 */
export function FadeIn({ children, className, delay = 0 }: FadeInProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(className)}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={fadeUpTransition(reduceMotion, delay)}
    >
      {children}
    </motion.div>
  );
}
