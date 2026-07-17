/**
 * Production JWT secret validation (Phase 9.1 / C-01).
 * Production must never boot with a missing, placeholder, or short secret.
 */

export const JWT_SECRET_MIN_LENGTH = 32;

/** Known insecure / example placeholders — never allowed in production. */
export const JWT_SECRET_FORBIDDEN = [
  'change-me',
  'change-me-to-a-long-random-secret-in-production',
  'secret',
  'jwt-secret',
  'your-secret-here',
  'dev-only-local-jwt-secret-min-32-chars!!',
] as const;

/** Development-only fallback when JWT_SECRET is unset (never used in production). */
export const JWT_SECRET_DEV_FALLBACK =
  'dev-only-local-jwt-secret-min-32-chars-ok!!';

export function isForbiddenJwtSecret(secret: string): boolean {
  const normalized = secret.trim().toLowerCase();
  return (JWT_SECRET_FORBIDDEN as readonly string[]).some(
    (item) => item.toLowerCase() === normalized,
  );
}

/**
 * Resolves and validates JWT_SECRET for the current NODE_ENV.
 * @throws Error when NODE_ENV=production and the secret is missing, forbidden, or too short.
 */
export function resolveJwtSecret(input?: {
  nodeEnv?: string;
  secret?: string | undefined;
}): string {
  const nodeEnv = (input?.nodeEnv ?? process.env.NODE_ENV ?? 'development').toLowerCase();
  const raw = input?.secret ?? process.env.JWT_SECRET;
  const secret = typeof raw === 'string' ? raw.trim() : '';
  const isProduction = nodeEnv === 'production';

  if (isProduction) {
    if (!secret) {
      throw new Error(
        '[FATAL] JWT_SECRET is missing. Refusing to start the API in production.',
      );
    }
    if (isForbiddenJwtSecret(secret)) {
      throw new Error(
        '[FATAL] JWT_SECRET equals a development placeholder. Refusing to start the API in production.',
      );
    }
    if (secret.length < JWT_SECRET_MIN_LENGTH) {
      throw new Error(
        `[FATAL] JWT_SECRET must be at least ${JWT_SECRET_MIN_LENGTH} characters in production. Refusing to start.`,
      );
    }
    return secret;
  }

  if (!secret) {
    return JWT_SECRET_DEV_FALLBACK;
  }

  if (isForbiddenJwtSecret(secret) || secret.length < JWT_SECRET_MIN_LENGTH) {
    // Allow known placeholders in development so local .env.example still works,
    // but prefer a long unique secret in shared environments.
    return secret.length >= JWT_SECRET_MIN_LENGTH ? secret : JWT_SECRET_DEV_FALLBACK;
  }

  return secret;
}
