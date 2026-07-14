import type { Control, FieldValues } from 'react-hook-form';
import { Textarea, cn } from '@saki-operations/ui';

import { FormField } from '../core/form-field';
import type { FormFieldCommonProps } from '../types';

type TextAreaFieldProps<T extends FieldValues> = FormFieldCommonProps<T> & {
  control: Control<T>;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
};

export function TextAreaField<T extends FieldValues>({
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
  rows = 4,
  maxLength,
}: TextAreaFieldProps<T>) {
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
        <Textarea
          id={field.id}
          name={String(name)}
          data-field-name={String(name)}
          value={field.value ?? ''}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          disabled={field.disabled}
          readOnly={field.readOnly}
          error={field.invalid}
          aria-invalid={field.invalid}
          aria-required={required || undefined}
          aria-describedby={field.describedBy}
          className={cn(field.readOnly && 'bg-muted/40')}
          onBlur={field.onBlur}
          onChange={(event) => field.onChange(event.target.value)}
          ref={field.ref}
        />
      )}
    </FormField>
  );
}
