import { useCallback } from 'react';
import type { DefaultValues, FieldValues, UseFormReset, UseFormGetValues } from 'react-hook-form';

import {
  clearStoredFormValues,
  readStoredFormValues,
  writeStoredFormValues,
} from './auto-save';

export type DraftApi<TFieldValues extends FieldValues> = {
  saveDraft: () => void;
  loadDraft: () => boolean;
  clearDraft: () => void;
  hasDraft: () => boolean;
};

export function useFormDraft<TFieldValues extends FieldValues>(options: {
  key?: string;
  storage?: 'local' | 'session';
  getValues: UseFormGetValues<TFieldValues>;
  reset: UseFormReset<TFieldValues>;
  defaultValues?: DefaultValues<TFieldValues>;
}): DraftApi<TFieldValues> {
  const storage = options.storage ?? 'local';
  const key = options.key;

  const saveDraft = useCallback(() => {
    if (!key) return;
    writeStoredFormValues(key, options.getValues(), storage);
  }, [key, options, storage]);

  const loadDraft = useCallback(() => {
    if (!key) return false;
    const draft = readStoredFormValues<TFieldValues>(key, storage);
    if (!draft) return false;
    options.reset(draft, { keepDefaultValues: true });
    return true;
  }, [key, options, storage]);

  const clearDraft = useCallback(() => {
    if (!key) return;
    clearStoredFormValues(key, storage);
  }, [key, storage]);

  const hasDraft = useCallback(() => {
    if (!key) return false;
    return readStoredFormValues(key, storage) !== null;
  }, [key, storage]);

  return { saveDraft, loadDraft, clearDraft, hasDraft };
}
