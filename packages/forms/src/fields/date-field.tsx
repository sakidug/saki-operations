import type { Control, FieldValues } from 'react-hook-form';
import { Input, cn } from '@saki-operations/ui';

import { FormField } from '../core/form-field';
import type { FormFieldCommonProps } from '../types';

type DateFieldProps<T extends FieldValues> = FormFieldCommonProps<T> & {
  control: Control<T>;
  min?: string;
  max?: string;
};

export function DateField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  disabled,
  readOnly,
  className,
  hideError,
  min,
  max,
}: DateFieldProps<T>) {
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
        <Input
          id={field.id}
          name={String(name)}
          data-field-name={String(name)}
          type="date"
          value={field.value ?? ''}
          min={min}
          max={max}
          disabled={field.disabled}
          readOnly={field.readOnly}
          error={field.invalid}
          aria-invalid={field.invalid}
          aria-required={required || undefined}
          aria-describedby={field.describedBy}
          className={cn('h-11', field.readOnly && 'bg-muted/40')}
          onBlur={field.onBlur}
          onChange={(event) => field.onChange(event.target.value)}
          ref={field.ref}
        />
      )}
    </FormField>
  );
}
