import { logger } from '@/shared/lib/logger'
import type { AuditEvent, AuditEventInput, AuditFilter, IAuditLogger } from './types'

/**
 * Console Audit Logger — development fallback.
 *
 * Active before bootstrap calls _configureAuditLogger(). Writes structured
 * events to the platform logger so the audit contract is visible during
 * local development without Supabase. The Supabase-backed implementation
 * is wired in at bootstrap and takes over from that point forward.
 *
 * See FOUNDATION_003_DEVELOPMENT_ROADMAP.md — Phase 1 exit criteria.
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
    logger.warn('[AUDIT] query() not available on console fallback — connect Supabase.', {
      tenantId: _filter.tenantId,
    })
    return []
  }
}

let _impl: IAuditLogger = new ConsoleAuditLogger()

/**
 * Replace the active audit logger implementation.
 * Called once during bootstrap to swap in the Supabase-backed logger.
 * All in-flight and future calls automatically use the new implementation.
 */
export function _configureAuditLogger(impl: IAuditLogger): void {
  _impl = impl
}

export const auditLogger: IAuditLogger = {
  log: (input) => _impl.log(input),
  query: (filter) => _impl.query(filter),
}
