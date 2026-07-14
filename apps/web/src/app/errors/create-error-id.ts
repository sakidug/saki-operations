/**
 * Stable client-side error IDs for support and future remote logging.
 */
export function createErrorId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `err_${time}_${random}`;
}
