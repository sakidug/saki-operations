import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { Input, cn } from '@saki-operations/ui';

import { FormField, type FormFieldProps } from '../core/form-field';
import type { FormFieldCommonProps } from '../types';

type TextFieldProps<T extends FieldValues> = FormFieldCommonProps<T> & {
  control: Control<T>;
  placeholder?: string;
  autoComplete?: string;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  type?: 'text' | 'search' | 'url' | 'tel';
};

export function TextField<T extends FieldValues>({
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
  autoComplete,
  maxLength,
  inputMode,
  type = 'text',
}: TextFieldProps<T>) {
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
          {...field}
          id={field.id}
          name={String(name)}
          data-field-name={String(name)}
          type={type}
          value={field.value ?? ''}
          placeholder={placeholder}
          autoComplete={autoComplete}
          maxLength={maxLength}
          inputMode={inputMode}
          disabled={field.disabled}
          readOnly={field.readOnly}
          error={field.invalid}
          aria-invalid={field.invalid}
          aria-required={required || undefined}
          aria-describedby={field.describedBy}
          className={cn('h-11', field.readOnly && 'bg-muted/40')}
          onChange={(event) => field.onChange(event.target.value)}
        />
      )}
    </FormField>
  );
}

export type { FormFieldProps, FieldPath };
