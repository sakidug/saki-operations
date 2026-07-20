import type { FleetAvailability } from '../types';

/** Inclusive date-range overlap on `YYYY-MM-DD` strings. */
export function datesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  return startA <= endB && startB <= endA;
}

export function findOverlappingAvailability(
  entries: readonly FleetAvailability[],
  vehicleId: string,
  startDate: string,
  endDate: string,
  excludeId?: string,
): FleetAvailability[] {
  return entries.filter(
    (entry) =>
      entry.vehicleId === vehicleId &&
      entry.id !== excludeId &&
      datesOverlap(entry.startDate, entry.endDate, startDate, endDate),
  );
}

export function dateInRange(date: string, startDate: string, endDate: string): boolean {
  return date >= startDate && date <= endDate;
}
