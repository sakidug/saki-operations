import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../lib/utils';

const notificationVariants = cva(
  'glass flex w-full gap-3 rounded-xl p-4 text-left transition-colors',
  {
    variants: {
      tone: {
        default: '',
        success: 'border-success/30',
        warning: 'border-warning/30',
        danger: 'border-destructive/30',
        info: 'border-info/30',
      },
    },
    defaultVariants: {
      tone: 'default',
    },
  },
);

export type NotificationCardProps = React.ComponentProps<'article'> &
  VariantProps<typeof notificationVariants> & {
    title: React.ReactNode;
    description?: React.ReactNode;
    meta?: React.ReactNode;
    icon?: React.ReactNode;
    unread?: boolean;
    actions?: React.ReactNode;
  };

export function NotificationCard({
  className,
  tone,
  title,
  description,
  meta,
  icon,
  unread,
  actions,
  ...props
}: NotificationCardProps) {
  return (
    <article
      className={cn(notificationVariants({ tone }), unread && 'ring-1 ring-primary/40', className)}
      {...props}
    >
      {icon ? <div className="mt-0.5 shrink-0 text-primary">{icon}</div> : null}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-sm font-semibold">{title}</h3>
          {unread ? (
            <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" aria-hidden />
          ) : null}
        </div>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        {meta ? <p className="text-xs text-muted-foreground">{meta}</p> : null}
        {actions ? <div className="pt-2">{actions}</div> : null}
      </div>
    </article>
  );
}
