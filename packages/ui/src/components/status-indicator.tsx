import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../lib/utils';

const statusVariants = cva('inline-flex items-center gap-2 text-xs font-medium', {
  variants: {
    status: {
      online: 'text-success',
      offline: 'text-muted-foreground',
      busy: 'text-warning',
      error: 'text-destructive',
      idle: 'text-info',
    },
  },
  defaultVariants: {
    status: 'online',
  },
});

const dotVariants = cva('size-2 rounded-full', {
  variants: {
    status: {
      online: 'bg-success',
      offline: 'bg-muted-foreground',
      busy: 'bg-warning',
      error: 'bg-destructive',
      idle: 'bg-info',
    },
  },
  defaultVariants: {
    status: 'online',
  },
});

export type StatusIndicatorProps = React.ComponentProps<'span'> &
  VariantProps<typeof statusVariants> & {
    label: React.ReactNode;
    showLabel?: boolean;
  };

export function StatusIndicator({
  className,
  status,
  label,
  showLabel = true,
  ...props
}: StatusIndicatorProps) {
  return (
    <span className={cn(statusVariants({ status }), className)} {...props}>
      <span className={cn(dotVariants({ status }), status === 'online' && 'animate-pulse')} aria-hidden />
      {showLabel ? <span>{label}</span> : <span className="sr-only">{label}</span>}
    </span>
  );
}
