import { blobToDataUrl, type AcceptedOdometerReading } from '@saki-operations/ocr/core';

import {
  calculateTotalKm,
  calculateWorkingHours,
  parseOdometerNumber,
} from './calculations';
import {
  createEmptyHooks,
  runValidators,
  type SessionExtensionHooks,
} from './extensions';
import {
  createIndexedDbSessionRepository,
  type SessionRepository,
} from './storage/indexed-db-repository';
import type {
  CreateSessionInput,
  EvidenceTypeId,
  OperationsSession,
  OperationsSessionStatus,
  SessionCustomFields,
  SessionEvidenceItem,
} from './types';
import {
  BUILTIN_EVIDENCE_TYPES,
  canTransitionSessionStatus,
} from './types';
import { createId, nowIso } from './utils/ids';

export type OperationsSessionEngineOptions = {
  repository?: SessionRepository;
  hooks?: SessionExtensionHooks;
};

export type AddEvidenceInput = {
  sessionId: string;
  type: EvidenceTypeId;
  photoDataUrl?: string | null;
  photoBlob?: Blob | null;
  mimeType?: string | null;
  fileName?: string | null;
  timestamp?: string;
  metadata?: Record<string, unknown>;
  ocr?: SessionEvidenceItem['ocr'];
};

export type AttachOdometerReadingInput = {
  sessionId: string;
  /** Which odometer slot this reading fills */
  slot: 'start' | 'end';
  reading: AcceptedOdometerReading;
  evidenceType?: EvidenceTypeId;
  metadata?: Record<string, unknown>;
};

/**
 * Reusable Operations Session Engine.
 * Powers future Tours and HHCO UIs — contains no brand/module UI.
 */
export class OperationsSessionEngine {
  private readonly repo: SessionRepository;
  private readonly hooks: SessionExtensionHooks;

  constructor(options: OperationsSessionEngineOptions = {}) {
    this.repo = options.repository ?? createIndexedDbSessionRepository();
    const empty = createEmptyHooks();
    this.hooks = {
      beforeTransition: [...(empty.beforeTransition ?? []), ...(options.hooks?.beforeTransition ?? [])],
      beforeComplete: [...(empty.beforeComplete ?? []), ...(options.hooks?.beforeComplete ?? [])],
      afterPersist: [...(empty.afterPersist ?? []), ...(options.hooks?.afterPersist ?? [])],
    };
  }

  getRepository(): SessionRepository {
    return this.repo;
  }

  getHooks(): SessionExtensionHooks {
    return this.hooks;
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  async createDraft(input: CreateSessionInput): Promise<OperationsSession> {
    const stamp = nowIso();
    const session: OperationsSession = {
      id: createId('session'),
      status: 'draft',
      moduleId: input.moduleId,
      employeeId: input.employeeId,
      vehicleId: input.vehicleId ?? null,
      companyId: input.companyId ?? null,
      driverId: input.driverId ?? null,
      assistantIds: [...(input.assistantIds ?? [])],
      operatorId: input.operatorId ?? null,
      startTime: null,
      endTime: null,
      workingDurationMs: null,
      startOdometer: null,
      endOdometer: null,
      totalKm: null,
      distanceKm: null,
      customFields: { ...(input.customFields ?? {}) },
      evidenceIds: [],
      offlineStatus: 'local',
      uploadStatus: 'pending',
      revision: 1,
      createdAt: stamp,
      updatedAt: stamp,
    };
    return this.persist(session);
  }

  async getSession(id: string): Promise<OperationsSession | null> {
    return this.repo.getSession(id);
  }

  /** Crash recovery — unfinished sessions for an employee / module. */
  async resumeUnfinished(filter?: {
    moduleId?: string;
    employeeId?: string;
  }): Promise<OperationsSession[]> {
    return this.repo.listUnfinished(filter);
  }

  async listSessions(filter?: {
    status?: OperationsSessionStatus | OperationsSessionStatus[];
    moduleId?: string;
    employeeId?: string;
    vehicleId?: string;
  }): Promise<OperationsSession[]> {
    return this.repo.listSessions(filter);
  }

  /**
   * List sessions that currently occupy a vehicle.
   * Model support for one-active-per-vehicle — does **not** enforce uniqueness.
   */
  async listActiveByVehicle(
    vehicleId: string,
    filter?: { moduleId?: string },
  ): Promise<OperationsSession[]> {
    return this.repo.listVehicleOccupying(vehicleId, filter);
  }

  async setVehicle(sessionId: string, vehicleId: string | null): Promise<OperationsSession> {
    const session = await this.requireSession(sessionId);
    return this.persist({
      ...session,
      vehicleId,
      updatedAt: nowIso(),
      revision: session.revision + 1,
    });
  }

  /**
   * Set Operations V2 company / crew fields. Does not validate vehicle uniqueness.
   */
  async setOperationCrew(
    sessionId: string,
    crew: {
      companyId?: string | null;
      driverId?: string | null;
      assistantIds?: readonly string[];
      operatorId?: string | null;
    },
  ): Promise<OperationsSession> {
    const session = await this.requireSession(sessionId);
    return this.persist({
      ...session,
      companyId: crew.companyId !== undefined ? crew.companyId : session.companyId,
      driverId: crew.driverId !== undefined ? crew.driverId : session.driverId,
      assistantIds:
        crew.assistantIds !== undefined ? [...crew.assistantIds] : session.assistantIds,
      operatorId: crew.operatorId !== undefined ? crew.operatorId : session.operatorId,
      updatedAt: nowIso(),
      revision: session.revision + 1,
      offlineStatus: session.status === 'synced' ? session.offlineStatus : 'local',
      uploadStatus: session.status === 'synced' ? session.uploadStatus : 'pending',
    });
  }

  async patchCustomFields(
    sessionId: string,
    patch: SessionCustomFields,
  ): Promise<OperationsSession> {
    const session = await this.requireSession(sessionId);
    return this.persist({
      ...session,
      customFields: { ...session.customFields, ...patch },
      updatedAt: nowIso(),
      revision: session.revision + 1,
      offlineStatus: session.status === 'synced' ? session.offlineStatus : 'local',
      uploadStatus: session.status === 'synced' ? session.uploadStatus : 'pending',
    });
  }

  /**
   * draft → started. Sets startTime if missing.
   */
  async start(sessionId: string, startTimeIso?: string): Promise<OperationsSession> {
    return this.transition(sessionId, 'started', (session) => ({
      ...session,
      startTime: startTimeIso ?? session.startTime ?? nowIso(),
    }));
  }

  /** started → in_progress (ongoing work). */
  async markInProgress(sessionId: string): Promise<OperationsSession> {
    return this.transition(sessionId, 'in_progress');
  }

  /**
   * started | in_progress → completed.
   * Computes working hours + total KM when inputs exist.
   */
  async complete(sessionId: string, endTimeIso?: string): Promise<OperationsSession> {
    const current = await this.requireSession(sessionId);
    const evidence = await this.repo.listEvidenceForSession(sessionId);
    await runValidators(this.hooks.beforeComplete, {
      session: current,
      evidence,
      transition: 'complete',
    });

    const endTime = endTimeIso ?? current.endTime ?? nowIso();
    let workingDurationMs = current.workingDurationMs;
    if (current.startTime) {
      workingDurationMs = calculateWorkingHours(current.startTime, endTime).durationMs;
    }

    let totalKm = current.totalKm;
    if (current.startOdometer != null && current.endOdometer != null) {
      totalKm = calculateTotalKm(current.startOdometer, current.endOdometer).totalKm;
    }

    return this.transition(sessionId, 'completed', (session) => ({
      ...session,
      endTime,
      workingDurationMs,
      totalKm,
      // Operations V2 — distance calculated at completion (mirrors totalKm)
      distanceKm: totalKm ?? session.distanceKm ?? null,
      offlineStatus: 'queued',
      uploadStatus: 'pending',
    }));
  }

  /** completed → synced (after successful upload). */
  async markSynced(sessionId: string): Promise<OperationsSession> {
    return this.transition(sessionId, 'synced', (session) => ({
      ...session,
      offlineStatus: 'local',
      uploadStatus: 'synced',
    }));
  }

  async recomputeDerivedFields(sessionId: string): Promise<OperationsSession> {
    const session = await this.requireSession(sessionId);
    let workingDurationMs = session.workingDurationMs;
    let totalKm = session.totalKm;

    if (session.startTime && session.endTime) {
      workingDurationMs = calculateWorkingHours(session.startTime, session.endTime).durationMs;
    }
    if (session.startOdometer != null && session.endOdometer != null) {
      totalKm = calculateTotalKm(session.startOdometer, session.endOdometer).totalKm;
    }

    return this.persist({
      ...session,
      workingDurationMs,
      totalKm,
      updatedAt: nowIso(),
      revision: session.revision + 1,
    });
  }

  async setStartTime(sessionId: string, iso?: string): Promise<OperationsSession> {
    const session = await this.requireSession(sessionId);
    return this.persist({
      ...session,
      startTime: iso ?? session.startTime ?? nowIso(),
      updatedAt: nowIso(),
      revision: session.revision + 1,
    });
  }

  async setEndTime(sessionId: string, iso?: string): Promise<OperationsSession> {
    const session = await this.requireSession(sessionId);
    const endTime = iso ?? nowIso();
    let workingDurationMs = session.workingDurationMs;
    if (session.startTime) {
      workingDurationMs = calculateWorkingHours(session.startTime, endTime).durationMs;
    }
    return this.persist({
      ...session,
      endTime,
      workingDurationMs,
      updatedAt: nowIso(),
      revision: session.revision + 1,
    });
  }

  /**
   * Override working duration (e.g. multi-day sum of daily hours instead of wall-clock span).
   */
  async setWorkingDurationMs(
    sessionId: string,
    durationMs: number,
  ): Promise<OperationsSession> {
    const session = await this.requireSession(sessionId);
    if (!Number.isFinite(durationMs) || durationMs < 0) {
      throw new Error('Working duration must be a non-negative finite number');
    }
    return this.persist({
      ...session,
      workingDurationMs: durationMs,
      updatedAt: nowIso(),
      revision: session.revision + 1,
    });
  }

  async setOdometers(
    sessionId: string,
    values: { start?: number | null; end?: number | null },
  ): Promise<OperationsSession> {
    const session = await this.requireSession(sessionId);
    const startOdometer =
      values.start !== undefined ? values.start : session.startOdometer;
    const endOdometer = values.end !== undefined ? values.end : session.endOdometer;
    let totalKm = session.totalKm;
    if (startOdometer != null && endOdometer != null) {
      totalKm = calculateTotalKm(startOdometer, endOdometer).totalKm;
    } else {
      totalKm = null;
    }
    return this.persist({
      ...session,
      startOdometer,
      endOdometer,
      totalKm,
      updatedAt: nowIso(),
      revision: session.revision + 1,
    });
  }

  // ---------------------------------------------------------------------------
  // Evidence + OCR
  // ---------------------------------------------------------------------------

  async addEvidence(input: AddEvidenceInput): Promise<{
    session: OperationsSession;
    evidence: SessionEvidenceItem;
  }> {
    const session = await this.requireSession(input.sessionId);
    const stamp = nowIso();

    let photoDataUrl = input.photoDataUrl ?? null;
    let mimeType = input.mimeType ?? null;
    let byteSize: number | null = null;

    if (input.photoBlob) {
      photoDataUrl = await blobToDataUrl(input.photoBlob);
      mimeType = input.photoBlob.type || mimeType || 'image/jpeg';
      byteSize = input.photoBlob.size;
    } else if (photoDataUrl) {
      // approximate size from data URL
      byteSize = Math.floor((photoDataUrl.length * 3) / 4);
    }

    const evidence: SessionEvidenceItem = {
      id: createId('evidence'),
      sessionId: session.id,
      type: input.type,
      photoDataUrl,
      mimeType,
      byteSize,
      fileName: input.fileName ?? null,
      timestamp: input.timestamp ?? stamp,
      offlineStatus: 'queued',
      uploadStatus: 'pending',
      ocr: input.ocr ?? null,
      metadata: { ...(input.metadata ?? {}) },
      createdAt: stamp,
      updatedAt: stamp,
    };

    await this.repo.putEvidence(evidence);

    const next = await this.persist({
      ...session,
      evidenceIds: [...session.evidenceIds, evidence.id],
      updatedAt: stamp,
      revision: session.revision + 1,
      offlineStatus: 'local',
      uploadStatus: session.status === 'synced' ? session.uploadStatus : 'pending',
    });

    return { session: next, evidence };
  }

  /**
   * Integrate OCR accept result into session evidence + odometer fields.
   */
  async attachOdometerReading(input: AttachOdometerReadingInput): Promise<{
    session: OperationsSession;
    evidence: SessionEvidenceItem;
  }> {
    const { reading, slot } = input;
    const type =
      input.evidenceType ??
      (slot === 'start'
        ? BUILTIN_EVIDENCE_TYPES.startOdometer
        : BUILTIN_EVIDENCE_TYPES.endOdometer);

    const { session, evidence } = await this.addEvidence({
      sessionId: input.sessionId,
      type,
      photoBlob: reading.photo.blob,
      mimeType: reading.photo.mimeType,
      fileName: reading.photo.fileName,
      timestamp: reading.photo.capturedAt,
      ocr: {
        ocrValue: reading.ocrDetectedValue ?? reading.ocr.value,
        finalValue: reading.value,
        confidence: reading.confidence,
        manuallyEdited: reading.manuallyEdited,
      },
      metadata: {
        ...(input.metadata ?? {}),
        clientLocalId: reading.photo.clientLocalId,
        ocrProvider: reading.ocr.meta?.providerId ?? null,
        source: reading.source,
        verifiedManually: reading.verifiedManually,
        ocrDetectedValue: reading.ocrDetectedValue,
      },
    });

    const km = parseOdometerNumber(reading.value);
    const patched =
      slot === 'start'
        ? { ...session, startOdometer: km }
        : { ...session, endOdometer: km };

    let totalKm = patched.totalKm;
    if (patched.startOdometer != null && patched.endOdometer != null) {
      totalKm = calculateTotalKm(patched.startOdometer, patched.endOdometer).totalKm;
    }

    const saved = await this.persist({
      ...patched,
      totalKm,
      updatedAt: nowIso(),
      revision: patched.revision + 1,
    });

    return { session: saved, evidence };
  }

  async listEvidence(sessionId: string): Promise<SessionEvidenceItem[]> {
    await this.requireSession(sessionId);
    return this.repo.listEvidenceForSession(sessionId);
  }

  async setEvidenceUploadStatus(
    evidenceId: string,
    uploadStatus: SessionEvidenceItem['uploadStatus'],
  ): Promise<SessionEvidenceItem> {
    const item = await this.repo.getEvidence(evidenceId);
    if (!item) throw new Error(`Evidence not found: ${evidenceId}`);
    const next: SessionEvidenceItem = {
      ...item,
      uploadStatus,
      offlineStatus: uploadStatus === 'synced' ? 'local' : item.offlineStatus,
      updatedAt: nowIso(),
    };
    return this.repo.putEvidence(next);
  }

  /** Sessions waiting to upload after completion. */
  async listPendingSync(): Promise<OperationsSession[]> {
    return this.repo.listSessions({ status: 'completed' });
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  private async requireSession(id: string): Promise<OperationsSession> {
    const session = await this.repo.getSession(id);
    if (!session) throw new Error(`Session not found: ${id}`);
    return session;
  }

  private async transition(
    sessionId: string,
    to: OperationsSessionStatus,
    mutate?: (session: OperationsSession) => OperationsSession,
  ): Promise<OperationsSession> {
    const current = await this.requireSession(sessionId);
    if (!canTransitionSessionStatus(current.status, to)) {
      throw new Error(`Invalid session transition: ${current.status} → ${to}`);
    }

    const evidence = await this.repo.listEvidenceForSession(sessionId);
    await runValidators(this.hooks.beforeTransition, {
      session: current,
      evidence,
      transition:
        to === 'started'
          ? 'start'
          : to === 'in_progress'
            ? 'mark_in_progress'
            : to === 'completed'
              ? 'complete'
              : 'mark_synced',
    });

    const base = mutate ? mutate(current) : current;
    return this.persist({
      ...base,
      status: to,
      updatedAt: nowIso(),
      revision: current.revision + 1,
    });
  }

  private async persist(session: OperationsSession): Promise<OperationsSession> {
    const saved = await this.repo.putSession(session);
    if (this.hooks.afterPersist?.length) {
      for (const hook of this.hooks.afterPersist) {
        await hook(saved);
      }
    }
    return saved;
  }
}

let defaultEngine: OperationsSessionEngine | null = null;

export function getDefaultOperationsSessionEngine(): OperationsSessionEngine {
  if (!defaultEngine) defaultEngine = new OperationsSessionEngine();
  return defaultEngine;
}

export function setDefaultOperationsSessionEngine(
  engine: OperationsSessionEngine | null,
): void {
  defaultEngine = engine;
}
