import type { Control, FieldValues } from 'react-hook-form';

import { NumberField } from './number-field';
import type { FormFieldCommonProps } from '../types';

type CurrencyFieldProps<T extends FieldValues> = FormFieldCommonProps<T> & {
  control: Control<T>;
  placeholder?: string;
  min?: number;
  max?: number;
};

/** LKR currency input — displays Rs prefix. */
export function CurrencyField<T extends FieldValues>(props: CurrencyFieldProps<T>) {
  return <NumberField {...props} prefix="Rs" step={0.01} min={props.min ?? 0} />;
}
