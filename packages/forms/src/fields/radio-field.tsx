import type { Control, FieldValues } from 'react-hook-form';
import { RadioGroup, RadioGroupItem, cn } from '@saki-operations/ui';

import { FormField } from '../core/form-field';
import type { FormFieldCommonProps, FormSelectOption } from '../types';

type RadioFieldProps<T extends FieldValues> = FormFieldCommonProps<T> & {
  control: Control<T>;
  options: FormSelectOption[];
  orientation?: 'vertical' | 'horizontal';
};

export function RadioField<T extends FieldValues>({
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
  orientation = 'vertical',
}: RadioFieldProps<T>) {
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
        <RadioGroup
          value={field.value ? String(field.value) : undefined}
          onValueChange={(value) => {
            field.onChange(value);
            field.onBlur();
          }}
          disabled={field.disabled || field.readOnly}
          aria-required={required || undefined}
          aria-invalid={field.invalid}
          aria-describedby={field.describedBy}
          data-field-name={String(name)}
          className={cn(orientation === 'horizontal' && 'grid-flow-col auto-cols-fr')}
        >
          {options.map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm',
                field.value === option.value && 'border-primary bg-primary/5',
                option.disabled && 'cursor-not-allowed opacity-50',
              )}
            >
              <RadioGroupItem
                id={`${field.id}-${option.value}`}
                value={option.value}
                disabled={option.disabled}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </RadioGroup>
      )}
    </FormField>
  );
}
