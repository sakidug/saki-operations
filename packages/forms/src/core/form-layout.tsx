import type { ReactNode } from 'react';
import { cn } from '@saki-operations/ui';

export type FormSectionProps = {
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Glassmorphism section used to group fields without inventing module UI.
 */
export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <section className={cn('glass space-y-4 rounded-3xl p-4 sm:p-5 md:p-6', className)}>
      {title || description ? (
        <header className="space-y-1">
          {title ? <h2 className="text-base font-semibold tracking-tight sm:text-lg">{title}</h2> : null}
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export type FormGridProps = {
  children: ReactNode;
  className?: string;
  /** Columns from sm breakpoint. Default 2. */
  columns?: 1 | 2 | 3;
};

/**
 * Responsive field grid — 1 col phone, N cols tablet/desktop.
 */
export function FormGrid({ children, className, columns = 2 }: FormGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 sm:gap-5',
        columns === 2 && 'md:grid-cols-2',
        columns === 3 && 'md:grid-cols-2 xl:grid-cols-3',
        className,
      )}
    >
      {children}
    </div>
  );
}
