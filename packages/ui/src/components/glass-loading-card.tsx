import type { ReactNode } from 'react';

import { cn } from '../lib/utils';
import { LoadingSpinner } from './loading-spinner';

export type GlassLoadingCardProps = {
  label: string;
  message?: ReactNode;
  children?: ReactNode;
  className?: string;
  /** Show spinner above optional children. Default true. */
  showSpinner?: boolean;
};

/**
 * Premium glass loading surface for full-screen and inline wait states.
 */
export function GlassLoadingCard({
  label,
  message,
  children,
  className,
  showSpinner = true,
}: GlassLoadingCardProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
      className={cn(
        'glass flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl px-8 py-10 text-center shadow-lg',
        className,
      )}
    >
      {children}
      {showSpinner ? <LoadingSpinner label={label} size="lg" /> : null}
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
