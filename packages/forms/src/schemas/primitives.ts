import { AUTH_PASSWORD_MIN_LENGTH } from '@saki-operations/constants';
import { z } from 'zod';

/** Sri Lankan-friendly phone — digits with optional + / spaces / dashes. */
const PHONE_RE = /^\+?[0-9][0-9\s\-()]{7,18}$/;

export const requiredString = (message = 'This field is required') =>
  z.string({ required_error: message }).trim().min(1, message);

export const optionalString = () => z.string().trim().optional().or(z.literal(''));

export const emailSchema = (message = 'Enter a valid email address') =>
  requiredString().email(message);

export const optionalEmailSchema = () =>
  z
    .string()
    .trim()
    .email('Enter a valid email address')
    .optional()
    .or(z.literal(''));

export const phoneSchema = (message = 'Enter a valid phone number') =>
  requiredString().regex(PHONE_RE, message);

export const optionalPhoneSchema = () =>
  z
    .string()
    .trim()
    .regex(PHONE_RE, 'Enter a valid phone number')
    .optional()
    .or(z.literal(''));

export const passwordSchema = (min = AUTH_PASSWORD_MIN_LENGTH) =>
  z
    .string({ required_error: 'Password is required' })
    .min(min, `Password must be at least ${min} characters`);

export const numberSchema = (opts?: { min?: number; max?: number; message?: string }) => {
  let schema = z.coerce.number({
    invalid_type_error: opts?.message ?? 'Enter a valid number',
    required_error: opts?.message ?? 'Enter a valid number',
  });
  if (typeof opts?.min === 'number') schema = schema.min(opts.min);
  if (typeof opts?.max === 'number') schema = schema.max(opts.max);
  return schema;
};

export const currencySchema = (opts?: { min?: number; max?: number }) =>
  numberSchema({
    min: opts?.min ?? 0,
    max: opts?.max,
    message: 'Enter a valid amount in Rs',
  });

export const kilometerSchema = (opts?: { min?: number; max?: number }) =>
  numberSchema({
    min: opts?.min ?? 0,
    max: opts?.max,
    message: 'Enter a valid distance in km',
  });

export const percentageSchema = (opts?: { min?: number; max?: number }) =>
  numberSchema({
    min: opts?.min ?? 0,
    max: opts?.max ?? 100,
    message: 'Enter a valid percentage (0–100)',
  });

/** HTML date input value `YYYY-MM-DD`. */
export const dateSchema = (message = 'Enter a valid date') =>
  requiredString().regex(/^\d{4}-\d{2}-\d{2}$/, message);

export const optionalDateSchema = () =>
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date')
    .optional()
    .or(z.literal(''));

/** HTML time input value `HH:MM` or `HH:MM:SS`. */
export const timeSchema = (message = 'Enter a valid time') =>
  requiredString().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, message);

export const optionalTimeSchema = () =>
  z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Enter a valid time')
    .optional()
    .or(z.literal(''));

export const dateRangeSchema = z
  .object({
    from: dateSchema('Start date is required'),
    to: dateSchema('End date is required'),
  })
  .superRefine((value, ctx) => {
    if (value.from && value.to && value.to < value.from) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be on or after the start date',
        path: ['to'],
      });
    }
  });

export const otpSchema = (length = 6) =>
  z
    .string({ required_error: 'Enter the verification code' })
    .regex(new RegExp(`^\\d{${length}}$`), `Enter the ${length}-digit code`);

export const booleanRequiredSchema = (message = 'This option is required') =>
  z.literal(true, {
    errorMap: () => ({ message }),
  });

/**
 * Helpers for composing module schemas with cross-field rules.
 * Example: `withCrossField(baseSchema, (data, ctx) => { ... })`
 */
export function withCrossField<T extends z.ZodTypeAny>(
  schema: T,
  refine: (data: z.infer<T>, ctx: z.RefinementCtx) => void,
) {
  return schema.superRefine(refine);
}

export { z };
