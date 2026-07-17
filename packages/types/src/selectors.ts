/**
 * Presentation models for enterprise selectors / catalogs.
 * Modules supply data; selectors do not fetch or mutate on their own.
 */

/**
 * Selector-facing availability (Phase 5.5).
 * Prefer mapping `ON_TRIP` → `assigned` when feeding VehicleSelector.
 */
export type VehicleAvailability = 'available' | 'unavailable' | 'assigned';

/**
 * Operational vehicle status for Operations V2.
 * - `AVAILABLE` — free to start an operation
 * - `ON_TRIP` — on an active operation (one active op per vehicle)
 * - `SERVICE` — out for maintenance / unavailable
 */
export type VehicleOperationalStatus = 'AVAILABLE' | 'ON_TRIP' | 'SERVICE';

export const VEHICLE_OPERATIONAL_STATUSES: readonly VehicleOperationalStatus[] = [
  'AVAILABLE',
  'ON_TRIP',
  'SERVICE',
];

export type VehicleSelectorItem = {
  id: string;
  name: string;
  registrationNumber: string;
  capacity: number;
  availability: VehicleAvailability;
  /** Optional company scope for V2 company → vehicle filtering */
  companyId?: string | null;
  photoUrl?: string | null;
  assignedDriverName?: string | null;
  make?: string | null;
  model?: string | null;
};

/** Temporary / catalog company until a server Company API lands. */
export type CompanySelectorItem = {
  id: string;
  name: string;
  shortName?: string | null;
  /** Soft-active flag for selection lists */
  active: boolean;
};

export type EmployeeSelectorItem = {
  id: string;
  employeeId: string;
  displayName: string;
  phone: string | null;
  role: 'driver' | 'assistant' | 'office' | 'admin';
  available: boolean;
  photoUrl?: string | null;
};

/** Map operational status onto selector availability without changing selector UX. */
export function toVehicleAvailability(
  status: VehicleOperationalStatus,
): VehicleAvailability {
  if (status === 'ON_TRIP') return 'assigned';
  if (status === 'SERVICE') return 'unavailable';
  return 'available';
}
