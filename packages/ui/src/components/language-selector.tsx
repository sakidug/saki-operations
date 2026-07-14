import { Languages } from 'lucide-react';
import * as React from 'react';

import { cn } from '../lib/utils';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from './dropdown';

export type LanguageOption = {
  code: string;
  label: React.ReactNode;
  flag?: React.ReactNode;
};

export type LanguageSelectorProps = {
  value: string;
  options: LanguageOption[];
  onChange: (code: string) => void;
  label: string;
  className?: string;
};

/**
 * Language selector chrome. Pass translated option labels from i18n.
 */
export function LanguageSelector({
  value,
  options,
  onChange,
  label,
  className,
}: LanguageSelectorProps) {
  const current = options.find((option) => option.code === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn('gap-2', className)}
          aria-label={label}
        >
          <Languages className="size-4" />
          <span className="max-w-28 truncate">{current?.label ?? value}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.code} value={option.code}>
              <span className="mr-2">{option.flag}</span>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
