import * as React from 'react';

import { cn } from '../lib/utils';

export type BottomNavItem = {
  key: string;
  label: React.ReactNode;
  icon: React.ReactNode;
  href: string;
};

export type BottomNavigationProps = {
  items: BottomNavItem[];
  className?: string;
  /** Prefer client navigation handlers from the app shell. */
  onNavigate?: (href: string) => void;
  activeHref?: string;
  'aria-label': string;
};

/**
 * Mobile-first bottom navigation. Labels and aria-label must be pre-translated.
 */
export function BottomNavigation({
  items,
  className,
  onNavigate,
  activeHref,
  'aria-label': ariaLabel,
}: BottomNavigationProps) {
  return (
    <nav
      className={cn(
        'glass safe-pb fixed inset-x-0 bottom-0 z-[100] border-t border-border/60',
        className,
      )}
      aria-label={ariaLabel}
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2 pt-2">
        {items.map((item) => {
          const active = activeHref === item.href;
          return (
            <li key={item.key} className="flex-1">
              <a
                href={item.href}
                onClick={(event) => {
                  if (onNavigate) {
                    event.preventDefault();
                    onNavigate(item.href);
                  }
                }}
                className={cn(
                  'flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-2 text-[11px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
                aria-current={active ? 'page' : undefined}
              >
                <span className="[&_svg]:size-5">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
