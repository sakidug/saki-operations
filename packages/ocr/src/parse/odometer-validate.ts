/**
 * Fleet-safe odometer value validation against prior readings.
 */

export type OdometerValidationCode =
  | 'empty'
  | 'too_short'
  | 'below_previous'
  | 'large_jump'
  | 'ok';

export type OdometerValidationResult = {
  code: OdometerValidationCode;
  /** Soft warning — can continue after driver confirms */
  warning: boolean;
  /** Hard block until driver edits or explicitly confirms */
  requiresConfirmation: boolean;
  previousKm: number | null;
  deltaKm: number | null;
};

/** Single-trip / day jumps above this require explicit confirmation. */
export const UNUSUAL_JUMP_KM = 2_000;

export function validateOdometerReading(
  digits: string,
  previousKm?: number | null,
  options?: { unusualJumpKm?: number; minDigits?: number },
): OdometerValidationResult {
  const unusualJumpKm = options?.unusualJumpKm ?? UNUSUAL_JUMP_KM;
  const minDigits = options?.minDigits ?? 4;
  const clean = digits.replace(/\D/g, '');

  if (!clean) {
    return {
      code: 'empty',
      warning: true,
      requiresConfirmation: true,
      previousKm: previousKm ?? null,
      deltaKm: null,
    };
  }

  if (clean.length < minDigits) {
    return {
      code: 'too_short',
      warning: true,
      requiresConfirmation: true,
      previousKm: previousKm ?? null,
      deltaKm: null,
    };
  }

  const value = Number(clean);
  if (!Number.isFinite(value)) {
    return {
      code: 'empty',
      warning: true,
      requiresConfirmation: true,
      previousKm: previousKm ?? null,
      deltaKm: null,
    };
  }

  if (previousKm == null || !Number.isFinite(previousKm)) {
    return {
      code: 'ok',
      warning: false,
      requiresConfirmation: false,
      previousKm: null,
      deltaKm: null,
    };
  }

  const delta = value - previousKm;
  if (delta < 0) {
    return {
      code: 'below_previous',
      warning: true,
      requiresConfirmation: true,
      previousKm,
      deltaKm: delta,
    };
  }

  if (delta > unusualJumpKm) {
    return {
      code: 'large_jump',
      warning: true,
      requiresConfirmation: true,
      previousKm,
      deltaKm: delta,
    };
  }

  return {
    code: 'ok',
    warning: false,
    requiresConfirmation: false,
    previousKm,
    deltaKm: delta,
  };
}
