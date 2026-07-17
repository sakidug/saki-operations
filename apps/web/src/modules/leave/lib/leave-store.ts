import { hasPermission } from '@saki-operations/constants';
import type { AppPermission } from '@saki-operations/types';

import { createLocalId, readJson, writeJson } from '@/lib/local-persist';
import { emitSyncEvent } from '@/modules/sync/emit';

export type LeaveType = 'sick' | 'casual' | 'annual';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export type LeaveRequest = {
  id: string;
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
};

export type LeaveBalances = {
  sick: number;
  casual: number;
  annual: number;
};

const STORAGE_KEY = 'saki.ops.leave.v1';
const DEFAULT_BALANCES: LeaveBalances = { sick: 7, casual: 7, annual: 14 };

type LeaveStoreState = {
  balancesByEmployee: Record<string, LeaveBalances>;
  requests: LeaveRequest[];
};

function emptyState(): LeaveStoreState {
  return { balancesByEmployee: {}, requests: [] };
}

function load(): LeaveStoreState {
  return readJson<LeaveStoreState>(STORAGE_KEY, emptyState());
}

function save(state: LeaveStoreState): void {
  writeJson(STORAGE_KEY, state);
}

function ensureBalances(state: LeaveStoreState, employeeId: string): LeaveBalances {
  if (!state.balancesByEmployee[employeeId]) {
    state.balancesByEmployee[employeeId] = { ...DEFAULT_BALANCES };
  }
  return state.balancesByEmployee[employeeId];
}

export function getLeaveBalances(employeeId: string): LeaveBalances {
  const state = load();
  return { ...ensureBalances(state, employeeId) };
}

export function listLeaveRequests(employeeId?: string): LeaveRequest[] {
  const state = load();
  const list = employeeId
    ? state.requests.filter((r) => r.employeeId === employeeId)
    : [...state.requests];
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getLeaveRequest(id: string): LeaveRequest | undefined {
  return load().requests.find((r) => r.id === id);
}

export function countLeaveDays(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 0;
  }
  const ms = end.getTime() - start.getTime();
  return Math.floor(ms / 86_400_000) + 1;
}

export function applyLeave(input: {
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}): LeaveRequest {
  const state = load();
  ensureBalances(state, input.employeeId);
  const request: LeaveRequest = {
    id: createLocalId('leave'),
    employeeId: input.employeeId,
    type: input.type,
    startDate: input.startDate,
    endDate: input.endDate,
    reason: input.reason.trim(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  state.requests.push(request);
  save(state);
  void emitSyncEvent({
    entityType: 'leave',
    entityId: request.id,
    eventType: 'leave.requested',
    employeeId: input.employeeId,
    version: 1,
    payload: {
      type: request.type,
      startDate: request.startDate,
      endDate: request.endDate,
      reason: request.reason,
    },
  });
  return request;
}

function deductBalance(balances: LeaveBalances, type: LeaveType, days: number): void {
  balances[type] = Math.max(0, balances[type] - days);
}

export function decideLeaveRequest(input: {
  id: string;
  status: 'approved' | 'rejected';
  decidedBy: string;
}): LeaveRequest | undefined {
  const state = load();
  const request = state.requests.find((r) => r.id === input.id);
  if (!request || request.status !== 'pending') {
    return request;
  }

  request.status = input.status;
  request.decidedAt = new Date().toISOString();
  request.decidedBy = input.decidedBy;

  if (input.status === 'approved') {
    const balances = ensureBalances(state, request.employeeId);
    const days = countLeaveDays(request.startDate, request.endDate);
    deductBalance(balances, request.type, days);
  }

  save(state);
  void emitSyncEvent({
    entityType: 'leave',
    entityId: request.id,
    eventType: input.status === 'approved' ? 'leave.approved' : 'leave.rejected',
    employeeId: request.employeeId,
    version: 2,
    payload: {
      employeeId: request.employeeId,
      status: request.status,
      decidedAt: request.decidedAt,
      decidedBy: input.decidedBy,
    },
  });
  return { ...request };
}

/** Approved leave overlapping the current calendar month (for summary). */
export function getMonthCalendarSummary(employeeId: string, now = new Date()): LeaveRequest[] {
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  return listLeaveRequests(employeeId).filter((r) => {
    if (r.status !== 'approved') return false;
    const start = new Date(`${r.startDate}T00:00:00`);
    const end = new Date(`${r.endDate}T00:00:00`);
    return start <= monthEnd && end >= monthStart;
  });
}

export function canManageLeave(
  roleOrPermissions: string | readonly AppPermission[],
): boolean {
  if (Array.isArray(roleOrPermissions)) {
    return hasPermission(roleOrPermissions, 'leave.manage');
  }
  return roleOrPermissions === 'admin' || roleOrPermissions === 'office';
}
