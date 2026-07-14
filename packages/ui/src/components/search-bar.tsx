import { Search, X } from 'lucide-react';
import * as React from 'react';

import { cn } from '../lib/utils';
import { Input } from './input';
import { Button } from './button';

export type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  clearLabel: string;
  className?: string;
  onSubmit?: (value: string) => void;
};

export function SearchBar({
  value,
  onChange,
  placeholder,
  clearLabel,
  className,
  onSubmit,
}: SearchBarProps) {
  return (
    <form
      className={cn('relative w-full', className)}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.(value);
      }}
      role="search"
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 pl-9 pr-10"
        aria-label={placeholder}
      />
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute right-1.5 top-1/2 -translate-y-1/2"
          onClick={() => onChange('')}
          aria-label={clearLabel}
        >
          <X />
        </Button>
      ) : null}
    </form>
  );
}
