import { useEffect, useState } from 'react';
import type { Control, FieldValues } from 'react-hook-form';
import { ImageIcon } from 'lucide-react';
import { cn } from '@saki-operations/ui';

import { FormField } from '../core/form-field';
import type { FileUploadValue, FormFieldCommonProps } from '../types';

type ImageUploadFieldProps<T extends FieldValues> = FormFieldCommonProps<T> & {
  control: Control<T>;
  maxSizeMb?: number;
  helperText?: string;
};

function ImagePreview({ file }: { file: File | null }) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!preview) return null;
  return <img src={preview} alt="" className="absolute inset-0 size-full object-cover opacity-40" />;
}

/**
 * Foundation-only image picker with local preview.
 * Cloud upload is deferred to the evidence/storage phase.
 */
export function ImageUploadField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  disabled,
  readOnly,
  className,
  hideError,
  maxSizeMb = 5,
  helperText = 'Foundation only — preview is local until R2 upload is connected.',
}: ImageUploadFieldProps<T>) {
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
              'glass relative flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed border-border px-4 py-6 text-center transition hover:border-primary/60',
              field.invalid && 'border-destructive',
              (field.disabled || field.readOnly) && 'cursor-not-allowed opacity-60',
            )}
          >
            <ImagePreview file={value.file} />
            <div className="relative z-10 flex flex-col items-center gap-2">
              <ImageIcon className="size-6 text-muted-foreground" aria-hidden />
              <span className="text-sm font-medium">
                {value.file?.name ?? value.name ?? 'Choose an image'}
              </span>
              <span className="text-xs text-muted-foreground">PNG, JPG up to {maxSizeMb} MB</span>
            </div>
            <input
              id={field.id}
              name={String(name)}
              data-field-name={String(name)}
              type="file"
              accept="image/*"
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
