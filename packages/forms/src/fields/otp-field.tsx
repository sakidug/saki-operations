import { useMemo, useRef } from 'react';
import type { Control, FieldValues } from 'react-hook-form';
import { Input, cn } from '@saki-operations/ui';

import { FormField } from '../core/form-field';
import type { FormFieldCommonProps } from '../types';

type OtpFieldProps<T extends FieldValues> = FormFieldCommonProps<T> & {
  control: Control<T>;
  length?: number;
};

export function OtpField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  disabled,
  readOnly,
  className,
  hideError,
  length = 6,
}: OtpFieldProps<T>) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const slots = useMemo(() => Array.from({ length }, (_, index) => index), [length]);

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
        const digits = String(field.value ?? '')
          .padEnd(length, ' ')
          .slice(0, length)
          .split('');

        const setDigit = (index: number, char: string) => {
          const next = digits.map((d) => (d === ' ' ? '' : d));
          next[index] = char.replace(/\D/g, '').slice(-1);
          const joined = next.join('').replace(/\s/g, '');
          field.onChange(joined);
          if (char && index < length - 1) {
            inputsRef.current[index + 1]?.focus();
          }
        };

        return (
          <div
            className="flex flex-wrap justify-between gap-2 sm:justify-start sm:gap-3"
            role="group"
            aria-labelledby={field.id}
            data-field-name={String(name)}
          >
            <span id={field.id} className="sr-only">
              {typeof label === 'string' ? label : 'One-time password'}
            </span>
            {slots.map((index) => (
              <Input
                key={index}
                ref={(element) => {
                  inputsRef.current[index] = element;
                }}
                inputMode="numeric"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                maxLength={1}
                value={digits[index] === ' ' ? '' : digits[index]}
                disabled={field.disabled}
                readOnly={field.readOnly}
                error={field.invalid}
                aria-label={`Digit ${index + 1} of ${length}`}
                className={cn('h-12 w-11 px-0 text-center text-lg font-semibold sm:h-12 sm:w-12')}
                onChange={(event) => setDigit(index, event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Backspace' && !digits[index]?.trim() && index > 0) {
                    inputsRef.current[index - 1]?.focus();
                  }
                }}
                onBlur={field.onBlur}
              />
            ))}
          </div>
        );
      }}
    </FormField>
  );
}
