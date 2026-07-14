import type { Control, FieldValues } from 'react-hook-form';

import { NumberField } from './number-field';
import type { FormFieldCommonProps } from '../types';

type KilometerFieldProps<T extends FieldValues> = FormFieldCommonProps<T> & {
  control: Control<T>;
  placeholder?: string;
  min?: number;
  max?: number;
};

export function KilometerField<T extends FieldValues>(props: KilometerFieldProps<T>) {
  return <NumberField {...props} suffix="km" step={0.1} min={props.min ?? 0} />;
}
