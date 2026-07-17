/**
 * Dev-only diagnostics for Tours operation failures.
 * User-facing messages stay unchanged; this preserves stack traces for debugging.
 */
export function reportOperationError(scope: string, error: unknown): void {
  if (import.meta.env.DEV) {
    console.error(`[saki-tours:${scope}]`, error);
  }
}
