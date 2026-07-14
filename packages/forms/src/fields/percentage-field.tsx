import type { Control, FieldValues } from 'react-hook-form';

import { NumberField } from './number-field';
import type { FormFieldCommonProps } from '../types';

type PercentageFieldProps<T extends FieldValues> = FormFieldCommonProps<T> & {
  control: Control<T>;
  placeholder?: string;
  min?: number;
  max?: number;
};

export function PercentageField<T extends FieldValues>(props: PercentageFieldProps<T>) {
  return <NumberField {...props} suffix="%" step={0.01} min={props.min ?? 0} max={props.max ?? 100} />;
}
