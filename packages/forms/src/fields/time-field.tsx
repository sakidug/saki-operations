import type { Control, FieldValues } from 'react-hook-form';
import { Input, cn } from '@saki-operations/ui';

import { FormField } from '../core/form-field';
import type { FormFieldCommonProps } from '../types';

type TimeFieldProps<T extends FieldValues> = FormFieldCommonProps<T> & {
  control: Control<T>;
  step?: number;
};

export function TimeField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  disabled,
  readOnly,
  className,
  hideError,
  step = 60,
}: TimeFieldProps<T>) {
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
          type="time"
          step={step}
          value={field.value ?? ''}
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
