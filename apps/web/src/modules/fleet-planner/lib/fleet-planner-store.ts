import { createLocalId, readJson, writeJson } from '@/lib/local-persist';

import { findOverlappingAvailability } from './date-overlap';
import type { FleetAvailability, FleetAvailabilityInput } from '../types';

const STORAGE_KEY = 'saki.ops.fleet-planner.v1';

type FleetPlannerState = {
  entries: FleetAvailability[];
};

function emptyState(): FleetPlannerState {
  return { entries: [] };
}

function load(): FleetPlannerState {
  const raw = readJson<FleetPlannerState>(STORAGE_KEY, emptyState());
  return {
    entries: Array.isArray(raw.entries) ? raw.entries : [],
  };
}

function save(state: FleetPlannerState): void {
  writeJson(STORAGE_KEY, state);
}

export class AvailabilityConflictError extends Error {
  readonly code = 'availability_conflict';
  constructor(readonly conflicts: FleetAvailability[]) {
    super('This vehicle is already reserved during the selected period.');
    this.name = 'AvailabilityConflictError';
  }
}

function assertValidRange(startDate: string, endDate: string): void {
  if (!startDate || !endDate || endDate < startDate) {
    throw new Error('Invalid date range');
  }
}

export function listAvailability(filter?: {
  vehicleId?: string | null;
}): FleetAvailability[] {
  const list = [...load().entries];
  const filtered = filter?.vehicleId
    ? list.filter((entry) => entry.vehicleId === filter.vehicleId)
    : list;
  return filtered.sort((a, b) => {
    const byStart = a.startDate.localeCompare(b.startDate);
    if (byStart !== 0) return byStart;
    return a.endDate.localeCompare(b.endDate);
  });
}

export function getAvailability(id: string): FleetAvailability | undefined {
  return load().entries.find((entry) => entry.id === id);
}

export function createAvailability(input: FleetAvailabilityInput): FleetAvailability {
  assertValidRange(input.startDate, input.endDate);
  const state = load();
  const conflicts = findOverlappingAvailability(
    state.entries,
    input.vehicleId,
    input.startDate,
    input.endDate,
  );
  if (conflicts.length > 0) {
    throw new AvailabilityConflictError(conflicts);
  }

  const entry: FleetAvailability = {
    id: createLocalId('fp'),
    vehicleId: input.vehicleId,
    startDate: input.startDate,
    endDate: input.endDate,
    status: input.status,
  };
  state.entries.push(entry);
  save(state);
  return entry;
}

export function updateAvailability(
  id: string,
  input: FleetAvailabilityInput,
): FleetAvailability {
  assertValidRange(input.startDate, input.endDate);
  const state = load();
  const index = state.entries.findIndex((entry) => entry.id === id);
  if (index < 0) {
    throw new Error('Availability not found');
  }

  const conflicts = findOverlappingAvailability(
    state.entries,
    input.vehicleId,
    input.startDate,
    input.endDate,
    id,
  );
  if (conflicts.length > 0) {
    throw new AvailabilityConflictError(conflicts);
  }

  const updated: FleetAvailability = {
    id,
    vehicleId: input.vehicleId,
    startDate: input.startDate,
    endDate: input.endDate,
    status: input.status,
  };
  state.entries[index] = updated;
  save(state);
  return updated;
}

export function deleteAvailability(id: string): boolean {
  const state = load();
  const next = state.entries.filter((entry) => entry.id !== id);
  if (next.length === state.entries.length) return false;
  save({ entries: next });
  return true;
}
