import { useState } from 'react';
import type { Control, FieldValues } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { Button, Input, cn } from '@saki-operations/ui';

import { FormField } from '../core/form-field';
import type { FormFieldCommonProps } from '../types';

type PasswordFieldProps<T extends FieldValues> = FormFieldCommonProps<T> & {
  control: Control<T>;
  placeholder?: string;
  autoComplete?: string;
};

export function PasswordField<T extends FieldValues>({
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
  autoComplete = 'current-password',
}: PasswordFieldProps<T>) {
  const [visible, setVisible] = useState(false);

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
          <Input
            id={field.id}
            name={String(name)}
            data-field-name={String(name)}
            type={visible ? 'text' : 'password'}
            value={field.value ?? ''}
            placeholder={placeholder}
            autoComplete={autoComplete}
            disabled={field.disabled}
            readOnly={field.readOnly}
            error={field.invalid}
            aria-invalid={field.invalid}
            aria-required={required || undefined}
            aria-describedby={field.describedBy}
            className={cn('h-11 pr-11', field.readOnly && 'bg-muted/40')}
            onBlur={field.onBlur}
            onChange={(event) => field.onChange(event.target.value)}
            ref={field.ref}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute right-1.5 top-1/2 -translate-y-1/2"
            disabled={field.disabled}
            aria-label={visible ? 'Hide password' : 'Show password'}
            onClick={() => setVisible((value) => !value)}
          >
            {visible ? <EyeOff /> : <Eye />}
          </Button>
        </div>
      )}
    </FormField>
  );
}
