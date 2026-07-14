import { useCallback, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Filter, Phone } from 'lucide-react';
import type { EmployeeSelectorItem } from '@saki-operations/types';
import { Avatar, AvatarFallback, AvatarImage, Badge, Button, cn } from '@saki-operations/ui';

import { SelectorShell } from './selector-shell';
import { useDebouncedValue, useSelectorSearch } from './use-selector-search';

export type EmployeeRoleFilter = 'all' | EmployeeSelectorItem['role'];

export type EmployeeSelectorProps = {
  items: EmployeeSelectorItem[];
  /** Single-select id, or multi-select ids when `multiple` is true. */
  value?: string | string[] | null;
  onChange: (next: string | string[] | null, employees?: EmployeeSelectorItem[]) => void;
  multiple?: boolean;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  roleFilter?: EmployeeRoleFilter;
  onRoleFilterChange?: (role: EmployeeRoleFilter) => void;
  availabilityFilter?: 'all' | 'available' | 'unavailable';
};

function employeeHaystack(item: EmployeeSelectorItem) {
  return [item.displayName, item.employeeId, item.phone, item.role];
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function roleLabel(role: EmployeeSelectorItem['role']) {
  switch (role) {
    case 'driver':
      return 'Driver';
    case 'assistant':
      return 'Assistant';
    case 'office':
      return 'Office';
    case 'admin':
      return 'Admin';
    default:
      return role;
  }
}

/**
 * Employee selector — Driver / Assistant / Office / Admin with single or multi select.
 */
export function EmployeeSelector({
  items,
  value,
  onChange,
  multiple = false,
  label = 'Employee',
  description = 'Search and select staff by role.',
  disabled,
  className,
  roleFilter: controlledRole,
  onRoleFilterChange,
  availabilityFilter = 'all',
}: EmployeeSelectorProps) {
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState('');
  const [internalRole, setInternalRole] = useState<EmployeeRoleFilter>('all');
  const roleFilter = controlledRole ?? internalRole;
  const setRoleFilter = onRoleFilterChange ?? setInternalRole;

  const debouncedQuery = useDebouncedValue(query, 180);
  const getHaystack = useCallback(employeeHaystack, []);
  const searched = useSelectorSearch(items, debouncedQuery, getHaystack);

  const filtered = useMemo(() => {
    return searched.filter((item) => {
      if (roleFilter !== 'all' && item.role !== roleFilter) return false;
      if (availabilityFilter === 'available' && !item.available) return false;
      if (availabilityFilter === 'unavailable' && item.available) return false;
      return true;
    });
  }, [searched, roleFilter, availabilityFilter]);

  const selectedIds = useMemo(() => {
    if (value == null) return new Set<string>();
    return new Set(Array.isArray(value) ? value : [value]);
  }, [value]);

  const toggle = (employee: EmployeeSelectorItem) => {
    if (disabled || !employee.available) return;

    if (!multiple) {
      onChange(employee.id, [employee]);
      return;
    }

    const next = new Set(selectedIds);
    if (next.has(employee.id)) next.delete(employee.id);
    else next.add(employee.id);
    const ids = [...next];
    onChange(
      ids,
      items.filter((item) => next.has(item.id)),
    );
  };

  const roles: Array<{ id: EmployeeRoleFilter; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'driver', label: 'Driver' },
    { id: 'assistant', label: 'Assistant' },
    { id: 'office', label: 'Office' },
    { id: 'admin', label: 'Admin' },
  ];

  return (
    <SelectorShell
      label={label}
      description={description}
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder="Search name, employee ID, or phone…"
      listLabel="Employees"
      className={className}
      toolbar={
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by role">
          <Filter className="hidden size-4 self-center text-muted-foreground sm:block" aria-hidden />
          {roles.map((role) => (
            <Button
              key={role.id}
              type="button"
              size="sm"
              variant={roleFilter === role.id ? 'default' : 'outline'}
              className="h-9 min-h-9"
              aria-pressed={roleFilter === role.id}
              disabled={disabled}
              onClick={() => setRoleFilter(role.id)}
            >
              {role.label}
            </Button>
          ))}
        </div>
      }
    >
      {filtered.length === 0 ? (
        <p className="px-3 py-8 text-center text-sm text-muted-foreground">No employees match.</p>
      ) : (
        <ul className="space-y-2" role={multiple ? 'group' : undefined}>
          {filtered.map((employee, index) => {
            const selected = selectedIds.has(employee.id);
            const unavailable = !employee.available;

            return (
              <motion.li
                key={employee.id}
                role="option"
                aria-selected={selected}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduceMotion ? { duration: 0 } : { delay: Math.min(index * 0.02, 0.16) }}
              >
                <button
                  type="button"
                  disabled={disabled || unavailable}
                  onClick={() => toggle(employee)}
                  className={cn(
                    'flex min-h-16 w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-left transition',
                    'hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    selected && 'border-primary/50 bg-primary/10',
                  )}
                >
                  <Avatar className="size-12">
                    {employee.photoUrl ? <AvatarImage src={employee.photoUrl} alt="" /> : null}
                    <AvatarFallback>{initials(employee.displayName) || '?'}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{employee.displayName}</span>
                      <Badge variant="outline">{roleLabel(employee.role)}</Badge>
                      <Badge variant={employee.available ? 'success' : 'danger'}>
                        {employee.available ? 'Available' : 'Unavailable'}
                      </Badge>
                    </span>
                    <span className="flex flex-col gap-0.5 text-xs text-muted-foreground sm:flex-row sm:gap-3">
                      <span className="font-mono">{employee.employeeId}</span>
                      {employee.phone ? (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="size-3.5" aria-hidden />
                          {employee.phone}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'flex size-6 shrink-0 items-center justify-center rounded-full border border-border',
                      selected && 'border-primary bg-primary text-primary-foreground',
                    )}
                    aria-hidden
                  >
                    {selected ? <Check className="size-3.5" /> : null}
                  </span>
                </button>
              </motion.li>
            );
          })}
        </ul>
      )}
    </SelectorShell>
  );
}
