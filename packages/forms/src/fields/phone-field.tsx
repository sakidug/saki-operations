import type { Control, FieldValues } from 'react-hook-form';

import { TextField } from './text-field';
import type { FormFieldCommonProps } from '../types';

type PhoneFieldProps<T extends FieldValues> = FormFieldCommonProps<T> & {
  control: Control<T>;
  placeholder?: string;
};

export function PhoneField<T extends FieldValues>(props: PhoneFieldProps<T>) {
  return (
    <TextField
      {...props}
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      placeholder={props.placeholder ?? '07X XXX XXXX'}
    />
  );
}
