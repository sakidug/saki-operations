import type { Control, FieldValues } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from '@saki-operations/ui';

import { FormField } from '../core/form-field';
import type { FormFieldCommonProps, FormSelectOption } from '../types';

type SelectFieldProps<T extends FieldValues> = FormFieldCommonProps<T> & {
  control: Control<T>;
  options: FormSelectOption[];
  placeholder?: string;
};

export function SelectField<T extends FieldValues>({
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
  placeholder = 'Select…',
}: SelectFieldProps<T>) {
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
        <Select
          value={field.value ? String(field.value) : undefined}
          onValueChange={field.onChange}
          disabled={field.disabled || field.readOnly}
        >
          <SelectTrigger
            id={field.id}
            data-field-name={String(name)}
            aria-invalid={field.invalid}
            aria-required={required || undefined}
            aria-describedby={field.describedBy}
            className={cn('h-11', field.invalid && 'border-destructive')}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FormField>
  );
}
