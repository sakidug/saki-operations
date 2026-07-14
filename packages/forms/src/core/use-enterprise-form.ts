import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type UseFormProps,
  type UseFormReturn,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';

import { useFormAutoSave } from './auto-save';
import { focusFirstInvalidField } from './focus-first-invalid';
import { useFormDraft, type DraftApi } from './use-form-draft';

export type UseEnterpriseFormOptions<TSchema extends z.ZodTypeAny> = {
  schema: TSchema;
  defaultValues: DefaultValues<z.infer<TSchema>>;
  mode?: UseFormProps<z.infer<TSchema>>['mode'];
  draftKey?: string;
  draftStorage?: 'local' | 'session';
  autoSave?: {
    key: string;
    delayMs?: number;
    storage?: 'local' | 'session';
    enabled?: boolean;
    onSave?: (values: z.infer<TSchema>) => void | Promise<void>;
  };
  undoLimit?: number;
};

export type EnterpriseFormReturn<TFieldValues extends FieldValues> = UseFormReturn<TFieldValues> &
  DraftApi<TFieldValues> & {
    undo: () => void;
    canUndo: boolean;
    submitWithFocus: (
      onValid: (values: TFieldValues) => void | Promise<void>,
      onInvalid?: () => void,
    ) => (event?: React.BaseSyntheticEvent) => Promise<void>;
  };

function cloneValues<T>(value: T): T {
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value)) as T;
  }
}

/**
 * Enterprise form hook — Zod resolver, dirty/touched (RHF), draft, autosave, undo.
 */
export function useEnterpriseForm<TSchema extends z.ZodTypeAny>(
  options: UseEnterpriseFormOptions<TSchema>,
): EnterpriseFormReturn<z.infer<TSchema>> {
  type Values = z.infer<TSchema>;

  const form = useForm<Values>({
    resolver: zodResolver(options.schema),
    defaultValues: options.defaultValues,
    mode: options.mode ?? 'onBlur',
    shouldFocusError: false,
  });

  const undoLimit = options.undoLimit ?? 20;
  const historyRef = useRef<Values[]>([]);
  const skippingRef = useRef(false);
  const [canUndo, setCanUndo] = useState(false);

  const watched = form.watch();

  useEffect(() => {
    if (skippingRef.current) {
      skippingRef.current = false;
      return;
    }
    const snapshot = cloneValues(watched);
    const last = historyRef.current[historyRef.current.length - 1];
    if (last && JSON.stringify(last) === JSON.stringify(snapshot)) return;
    historyRef.current = [...historyRef.current.slice(-(undoLimit - 1)), snapshot];
    setCanUndo(historyRef.current.length > 1);
  }, [watched, undoLimit]);

  const undo = useCallback(() => {
    if (historyRef.current.length < 2) return;
    historyRef.current = historyRef.current.slice(0, -1);
    const previous = historyRef.current[historyRef.current.length - 1];
    if (!previous) return;
    skippingRef.current = true;
    form.reset(previous, { keepDefaultValues: true });
    setCanUndo(historyRef.current.length > 1);
  }, [form]);

  useFormAutoSave<Values>({
    key: options.autoSave?.key ?? '__saki-forms-autosave-disabled__',
    watch: form.watch,
    delayMs: options.autoSave?.delayMs,
    storage: options.autoSave?.storage,
    enabled: Boolean(options.autoSave?.key) && options.autoSave?.enabled !== false,
    onSave: options.autoSave?.onSave,
  });

  const draft = useFormDraft<Values>({
    key: options.draftKey,
    storage: options.draftStorage,
    getValues: form.getValues,
    reset: form.reset,
    defaultValues: options.defaultValues,
  });

  const submitWithFocus = useCallback(
    (onValid: (values: Values) => void | Promise<void>, onInvalid?: () => void) =>
      form.handleSubmit(
        async (values) => {
          await onValid(values);
          draft.clearDraft();
        },
        (errors) => {
          focusFirstInvalidField(errors);
          onInvalid?.();
        },
      ),
    [form, draft],
  );

  return {
    ...form,
    ...draft,
    undo,
    canUndo,
    submitWithFocus,
  };
}
