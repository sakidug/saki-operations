import type { Control, FieldValues } from 'react-hook-form';
import { Checkbox, cn } from '@saki-operations/ui';

import { FormField } from '../core/form-field';
import type { FormFieldCommonProps } from '../types';

type CheckboxFieldProps<T extends FieldValues> = FormFieldCommonProps<T> & {
  control: Control<T>;
};

export function CheckboxField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  disabled,
  readOnly,
  className,
  hideError,
}: CheckboxFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      description={description}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      className={className}
      hideError={hideError}
    >
      {(field) => (
        <label
          htmlFor={field.id}
          className={cn(
            'flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background/40 px-3 py-3',
            field.invalid && 'border-destructive',
            (field.disabled || field.readOnly) && 'cursor-not-allowed opacity-70',
          )}
        >
          <Checkbox
            id={field.id}
            name={String(name)}
            data-field-name={String(name)}
            checked={Boolean(field.value)}
            disabled={field.disabled || field.readOnly}
            aria-invalid={field.invalid}
            aria-required={required || undefined}
            aria-describedby={field.describedBy}
            onCheckedChange={(checked) => {
              field.onChange(checked === true);
              field.onBlur();
            }}
            ref={field.ref}
          />
          <span className="space-y-1 text-sm">
            <span className="font-medium leading-none">
              {label}
              {required ? <span className="text-destructive"> *</span> : null}
            </span>
          </span>
        </label>
      )}
    </FormField>
  );
}
