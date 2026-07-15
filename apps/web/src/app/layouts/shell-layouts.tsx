import type { ReactNode } from 'react';

import { cn } from '@saki-operations/ui';

export type LayoutProps = {
  children: ReactNode;
  className?: string;
};

/** Centered layout for login and related auth screens (Phase 4). */
export function AuthenticationLayout({ children, className }: LayoutProps) {
  return (
    <div
      className={cn(
        'relative flex min-h-dvh w-full items-center justify-center overflow-x-hidden bg-background px-4 py-8',
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.18),_transparent_55%)]"
      />
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}

/** Full-bleed layout for splash, language, and immersive flows. */
export function FullScreenLayout({ children, className }: LayoutProps) {
  return (
    <div className={cn('relative min-h-dvh w-full overflow-x-hidden bg-background', className)}>
      {children}
    </div>
  );
}

/** Error / status pages with constrained readable width. */
export function ErrorLayout({ children, className }: LayoutProps) {
  return (
    <div
      className={cn(
        'flex min-h-dvh w-full items-center justify-center overflow-x-hidden bg-background px-4 py-10',
        className,
      )}
    >
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );
}

/** Responsive page container used inside application chrome. */
export function ResponsiveLayout({ children, className }: LayoutProps) {
  return (
    <div className={cn('container-app w-full max-w-full overflow-x-hidden py-3 sm:py-6', className)}>
      {children}
    </div>
  );
}
