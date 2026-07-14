import type { FieldErrors, FieldValues } from 'react-hook-form';

function firstPath(errors: FieldErrors<FieldValues>, prefix = ''): string | null {
  for (const [key, value] of Object.entries(errors)) {
    if (!value) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && 'message' in value && value.message) {
      return path;
    }
    if (typeof value === 'object' && value !== null) {
      const nested = firstPath(value as FieldErrors<FieldValues>, path);
      if (nested) return nested;
    }
  }
  return null;
}

/**
 * Focus the first invalid control after a failed submit.
 * Prefers `[data-field-name]` then `[name]`.
 */
export function focusFirstInvalidField(errors: FieldErrors<FieldValues>): string | null {
  const path = firstPath(errors);
  if (!path || typeof document === 'undefined') return path;

  const byData = document.querySelector<HTMLElement>(`[data-field-name="${CSS.escape(path)}"]`);
  if (byData) {
    byData.focus();
    byData.scrollIntoView({ block: 'center', behavior: 'smooth' });
    return path;
  }

  const byName = document.querySelector<HTMLElement>(`[name="${CSS.escape(path)}"]`);
  if (byName) {
    byName.focus();
    byName.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  return path;
}

export function flattenFieldErrors(
  errors: FieldErrors<FieldValues>,
  prefix = '',
): Array<{ name: string; message: string }> {
  const out: Array<{ name: string; message: string }> = [];

  for (const [key, value] of Object.entries(errors)) {
    if (!value) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && 'message' in value && value.message) {
      out.push({ name: path, message: String(value.message) });
      continue;
    }
    if (typeof value === 'object' && value !== null) {
      out.push(...flattenFieldErrors(value as FieldErrors<FieldValues>, path));
    }
  }

  return out;
}
