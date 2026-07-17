import type { VehicleSelectorItem } from '@saki-operations/types';

/**
 * Local fleet catalog for Start Operation until Vehicle API lands.
 * Available for offline selection.
 */
export const TOURS_FLEET_CATALOG: VehicleSelectorItem[] = [
  {
    id: 'veh_van_01',
    name: 'Wedding Van 01',
    registrationNumber: 'WP CAB-1234',
    capacity: 8,
    availability: 'available',
    make: 'Toyota',
    model: 'HiAce',
    assignedDriverName: null,
  },
  {
    id: 'veh_van_02',
    name: 'Airport Coach 02',
    registrationNumber: 'WP CAC-5678',
    capacity: 14,
    availability: 'available',
    make: 'Nissan',
    model: 'Civilian',
    assignedDriverName: null,
  },
  {
    id: 'veh_car_03',
    name: 'Tour Car 03',
    registrationNumber: 'WP CAD-9012',
    capacity: 4,
    availability: 'available',
    make: 'Toyota',
    model: 'Axio',
    assignedDriverName: null,
  },
  {
    id: 'veh_van_04',
    name: 'Fleet Van 04',
    registrationNumber: 'WP CAE-3456',
    capacity: 10,
    availability: 'unavailable',
    make: 'Toyota',
    model: 'HiAce',
    assignedDriverName: null,
  },
];

export function findFleetVehicle(id: string): VehicleSelectorItem | undefined {
  return TOURS_FLEET_CATALOG.find((item) => item.id === id);
}
