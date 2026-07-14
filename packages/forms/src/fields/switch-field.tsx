import type { Control, FieldValues } from 'react-hook-form';
import { Switch, cn } from '@saki-operations/ui';

import { FormField } from '../core/form-field';
import type { FormFieldCommonProps } from '../types';

type SwitchFieldProps<T extends FieldValues> = FormFieldCommonProps<T> & {
  control: Control<T>;
};

export function SwitchField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  disabled,
  readOnly,
  className,
  hideError,
}: SwitchFieldProps<T>) {
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
        <div
          className={cn(
            'flex items-center justify-between gap-4 rounded-xl border border-border px-3 py-3',
            field.invalid && 'border-destructive',
          )}
        >
          <label htmlFor={field.id} className="text-sm font-medium">
            {label}
            {required ? <span className="text-destructive"> *</span> : null}
          </label>
          <Switch
            id={field.id}
            name={String(name)}
            data-field-name={String(name)}
            checked={Boolean(field.value)}
            disabled={field.disabled || field.readOnly}
            aria-invalid={field.invalid}
            aria-required={required || undefined}
            aria-describedby={field.describedBy}
            onCheckedChange={(checked) => {
              field.onChange(checked);
              field.onBlur();
            }}
            ref={field.ref}
          />
        </div>
      )}
    </FormField>
  );
}
