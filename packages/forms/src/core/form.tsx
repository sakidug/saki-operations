import type { FormEvent, ReactNode } from 'react';
import { FormProvider, type FieldValues, type UseFormReturn } from 'react-hook-form';
import { cn } from '@saki-operations/ui';

import { focusFirstInvalidField } from './focus-first-invalid';
import { FormChromeProvider } from './form-chrome-context';

export type FormProps<TFieldValues extends FieldValues> = {
  form: UseFormReturn<TFieldValues>;
  onSubmit: (values: TFieldValues) => void | Promise<void>;
  onInvalid?: () => void;
  children: ReactNode;
  className?: string;
  loading?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  id?: string;
  /** Focus first invalid control after failed validation. Default true. */
  focusFirstError?: boolean;
};

/**
 * Root form shell — RHF provider + enterprise chrome (disabled / readOnly / loading).
 */
export function Form<TFieldValues extends FieldValues>({
  form,
  onSubmit,
  onInvalid,
  children,
  className,
  loading = false,
  disabled = false,
  readOnly = false,
  id,
  focusFirstError = true,
}: FormProps<TFieldValues>) {
  const handleSubmit = form.handleSubmit(
    async (values) => {
      await onSubmit(values);
    },
    (errors) => {
      if (focusFirstError) focusFirstInvalidField(errors);
      onInvalid?.();
    },
  );

  return (
    <FormProvider {...form}>
      <FormChromeProvider value={{ disabled, readOnly, loading }}>
        <form
          id={id}
          className={cn(
            'flex w-full min-w-0 flex-col gap-4 sm:gap-5',
            (disabled || loading) && 'opacity-90',
            className,
          )}
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            void handleSubmit(event);
          }}
          noValidate
          aria-busy={loading || undefined}
        >
          <fieldset
            disabled={disabled || loading}
            className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0 sm:gap-5"
          >
            {readOnly ? <legend className="sr-only">Read only form</legend> : null}
            {children}
          </fieldset>
        </form>
      </FormChromeProvider>
    </FormProvider>
  );
}
