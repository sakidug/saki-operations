import type { ReactNode } from 'react';
import type { FieldPath, FieldValues } from 'react-hook-form';

export type FormMode = 'onBlur' | 'onChange' | 'onSubmit' | 'onTouched' | 'all';

export type FormSelectOption = {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
};

export type DateRangeValue = {
  from: string;
  to: string;
};

export type FileUploadValue = {
  /** Browser File handle — foundation only; upload pipeline arrives later. */
  file: File | null;
  /** Optional remote object key / URL once storage is wired. */
  storageKey?: string;
  name?: string;
  size?: number;
  mimeType?: string;
};

export type FormFieldCommonProps<TFieldValues extends FieldValues> = {
  name: FieldPath<TFieldValues>;
  label?: ReactNode;
  description?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  hideError?: boolean;
};
