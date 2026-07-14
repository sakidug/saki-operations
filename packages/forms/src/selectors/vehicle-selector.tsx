import { useCallback, useMemo, useState } from 'react';
import { Car, Filter, UserRound } from 'lucide-react';
import type { VehicleAvailability, VehicleSelectorItem } from '@saki-operations/types';
import { Badge, Button, cn } from '@saki-operations/ui';
import { motion, useReducedMotion } from 'framer-motion';

import { SelectorShell } from './selector-shell';
import { useDebouncedValue, useSelectorSearch } from './use-selector-search';

export type VehicleFilter = 'all' | VehicleAvailability;

export type VehicleSelectorProps = {
  items: VehicleSelectorItem[];
  value?: string | null;
  onChange: (vehicleId: string | null, vehicle?: VehicleSelectorItem) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  filter?: VehicleFilter;
  onFilterChange?: (filter: VehicleFilter) => void;
};

function vehicleHaystack(item: VehicleSelectorItem) {
  return [
    item.name,
    item.registrationNumber,
    item.make,
    item.model,
    item.assignedDriverName,
    item.availability,
  ];
}

function availabilityBadge(availability: VehicleAvailability) {
  if (availability === 'available') return { label: 'Available', variant: 'success' as const };
  if (availability === 'assigned') return { label: 'Assigned', variant: 'warning' as const };
  return { label: 'Unavailable', variant: 'danger' as const };
}

/**
 * Premium vehicle card selector with search + availability filter.
 * Unavailable options render disabled — presentational only.
 */
export function VehicleSelector({
  items,
  value,
  onChange,
  label = 'Vehicle',
  description = 'Choose an available vehicle.',
  disabled,
  className,
  filter: controlledFilter,
  onFilterChange,
}: VehicleSelectorProps) {
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState('');
  const [internalFilter, setInternalFilter] = useState<VehicleFilter>('all');
  const filter = controlledFilter ?? internalFilter;
  const setFilter = onFilterChange ?? setInternalFilter;

  const debouncedQuery = useDebouncedValue(query, 180);
  const getHaystack = useCallback(vehicleHaystack, []);
  const searched = useSelectorSearch(items, debouncedQuery, getHaystack);

  const filtered = useMemo(() => {
    if (filter === 'all') return searched;
    return searched.filter((item) => item.availability === filter);
  }, [searched, filter]);

  const filters: Array<{ id: VehicleFilter; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'available', label: 'Available' },
    { id: 'assigned', label: 'Assigned' },
    { id: 'unavailable', label: 'Unavailable' },
  ];

  return (
    <SelectorShell
      label={label}
      description={description}
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder="Search vehicle, plate, or driver…"
      listLabel="Vehicles"
      className={className}
      toolbar={
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter vehicles">
          <Filter className="hidden size-4 self-center text-muted-foreground sm:block" aria-hidden />
          {filters.map((item) => (
            <Button
              key={item.id}
              type="button"
              size="sm"
              variant={filter === item.id ? 'default' : 'outline'}
              className="h-9 min-h-9"
              aria-pressed={filter === item.id}
              disabled={disabled}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      }
    >
      {filtered.length === 0 ? (
        <p className="px-3 py-8 text-center text-sm text-muted-foreground">No vehicles match.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((vehicle, index) => {
            const selected = value === vehicle.id;
            const unavailable = vehicle.availability === 'unavailable';
            const badge = availabilityBadge(vehicle.availability);

            return (
              <motion.button
                key={vehicle.id}
                type="button"
                role="option"
                aria-selected={selected}
                aria-disabled={unavailable || disabled}
                disabled={disabled || unavailable}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduceMotion ? { duration: 0 } : { delay: Math.min(index * 0.03, 0.2) }}
                onClick={() => onChange(vehicle.id, vehicle)}
                className={cn(
                  'group flex min-h-[11rem] flex-col overflow-hidden rounded-2xl border border-border bg-background/40 text-left transition',
                  'hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  'disabled:cursor-not-allowed disabled:opacity-45',
                  selected && 'border-primary ring-1 ring-primary/40',
                )}
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                  {vehicle.photoUrl ? (
                    <img
                      src={vehicle.photoUrl}
                      alt=""
                      className="size-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <Car className="size-10 opacity-60" aria-hidden />
                    </div>
                  )}
                  <Badge variant={badge.variant} className="absolute left-2 top-2">
                    {badge.label}
                  </Badge>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <div>
                    <p className="font-semibold leading-tight">{vehicle.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                      {vehicle.registrationNumber}
                    </p>
                  </div>
                  <div className="mt-auto flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">Seats {vehicle.capacity}</Badge>
                    {vehicle.assignedDriverName ? (
                      <span className="inline-flex items-center gap-1">
                        <UserRound className="size-3.5" aria-hidden />
                        {vehicle.assignedDriverName}
                      </span>
                    ) : (
                      <span>No driver assigned</span>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </SelectorShell>
  );
}
