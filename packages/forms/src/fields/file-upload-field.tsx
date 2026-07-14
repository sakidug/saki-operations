import type { Control, FieldValues } from 'react-hook-form';
import { Upload } from 'lucide-react';
import { cn } from '@saki-operations/ui';

import { FormField } from '../core/form-field';
import type { FileUploadValue, FormFieldCommonProps } from '../types';

type FileUploadFieldProps<T extends FieldValues> = FormFieldCommonProps<T> & {
  control: Control<T>;
  accept?: string;
  maxSizeMb?: number;
  helperText?: string;
};

/**
 * Foundation-only file picker — stores File metadata locally.
 * Object storage (R2) upload pipeline arrives in a later phase.
 */
export function FileUploadField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  disabled,
  readOnly,
  className,
  hideError,
  accept,
  maxSizeMb = 10,
  helperText = 'Foundation only — file is kept in memory until storage is wired.',
}: FileUploadFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      label={label}
      description={description ?? helperText}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      className={className}
      hideError={hideError}
    >
      {(field) => {
        const value = (field.value ?? { file: null }) as FileUploadValue;
        return (
          <label
            className={cn(
              'glass flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border px-4 py-8 text-center transition hover:border-primary/60',
              field.invalid && 'border-destructive',
              (field.disabled || field.readOnly) && 'cursor-not-allowed opacity-60',
            )}
          >
            <Upload className="size-6 text-muted-foreground" aria-hidden />
            <span className="text-sm font-medium">
              {value.file?.name ?? value.name ?? 'Choose a file'}
            </span>
            <span className="text-xs text-muted-foreground">Max {maxSizeMb} MB</span>
            <input
              id={field.id}
              name={String(name)}
              data-field-name={String(name)}
              type="file"
              accept={accept}
              className="sr-only"
              disabled={field.disabled || field.readOnly}
              aria-invalid={field.invalid}
              aria-required={required || undefined}
              aria-describedby={field.describedBy}
              onBlur={field.onBlur}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                if (file && file.size > maxSizeMb * 1024 * 1024) {
                  field.onChange({ file: null });
                  return;
                }
                field.onChange(
                  file
                    ? {
                        file,
                        name: file.name,
                        size: file.size,
                        mimeType: file.type,
                      }
                    : { file: null },
                );
              }}
            />
          </label>
        );
      }}
    </FormField>
  );
}
