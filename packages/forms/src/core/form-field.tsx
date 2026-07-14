import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useId } from 'react';
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
  type ControllerRenderProps,
  type FieldError,
} from 'react-hook-form';
import { Label, cn } from '@saki-operations/ui';

import { useFormChrome } from './form-chrome-context';

export type FormFieldRenderProps<TFieldValues extends FieldValues> = ControllerRenderProps<
  TFieldValues,
  FieldPath<TFieldValues>
> & {
  id: string;
  describedBy?: string;
  invalid: boolean;
  disabled: boolean;
  readOnly: boolean;
};

export type FormFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label?: ReactNode;
  description?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  hideError?: boolean;
  children: (field: FormFieldRenderProps<TFieldValues>) => ReactNode;
};

function FieldErrorMessage({
  id,
  error,
}: {
  id: string;
  error?: FieldError;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {error?.message ? (
        <motion.p
          id={id}
          role="alert"
          initial={reduceMotion ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.18 }}
          className="text-sm text-destructive"
        >
          {error.message}
        </motion.p>
      ) : null}
    </AnimatePresence>
  );
}

/**
 * Accessible field chrome: label, description, control slot, inline error.
 */
export function FormField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  disabled,
  readOnly,
  className,
  hideError,
  children,
}: FormFieldProps<TFieldValues>) {
  const chrome = useFormChrome();
  const reactId = useId();
  const fieldId = `${reactId}-${String(name)}`;
  const descriptionId = `${fieldId}-description`;
  const errorId = `${fieldId}-error`;

  const isDisabled = Boolean(disabled || chrome.disabled || chrome.loading);
  const isReadOnly = Boolean(readOnly || chrome.readOnly);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const invalid = Boolean(fieldState.error);
        const describedBy = [
          description ? descriptionId : null,
          !hideError && fieldState.error ? errorId : null,
        ]
          .filter(Boolean)
          .join(' ') || undefined;

        return (
          <div
            className={cn('flex w-full min-w-0 flex-col gap-2', className)}
            data-field={String(name)}
            data-invalid={invalid || undefined}
          >
            {label ? (
              <Label htmlFor={fieldId} className="flex items-center gap-1">
                <span>{label}</span>
                {required ? (
                  <span className="text-destructive" aria-hidden>
                    *
                  </span>
                ) : null}
                {required ? <span className="sr-only"> (required)</span> : null}
              </Label>
            ) : null}

            {description ? (
              <p id={descriptionId} className="text-xs text-muted-foreground">
                {description}
              </p>
            ) : null}

            {children({
              ...field,
              id: fieldId,
              describedBy,
              invalid,
              disabled: isDisabled,
              readOnly: isReadOnly,
            })}

            {!hideError ? <FieldErrorMessage id={errorId} error={fieldState.error} /> : null}
          </div>
        );
      }}
    />
  );
}
