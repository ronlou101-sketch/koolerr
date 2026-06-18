import type { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/shared/lib/logger'
import type { AuditEvent, AuditEventInput, AuditFilter, IAuditLogger } from './types'

/**
 * Supabase Audit Logger
 *
 * Persists all audit events to the `audit_events` table. Replaces the
 * ConsoleAuditLogger stub at bootstrap time via _configureAuditLogger().
 *
 * Outcome mapping: the DB schema uses CHECK ('success', 'denied', 'error') but
 * the TypeScript AuditOutcome type uses 'failure'. 'failure' maps to 'error'
 * on write and back on read, keeping DB constraints and TypeScript semantics
 * consistent without a migration change.
 *
 * The log() method never throws — audit failures must not interrupt callers.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §8.5 — Auditability.
 * See FOUNDATION_003_DEVELOPMENT_ROADMAP.md — Phase 1 exit criteria.
 */

type DbOutcome = 'success' | 'denied' | 'error'

function toDbOutcome(outcome: 'success' | 'failure' | 'denied'): DbOutcome {
  return outcome === 'failure' ? 'error' : outcome
}

function fromDbOutcome(outcome: DbOutcome): 'success' | 'failure' | 'denied' {
  return outcome === 'error' ? 'failure' : outcome
}

export class SupabaseAuditLogger implements IAuditLogger {
  constructor(private readonly client: SupabaseClient) {}

  async log(input: AuditEventInput): Promise<void> {
    const id = `audit_${crypto.randomUUID()}`
    const { error } = await this.client.from('audit_events').insert({
      id,
      tenant_id: input.tenantId,
      organization_id: input.organizationId,
      actor_type: input.actor.type,
      actor_id: input.actor.id,
      action: input.action,
      resource_type: input.resourceType,
      resource_id: input.resourceId,
      outcome: toDbOutcome(input.outcome),
      metadata: input.metadata ?? {},
    })

    if (error) {
      // Demote to a warning so audit failures never interrupt the calling flow.
      logger.warn('[AUDIT] Failed to persist audit event', {
        action: input.action,
        error: error.message,
      })
    }
  }

  async query(filter: AuditFilter): Promise<AuditEvent[]> {
    let q = this.client
      .from('audit_events')
      .select('*')
      .eq('tenant_id', filter.tenantId)
      .order('occurred_at', { ascending: false })
      .limit(filter.limit ?? 100)

    if (filter.organizationId) q = q.eq('organization_id', filter.organizationId)
    if (filter.action) q = q.eq('action', filter.action)
    if (filter.resourceType) q = q.eq('resource_type', filter.resourceType)
    if (filter.resourceId) q = q.eq('resource_id', filter.resourceId)
    if (filter.outcome) q = q.eq('outcome', toDbOutcome(filter.outcome))
    if (filter.from) q = q.gte('occurred_at', filter.from.toISOString())
    if (filter.to) q = q.lte('occurred_at', filter.to.toISOString())

    const { data, error } = await q

    if (error) {
      logger.warn('[AUDIT] Failed to query audit events', { error: error.message })
      return []
    }

    return (data ?? []).map((row) => ({
      id: row.id as string,
      tenantId: row.tenant_id,
      organizationId: row.organization_id,
      actor: { type: row.actor_type, id: row.actor_id },
      action: row.action,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      outcome: fromDbOutcome(row.outcome as DbOutcome),
      metadata: row.metadata ?? {},
      occurredAt: new Date(row.occurred_at as string),
    }))
  }
}
