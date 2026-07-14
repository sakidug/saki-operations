import type { Control, FieldValues } from 'react-hook-form';

import { TextField } from './text-field';
import type { FormFieldCommonProps } from '../types';

type EmailFieldProps<T extends FieldValues> = FormFieldCommonProps<T> & {
  control: Control<T>;
  placeholder?: string;
};

export function EmailField<T extends FieldValues>(props: EmailFieldProps<T>) {
  return (
    <TextField
      {...props}
      type="text"
      inputMode="email"
      autoComplete="email"
      placeholder={props.placeholder ?? 'name@example.com'}
    />
  );
}
