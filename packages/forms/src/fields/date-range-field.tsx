import type { Control, FieldValues } from 'react-hook-form';
import { Input, cn } from '@saki-operations/ui';

import { FormField } from '../core/form-field';
import type { DateRangeValue, FormFieldCommonProps } from '../types';

type DateRangeFieldProps<T extends FieldValues> = FormFieldCommonProps<T> & {
  control: Control<T>;
  fromLabel?: string;
  toLabel?: string;
};

export function DateRangeField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  disabled,
  readOnly,
  className,
  hideError,
  fromLabel = 'From',
  toLabel = 'To',
}: DateRangeFieldProps<T>) {
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
        const value = (field.value ?? { from: '', to: '' }) as DateRangeValue;
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
              <span>{fromLabel}</span>
              <Input
                id={`${field.id}-from`}
                name={`${String(name)}.from`}
                data-field-name={`${String(name)}.from`}
                type="date"
                value={value.from ?? ''}
                disabled={field.disabled}
                readOnly={field.readOnly}
                error={field.invalid}
                aria-invalid={field.invalid}
                className={cn('h-11', field.readOnly && 'bg-muted/40')}
                onBlur={field.onBlur}
                onChange={(event) =>
                  field.onChange({ ...value, from: event.target.value } satisfies DateRangeValue)
                }
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
              <span>{toLabel}</span>
              <Input
                id={`${field.id}-to`}
                name={`${String(name)}.to`}
                data-field-name={`${String(name)}.to`}
                type="date"
                value={value.to ?? ''}
                min={value.from || undefined}
                disabled={field.disabled}
                readOnly={field.readOnly}
                error={field.invalid}
                aria-invalid={field.invalid}
                className={cn('h-11', field.readOnly && 'bg-muted/40')}
                onBlur={field.onBlur}
                onChange={(event) =>
                  field.onChange({ ...value, to: event.target.value } satisfies DateRangeValue)
                }
              />
            </label>
          </div>
        );
      }}
    </FormField>
  );
}
