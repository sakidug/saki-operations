/**
 * Pure calculators — no I/O, no module knowledge.
 */

export type WorkingHoursResult = {
  durationMs: number;
  /** Whole hours component */
  hours: number;
  /** Remaining minutes 0–59 */
  minutes: number;
  /** Remaining seconds 0–59 */
  seconds: number;
  /** Human summary e.g. "8h 30m" */
  label: string;
};

export function calculateWorkingHours(
  startTimeIso: string,
  endTimeIso: string,
): WorkingHoursResult {
  const start = Date.parse(startTimeIso);
  const end = Date.parse(endTimeIso);
  if (Number.isNaN(start) || Number.isNaN(end)) {
    throw new Error('Invalid start or end time for working hours');
  }
  if (end < start) {
    throw new Error('End time must be after start time');
  }

  const durationMs = end - start;
  const totalSeconds = Math.floor(durationMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours === 0) parts.push(`${minutes}m`);
  if (hours === 0 && minutes === 0) parts.push(`${seconds}s`);

  return {
    durationMs,
    hours,
    minutes,
    seconds,
    label: parts.join(' '),
  };
}

export type TotalKmResult = {
  totalKm: number;
  startOdometer: number;
  endOdometer: number;
};

export function calculateTotalKm(startOdometer: number, endOdometer: number): TotalKmResult {
  if (!Number.isFinite(startOdometer) || !Number.isFinite(endOdometer)) {
    throw new Error('Odometer values must be finite numbers');
  }
  if (startOdometer < 0 || endOdometer < 0) {
    throw new Error('Odometer values must be non-negative');
  }
  if (endOdometer < startOdometer) {
    throw new Error('End odometer must be greater than or equal to start odometer');
  }

  return {
    totalKm: endOdometer - startOdometer,
    startOdometer,
    endOdometer,
  };
}

export function parseOdometerNumber(value: string | number | null | undefined): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const digits = value.replace(/\D/g, '');
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
}
