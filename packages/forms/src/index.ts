/**
 * @saki-operations/forms
 * Global enterprise form system for every Saki Operations module.
 */

export * from './core';
export * from './fields';
export * from './schemas';
export * from './selectors';
export type {
  DateRangeValue,
  FileUploadValue,
  FormFieldCommonProps,
  FormMode,
  FormSelectOption,
} from './types';

// Re-export essentials so consumers don't need separate imports for common cases.
export {
  useFormContext,
  useWatch,
  useFormState,
  Controller,
  FormProvider,
} from 'react-hook-form';
export type {
  Control,
  FieldValues,
  FieldPath,
  UseFormReturn,
  SubmitHandler,
} from 'react-hook-form';
