import { useMemo, useState } from 'react';
import type { Control, FieldValues } from 'react-hook-form';
import { Checkbox, Input, cn } from '@saki-operations/ui';

import { FormField } from '../core/form-field';
import type { FormFieldCommonProps, FormSelectOption } from '../types';

type MultiSelectFieldProps<T extends FieldValues> = FormFieldCommonProps<T> & {
  control: Control<T>;
  options: FormSelectOption[];
  searchable?: boolean;
  searchPlaceholder?: string;
};

export function MultiSelectField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  disabled,
  readOnly,
  className,
  hideError,
  options,
  searchable = false,
  searchPlaceholder = 'Search…',
}: MultiSelectFieldProps<T>) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((option) => String(option.label).toLowerCase().includes(q));
  }, [options, query, searchable]);

  return (
    <FormField
      control={control}
      name={name}
      label={label}
      description={description}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      className={className}
      hideError={hideError}
    >
      {(field) => {
        const selected = Array.isArray(field.value) ? (field.value as string[]) : [];
        return (
          <div
            className={cn(
              'glass space-y-2 rounded-xl border border-border p-3',
              field.invalid && 'border-destructive',
            )}
            role="group"
            aria-labelledby={field.id}
            data-field-name={String(name)}
          >
            <span id={field.id} className="sr-only">
              {typeof label === 'string' ? label : String(name)}
            </span>
            {searchable ? (
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                disabled={field.disabled}
                className="h-10"
                aria-label={searchPlaceholder}
              />
            ) : null}
            <ul className="max-h-48 space-y-1 overflow-y-auto">
              {filtered.map((option) => {
                const checked = selected.includes(option.value);
                return (
                  <li key={option.value}>
                    <label
                      className={cn(
                        'flex cursor-pointer items-start gap-2 rounded-lg px-2 py-2 text-sm hover:bg-accent/60',
                        option.disabled && 'cursor-not-allowed opacity-50',
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        disabled={field.disabled || field.readOnly || option.disabled}
                        onCheckedChange={(next) => {
                          const on = next === true;
                          field.onChange(
                            on
                              ? [...selected, option.value]
                              : selected.filter((value) => value !== option.value),
                          );
                          field.onBlur();
                        }}
                      />
                      <span>
                        <span className="font-medium">{option.label}</span>
                        {option.description ? (
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      }}
    </FormField>
  );
}
