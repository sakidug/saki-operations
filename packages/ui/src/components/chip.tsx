import { X } from 'lucide-react';
import * as React from 'react';

import { cn } from '../lib/utils';

export type ChipProps = {
  selected?: boolean;
  onRemove?: () => void;
  removeLabel?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
};

export function Chip({
  className,
  selected,
  onRemove,
  removeLabel,
  children,
  onClick,
  disabled,
}: ChipProps) {
  return (
    <div
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        selected
          ? 'border-primary/40 bg-primary/15 text-primary'
          : 'border-border bg-muted/40 text-foreground',
        disabled && 'opacity-50',
        className,
      )}
    >
      <button
        type="button"
        className="truncate"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={selected}
      >
        {children}
      </button>
      {onRemove ? (
        <button
          type="button"
          aria-label={removeLabel}
          className="rounded-full p-0.5 hover:bg-foreground/10"
          onClick={onRemove}
          disabled={disabled}
        >
          <X className="size-3" />
        </button>
      ) : null}
    </div>
  );
}
