/**
 * Extensibility hooks — modules register validators / transforms without forking the engine.
 */

import type { OperationsSession, SessionEvidenceItem, SessionTransition } from './types';

export type SessionValidationContext = {
  session: OperationsSession;
  evidence: SessionEvidenceItem[];
  transition?: SessionTransition;
};

export type SessionValidator = (
  ctx: SessionValidationContext,
) => void | Promise<void>;

export type SessionExtensionHooks = {
  /** Run before durable writes that change status */
  beforeTransition?: SessionValidator[];
  /** Run before marking a session complete */
  beforeComplete?: SessionValidator[];
  /** Run after any successful persistence */
  afterPersist?: Array<(session: OperationsSession) => void | Promise<void>>;
};

export function createEmptyHooks(): SessionExtensionHooks {
  return {
    beforeTransition: [],
    beforeComplete: [],
    afterPersist: [],
  };
}

export async function runValidators(
  validators: SessionValidator[] | undefined,
  ctx: SessionValidationContext,
): Promise<void> {
  if (!validators?.length) return;
  for (const validate of validators) {
    await validate(ctx);
  }
}
