import { Menu } from 'lucide-react';
import * as React from 'react';

import { cn } from '../lib/utils';
import { Button } from './button';

export type TopNavigationProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onMenuClick?: () => void;
  menuLabel: string;
  className?: string;
  showMenuButton?: boolean;
};

export function TopNavigation({
  title,
  subtitle,
  leading,
  trailing,
  onMenuClick,
  menuLabel,
  className,
  showMenuButton = true,
}: TopNavigationProps) {
  return (
    <header
      className={cn(
        'glass safe-pt sticky top-0 z-[100] border-b border-border/60',
        className,
      )}
    >
      <div className="container-app flex min-h-12 items-center gap-2.5 py-1.5 sm:gap-3 sm:py-2">
        {showMenuButton ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={onMenuClick}
            aria-label={menuLabel}
          >
            <Menu />
          </Button>
        ) : null}
        {leading}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold sm:text-base">{title}</div>
          {subtitle ? (
            <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
          ) : null}
        </div>
        {trailing ? <div className="flex shrink-0 items-center gap-2">{trailing}</div> : null}
      </div>
    </header>
  );
}
