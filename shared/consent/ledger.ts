import { auditLogger } from '@/shared/audit'
import type { ConsentId, ConsentRecord, OrganizationId } from '@/shared/types'
import type { ConsentFilter, ConsentGrantInput, ConsentRevokeInput, IConsentLedger } from './types'

/**
 * Consent Ledger — in-memory stub.
 *
 * Satisfies the IConsentLedger interface with an in-memory store so that
 * all call sites are written against the permanent contract. The production
 * implementation will persist records to Supabase with Row-Level Security
 * enforcing tenant isolation.
 *
 * Append-only invariant: no record is ever removed from the store.
 * Revocation updates a record's status field — it does not delete the record.
 * This invariant must be preserved in all future implementations.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.11 — Consent & Rights Ledger.
 */
class ConsentLedger implements IConsentLedger {
  /** Primary store. Key is ConsentId. */
  private readonly records = new Map<ConsentId, ConsentRecord>()

  /** Secondary index: organizationId → Set<ConsentId> for O(1) org lookups. */
  private readonly byOrganization = new Map<OrganizationId, Set<ConsentId>>()

  async grant(input: ConsentGrantInput): Promise<ConsentRecord> {
    const record: ConsentRecord = {
      id: `consent_${crypto.randomUUID()}` as ConsentId,
      organizationId: input.organizationId,
      grantedBy: input.grantedBy,
      scope: input.scope,
      action: input.action,
      status: 'active',
      grantedAt: new Date(),
    }

    this.records.set(record.id, record)
    this.indexByOrganization(record.organizationId, record.id)

    await auditLogger.log({
      tenantId: input.tenantId,
      organizationId: input.organizationId,
      actor: { type: 'user', id: input.grantedBy },
      action: 'consent.granted',
      resourceType: 'consent',
      resourceId: record.id,
      outcome: 'success',
      metadata: { scope: input.scope, consentedAction: input.action },
    })

    return record
  }

  async revoke(input: ConsentRevokeInput): Promise<ConsentRecord> {
    const existing = this.records.get(input.consentId)

    if (!existing) {
      throw new Error(`[CONSENT_LEDGER] Consent record not found: ${input.consentId}`)
    }

    if (existing.organizationId !== input.organizationId) {
      throw new Error(
        `[CONSENT_LEDGER] Consent ${input.consentId} does not belong to organization ${input.organizationId}`
      )
    }

    // Update in place — the record is mutated to 'revoked', never deleted.
    const revoked: ConsentRecord = {
      ...existing,
      status: 'revoked',
      revokedAt: new Date(),
    }

    this.records.set(revoked.id, revoked)

    await auditLogger.log({
      tenantId: input.tenantId,
      organizationId: existing.organizationId,
      actor: { type: 'user', id: input.revokedBy },
      action: 'consent.revoked',
      resourceType: 'consent',
      resourceId: revoked.id,
      outcome: 'success',
      metadata: { scope: existing.scope, consentedAction: existing.action },
    })

    return revoked
  }

  async check(organizationId: OrganizationId, action: string): Promise<ConsentRecord | null> {
    const ids = this.byOrganization.get(organizationId)
    if (!ids) return null

    const now = new Date()

    for (const id of ids) {
      const record = this.records.get(id)
      if (!record) continue
      if (record.action !== action) continue
      if (record.status !== 'active') continue
      if (record.expiresAt && record.expiresAt <= now) continue
      return record
    }

    return null
  }

  async history(filter: ConsentFilter): Promise<ConsentRecord[]> {
    const ids = this.byOrganization.get(filter.organizationId)
    if (!ids) return []

    const now = new Date()
    const results: ConsentRecord[] = []

    for (const id of ids) {
      const record = this.records.get(id)
      if (!record) continue
      if (filter.scope && record.scope !== filter.scope) continue
      if (filter.action && record.action !== filter.action) continue
      if (filter.activeOnly) {
        if (record.status !== 'active') continue
        if (record.expiresAt && record.expiresAt <= now) continue
      }
      results.push(record)
    }

    return results
  }

  private indexByOrganization(organizationId: OrganizationId, consentId: ConsentId): void {
    const existing = this.byOrganization.get(organizationId) ?? new Set<ConsentId>()
    existing.add(consentId)
    this.byOrganization.set(organizationId, existing)
  }
}

export const consentLedger: IConsentLedger = new ConsentLedger()
