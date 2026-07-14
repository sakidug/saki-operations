import type { Control, FieldValues } from 'react-hook-form';
import { Input, cn } from '@saki-operations/ui';

import { FormField } from '../core/form-field';
import type { FormFieldCommonProps } from '../types';

type NumberFieldProps<T extends FieldValues> = FormFieldCommonProps<T> & {
  control: Control<T>;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  prefix?: string;
};

export function NumberField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  disabled,
  readOnly,
  className,
  hideError,
  placeholder,
  min,
  max,
  step,
  suffix,
  prefix,
}: NumberFieldProps<T>) {
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
      {(field) => (
        <div className="relative">
          {prefix ? (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {prefix}
            </span>
          ) : null}
          <Input
            id={field.id}
            name={String(name)}
            data-field-name={String(name)}
            type="number"
            inputMode="decimal"
            value={field.value ?? ''}
            placeholder={placeholder}
            min={min}
            max={max}
            step={step}
            disabled={field.disabled}
            readOnly={field.readOnly}
            error={field.invalid}
            aria-invalid={field.invalid}
            aria-required={required || undefined}
            aria-describedby={field.describedBy}
            className={cn(
              'h-11',
              prefix && 'pl-10',
              suffix && 'pr-12',
              field.readOnly && 'bg-muted/40',
            )}
            onBlur={field.onBlur}
            onChange={(event) => {
              const raw = event.target.value;
              field.onChange(raw === '' ? undefined : Number(raw));
            }}
            ref={field.ref}
          />
          {suffix ? (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {suffix}
            </span>
          ) : null}
        </div>
      )}
    </FormField>
  );
}
