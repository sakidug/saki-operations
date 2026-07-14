import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../lib/utils';

const skeletonVariants = cva('rounded-md bg-muted motion-safe:animate-pulse', {
  variants: {
    shape: {
      rect: '',
      circle: 'rounded-full',
      text: 'h-4 w-full',
    },
  },
  defaultVariants: {
    shape: 'rect',
  },
});

export type SkeletonProps = React.ComponentProps<'div'> & VariantProps<typeof skeletonVariants>;

export function Skeleton({ className, shape, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(skeletonVariants({ shape }), className)}
      aria-hidden
      {...props}
    />
  );
}

export function SkeletonLoader({
  lines = 3,
  className,
  label,
}: {
  lines?: number;
  className?: string;
  label: string;
}) {
  return (
    <div className={cn('space-y-3', className)} role="status" aria-label={label} aria-live="polite">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} shape="text" className={index === lines - 1 ? 'w-2/3' : 'w-full'} />
      ))}
    </div>
  );
}
