import * as React from 'react';

import { cn } from '../lib/utils';

export type SidebarItem = {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  href: string;
  active?: boolean;
};

export type SidebarProps = {
  title: React.ReactNode;
  items: SidebarItem[];
  footer?: React.ReactNode;
  onNavigate?: (href: string) => void;
  className?: string;
  'aria-label': string;
  open?: boolean;
};

export function Sidebar({
  title,
  items,
  footer,
  onNavigate,
  className,
  'aria-label': ariaLabel,
  open = true,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        'glass fixed inset-y-0 left-0 z-[100] flex w-72 max-w-[85vw] flex-col border-r border-border/60 transition-transform duration-300 lg:static lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
        className,
      )}
      aria-label={ariaLabel}
    >
      <div className="border-b border-border/60 px-4 py-4 text-sm font-semibold">{title}</div>
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.key}>
              <a
                href={item.href}
                onClick={(event) => {
                  if (onNavigate) {
                    event.preventDefault();
                    onNavigate(item.href);
                  }
                }}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  item.active
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
                aria-current={item.active ? 'page' : undefined}
              >
                {item.icon ? <span className="[&_svg]:size-4">{item.icon}</span> : null}
                <span className="truncate">{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {footer ? <div className="border-t border-border/60 p-3">{footer}</div> : null}
    </aside>
  );
}
