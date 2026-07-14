import type { OperationsSession, OperationsSessionStatus } from '@saki-operations/operations-session';

import { findFleetVehicle } from '../data/fleet-catalog';
import { hireTypeLabelKey, isMultiDay } from '../types';

export const ACTIVE_OPERATION_STATUSES: readonly OperationsSessionStatus[] = [
  'started',
  'in_progress',
];

export function isActiveOperationStatus(status: OperationsSessionStatus): boolean {
  return status === 'started' || status === 'in_progress';
}

export function getSessionVehicleLabel(session: OperationsSession): string {
  const name =
    typeof session.customFields.vehicleName === 'string'
      ? session.customFields.vehicleName
      : findFleetVehicle(session.vehicleId ?? '')?.name;
  const registration =
    typeof session.customFields.vehicleRegistration === 'string'
      ? session.customFields.vehicleRegistration
      : findFleetVehicle(session.vehicleId ?? '')?.registrationNumber;

  if (name && registration) return `${name} · ${registration}`;
  return name ?? registration ?? session.vehicleId ?? '—';
}

export function getSessionVehicleName(session: OperationsSession): string {
  if (typeof session.customFields.vehicleName === 'string') {
    return session.customFields.vehicleName;
  }
  return findFleetVehicle(session.vehicleId ?? '')?.name ?? session.vehicleId ?? '—';
}

export function getSessionHireTypeKey(session: OperationsSession): string {
  return hireTypeLabelKey(session.customFields.hireType);
}

export function getSessionStringField(session: OperationsSession, key: string): string {
  const value = session.customFields[key];
  return typeof value === 'string' && value.trim() ? value : '—';
}

export function getSessionNumberOfDays(session: OperationsSession): number {
  const value = session.customFields.numberOfDays;
  return typeof value === 'number' && value >= 1 ? value : 1;
}

export function isMultiDaySession(session: OperationsSession): boolean {
  if (session.customFields.multiDay === true) return true;
  return isMultiDay(getSessionNumberOfDays(session));
}

export function formatOperationTime(iso: string | null | undefined, locale: string): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatOperationDateTime(iso: string | null | undefined, locale: string): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatWorkingHoursLabel(durationMs: number | null | undefined): string {
  if (durationMs == null || !Number.isFinite(durationMs) || durationMs < 0) return '—';
  const totalSeconds = Math.floor(durationMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours === 0) parts.push(`${minutes}m`);
  if (hours === 0 && minutes === 0) parts.push(`${seconds}s`);
  return parts.join(' ');
}

export function formatKm(value: number | null | undefined, locale: string): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat(locale).format(value);
}
