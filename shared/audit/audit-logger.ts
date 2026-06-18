import { logger } from '@/shared/lib/logger'
import type { AuditEvent, AuditEventInput, AuditFilter, IAuditLogger } from './types'

/**
 * Console Audit Logger — development / pre-database stub.
 *
 * Writes structured audit events to the platform logger.
 * Query is not supported until the Supabase-backed implementation
 * is added in Phase 1 of the development roadmap.
 *
 * This implementation satisfies the IAuditLogger interface so that
 * all callers are written against the permanent contract. Replacing
 * this with the Supabase implementation requires no changes at call sites.
 *
 * See FOUNDATION_003_DEVELOPMENT_ROADMAP.md — Phase 1 exit criteria:
 * all AI actions must be logged, attributed, and auditable.
 */
class ConsoleAuditLogger implements IAuditLogger {
  async log(input: AuditEventInput): Promise<void> {
    const event: AuditEvent = {
      ...input,
      id: `audit_${crypto.randomUUID()}`,
      occurredAt: new Date(),
    }

    logger.info(`[AUDIT] ${event.action}`, {
      auditId: event.id,
      tenantId: event.tenantId,
      organizationId: event.organizationId,
      actorType: event.actor.type,
      actorId: event.actor.id,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      outcome: event.outcome,
    })
  }

  async query(_filter: AuditFilter): Promise<AuditEvent[]> {
    logger.warn(
      '[AUDIT] query() is not available on the console stub — returns empty. ' +
        'Connect Supabase to enable audit queries.',
      { tenantId: _filter.tenantId }
    )
    return []
  }
}

export const auditLogger: IAuditLogger = new ConsoleAuditLogger()
