import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { Input, cn } from '@saki-operations/ui';

export type SelectorShellProps = {
  label?: ReactNode;
  description?: ReactNode;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
  listLabel: string;
};

/**
 * Shared glass shell: search + optional toolbar + scrollable results.
 */
export function SelectorShell({
  label,
  description,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  toolbar,
  children,
  className,
  listLabel,
}: SelectorShellProps) {
  return (
    <section
      className={cn('glass flex w-full min-w-0 flex-col gap-3 rounded-3xl p-3 sm:gap-4 sm:p-4 md:p-5', className)}
      aria-label={typeof label === 'string' ? label : listLabel}
    >
      {(label || description) && (
        <header className="space-y-1 px-1">
          {label ? <h3 className="text-base font-semibold tracking-tight sm:text-lg">{label}</h3> : null}
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </header>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-11 pl-9"
            aria-label={searchPlaceholder}
            type="search"
            autoComplete="off"
          />
        </div>
        {toolbar ? <div className="flex shrink-0 flex-wrap gap-2">{toolbar}</div> : null}
      </div>

      <div
        role="listbox"
        aria-label={listLabel}
        className="max-h-[min(28rem,60vh)] overflow-y-auto overscroll-contain rounded-2xl border border-border/60 bg-background/30 p-2 sm:max-h-[min(32rem,65vh)]"
      >
        {children}
      </div>
    </section>
  );
}
