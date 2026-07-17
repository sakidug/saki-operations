import { TOURS_FLEET_CATALOG } from '@/modules/saki-tours/data/fleet-catalog';
import { createLocalId, readJson, writeJson } from '@/lib/local-persist';

export type VehicleDocument = {
  id: string;
  name: string;
  /** Persisted as a data URL so offline reloads keep the preview. */
  dataUrl: string;
  createdAt: string;
};

export type VehicleRecord = {
  id: string;
  name: string;
  registrationNumber: string;
  make: string;
  model: string;
  capacity: number;
  availability: 'available' | 'unavailable';
  currentOdometerKm: number;
  nextServiceKm: number;
  nextServiceDate: string;
  insuranceExpiry: string;
  licenseExpiry: string;
  maintenanceNotes: string;
  documents: VehicleDocument[];
};

type VehicleStoreState = {
  vehicles: VehicleRecord[];
};

const STORAGE_KEY = 'saki.ops.vehicles.v1';

const SEED_EXTRAS: Omit<
  VehicleRecord,
  'id' | 'name' | 'registrationNumber' | 'make' | 'model' | 'capacity' | 'availability'
>[] = [
  {
    currentOdometerKm: 84_220,
    nextServiceKm: 90_000,
    nextServiceDate: '2026-09-15',
    insuranceExpiry: '2026-12-31',
    licenseExpiry: '2027-03-01',
    maintenanceNotes: 'Front pads replaced at 82,000 km.',
    documents: [],
  },
  {
    currentOdometerKm: 112_450,
    nextServiceKm: 120_000,
    nextServiceDate: '2026-08-01',
    insuranceExpiry: '2026-11-15',
    licenseExpiry: '2026-10-20',
    maintenanceNotes: 'AC compressor noisy above 3,000 rpm.',
    documents: [],
  },
  {
    currentOdometerKm: 45_100,
    nextServiceKm: 50_000,
    nextServiceDate: '2026-10-10',
    insuranceExpiry: '2027-01-31',
    licenseExpiry: '2027-06-15',
    maintenanceNotes: 'New tyres fitted March 2026.',
    documents: [],
  },
  {
    currentOdometerKm: 98_700,
    nextServiceKm: 100_000,
    nextServiceDate: '2026-07-30',
    insuranceExpiry: '2026-09-01',
    licenseExpiry: '2026-08-15',
    maintenanceNotes: 'Pending full service — due soon.',
    documents: [],
  },
];

function seedVehicles(): VehicleRecord[] {
  return TOURS_FLEET_CATALOG.map((item, index) => {
    const extras = SEED_EXTRAS[index] ?? SEED_EXTRAS[0]!;
    const availability: VehicleRecord['availability'] =
      item.availability === 'unavailable' ? 'unavailable' : 'available';
    return {
      id: item.id,
      name: item.name,
      registrationNumber: item.registrationNumber,
      make: item.make ?? '',
      model: item.model ?? '',
      capacity: item.capacity,
      availability,
      currentOdometerKm: extras.currentOdometerKm,
      nextServiceKm: extras.nextServiceKm,
      nextServiceDate: extras.nextServiceDate,
      insuranceExpiry: extras.insuranceExpiry,
      licenseExpiry: extras.licenseExpiry,
      maintenanceNotes: extras.maintenanceNotes,
      documents: [],
    };
  });
}

function load(): VehicleStoreState {
  const existing = readJson<VehicleStoreState | null>(STORAGE_KEY, null);
  if (existing?.vehicles?.length) {
    return existing;
  }
  const seeded = { vehicles: seedVehicles() };
  writeJson(STORAGE_KEY, seeded);
  return seeded;
}

function save(state: VehicleStoreState): void {
  writeJson(STORAGE_KEY, state);
}

export function listVehicles(): VehicleRecord[] {
  return [...load().vehicles].sort((a, b) => a.name.localeCompare(b.name));
}

export function getVehicle(id: string): VehicleRecord | undefined {
  return load().vehicles.find((v) => v.id === id);
}

export function updateVehicleNotes(id: string, maintenanceNotes: string): VehicleRecord | undefined {
  const state = load();
  const vehicle = state.vehicles.find((v) => v.id === id);
  if (!vehicle) return undefined;
  vehicle.maintenanceNotes = maintenanceNotes;
  save(state);
  return { ...vehicle, documents: [...vehicle.documents] };
}

export function addVehicleDocument(input: {
  vehicleId: string;
  name: string;
  dataUrl: string;
}): VehicleDocument | undefined {
  const state = load();
  const vehicle = state.vehicles.find((v) => v.id === input.vehicleId);
  if (!vehicle) return undefined;
  const doc: VehicleDocument = {
    id: createLocalId('vdoc'),
    name: input.name,
    dataUrl: input.dataUrl,
    createdAt: new Date().toISOString(),
  };
  vehicle.documents = [...vehicle.documents, doc];
  save(state);
  return doc;
}

export function removeVehicleDocument(vehicleId: string, documentId: string): boolean {
  const state = load();
  const vehicle = state.vehicles.find((v) => v.id === vehicleId);
  if (!vehicle) return false;
  const before = vehicle.documents.length;
  vehicle.documents = vehicle.documents.filter((d) => d.id !== documentId);
  if (vehicle.documents.length === before) return false;
  save(state);
  return true;
}

export function canManageVehicles(role: string): boolean {
  return role === 'admin' || role === 'office';
}
