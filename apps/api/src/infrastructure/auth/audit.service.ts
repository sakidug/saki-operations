import { Injectable, Logger } from '@nestjs/common';

export type AuditEvent = {
  action: string;
  actorId?: string;
  metadata?: Record<string, unknown>;
  at: string;
};

/**
 * Audit logging hook — console sink for now; swap for durable store later.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger('Audit');
  private readonly events: AuditEvent[] = [];

  record(action: string, actorId?: string, metadata?: Record<string, unknown>) {
    const event: AuditEvent = {
      action,
      actorId,
      metadata,
      at: new Date().toISOString(),
    };
    this.events.push(event);
    this.logger.log(JSON.stringify(event));
  }

  /** Test/introspection helper — not exposed via HTTP. */
  list(): AuditEvent[] {
    return [...this.events];
  }
}
