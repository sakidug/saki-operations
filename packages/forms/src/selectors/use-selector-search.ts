import { useEffect, useMemo, useState } from 'react';

/**
 * Client-side search across selectable string fields.
 * Callers pass already-fetched lists — no network here.
 */
export function filterBySearch<T>(
  items: T[],
  query: string,
  getHaystack: (item: T) => Array<string | null | undefined>,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) =>
    getHaystack(item).some((part) => (part ?? '').toLowerCase().includes(q)),
  );
}

export function useSelectorSearch<T>(
  items: T[],
  query: string,
  getHaystack: (item: T) => Array<string | null | undefined>,
): T[] {
  return useMemo(() => filterBySearch(items, query, getHaystack), [items, query, getHaystack]);
}

export function useDebouncedValue<T>(value: T, delayMs = 200): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
