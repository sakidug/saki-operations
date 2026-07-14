import { Loader2 } from 'lucide-react';
import * as React from 'react';

import { cn } from '../lib/utils';
import { iconSizes } from '../tokens';

export type LoadingSpinnerProps = {
  size?: keyof typeof iconSizes;
  className?: string;
  label: string;
};

export function LoadingSpinner({ size = 'md', className, label }: LoadingSpinnerProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn('inline-flex items-center justify-center text-primary', className)}
    >
      <Loader2
        className="animate-spin"
        size={iconSizes[size]}
        aria-hidden
      />
    </span>
  );
}
