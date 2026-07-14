import { useEffect, useRef } from 'react';
import type { FieldValues, UseFormWatch } from 'react-hook-form';

export type AutoSaveOptions<TFieldValues extends FieldValues> = {
  /** Storage namespace — draft/autosave key. */
  key: string;
  watch: UseFormWatch<TFieldValues>;
  delayMs?: number;
  storage?: 'local' | 'session';
  enabled?: boolean;
  /** Called after serializing values (useful for remote draft APIs later). */
  onSave?: (values: TFieldValues) => void | Promise<void>;
};

function getStore(kind: 'local' | 'session') {
  if (typeof window === 'undefined') return null;
  return kind === 'session' ? window.sessionStorage : window.localStorage;
}

export function readStoredFormValues<T>(key: string, storage: 'local' | 'session' = 'local'): T | null {
  const store = getStore(storage);
  if (!store) return null;
  try {
    const raw = store.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeStoredFormValues(
  key: string,
  values: unknown,
  storage: 'local' | 'session' = 'local',
): void {
  const store = getStore(storage);
  if (!store) return;
  try {
    store.setItem(key, JSON.stringify(values));
  } catch {
    // Quota / private mode — ignore
  }
}

export function clearStoredFormValues(key: string, storage: 'local' | 'session' = 'local'): void {
  const store = getStore(storage);
  if (!store) return;
  try {
    store.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * Debounced auto-save of the full form value tree to web storage + optional hook.
 */
export function useFormAutoSave<TFieldValues extends FieldValues>({
  key,
  watch,
  delayMs = 800,
  storage = 'local',
  enabled = true,
  onSave,
}: AutoSaveOptions<TFieldValues>) {
  const values = watch();
  const timer = useRef<number | null>(null);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  useEffect(() => {
    if (!enabled || !key) return;

    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      writeStoredFormValues(key, values, storage);
      void onSaveRef.current?.(values);
    }, delayMs);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [values, key, delayMs, storage, enabled]);
}
