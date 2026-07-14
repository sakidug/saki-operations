/**
 * Presentation models for enterprise selectors.
 * Modules supply data; selectors do not fetch or mutate on their own.
 */

export type VehicleAvailability = 'available' | 'unavailable' | 'assigned';

export type VehicleSelectorItem = {
  id: string;
  name: string;
  registrationNumber: string;
  capacity: number;
  availability: VehicleAvailability;
  photoUrl?: string | null;
  assignedDriverName?: string | null;
  make?: string | null;
  model?: string | null;
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
