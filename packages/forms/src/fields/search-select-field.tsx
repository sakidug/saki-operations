import { useMemo, useState } from 'react';
import type { Control, FieldValues } from 'react-hook-form';
import { Input, cn } from '@saki-operations/ui';

import { FormField } from '../core/form-field';
import type { FormFieldCommonProps, FormSelectOption } from '../types';

type SearchSelectFieldProps<T extends FieldValues> = FormFieldCommonProps<T> & {
  control: Control<T>;
  options: FormSelectOption[];
  placeholder?: string;
  emptyMessage?: string;
};

export function SearchSelectField<T extends FieldValues>({
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
  placeholder = 'Search and select…',
  emptyMessage = 'No matches',
}: SearchSelectFieldProps<T>) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((option) => String(option.label).toLowerCase().includes(q));
  }, [options, query]);

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
        const selected = options.find((option) => option.value === field.value);

        return (
          <div className="relative">
            <Input
              id={field.id}
              name={String(name)}
              data-field-name={String(name)}
              role="combobox"
              aria-expanded={open}
              aria-controls={`${field.id}-listbox`}
              aria-autocomplete="list"
              aria-invalid={field.invalid}
              aria-required={required || undefined}
              aria-describedby={field.describedBy}
              value={open ? query : selected ? String(selected.label) : query}
              placeholder={placeholder}
              disabled={field.disabled}
              readOnly={field.readOnly}
              error={field.invalid}
              className={cn('h-11', field.readOnly && 'bg-muted/40')}
              onFocus={() => {
                if (field.readOnly) return;
                setOpen(true);
                setQuery('');
              }}
              onBlur={() => {
                window.setTimeout(() => setOpen(false), 150);
                field.onBlur();
              }}
              onChange={(event) => {
                setQuery(event.target.value);
                setOpen(true);
              }}
              ref={field.ref}
            />
            {open && !field.readOnly ? (
              <ul
                id={`${field.id}-listbox`}
                role="listbox"
                className="absolute z-[400] mt-1 max-h-52 w-full overflow-auto rounded-xl border border-border bg-popover p-1 shadow-lg"
              >
                {filtered.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-muted-foreground">{emptyMessage}</li>
                ) : (
                  filtered.map((option) => (
                    <li key={option.value} role="option" aria-selected={field.value === option.value}>
                      <button
                        type="button"
                        className={cn(
                          'flex w-full flex-col rounded-lg px-3 py-2 text-left text-sm hover:bg-accent',
                          field.value === option.value && 'bg-accent',
                        )}
                        disabled={option.disabled}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          field.onChange(option.value);
                          setQuery('');
                          setOpen(false);
                        }}
                      >
                        <span className="font-medium">{option.label}</span>
                        {option.description ? (
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        ) : null}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            ) : null}
          </div>
        );
      }}
    </FormField>
  );
}
