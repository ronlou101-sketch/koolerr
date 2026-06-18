import { auditLogger } from '@/shared/audit'
import type { ConsentId, ConsentRecord, OrganizationId } from '@/shared/types'
import type { ConsentFilter, ConsentGrantInput, ConsentRevokeInput, IConsentLedger } from './types'
import type { IConsentRepository } from './repository'
import { InMemoryConsentRepository } from './in-memory-repository'

/**
 * Consent Ledger
 *
 * Satisfies the IConsentLedger interface backed by an IConsentRepository.
 * Defaults to in-memory; bootstrap swaps in the Supabase repository.
 *
 * Append-only invariant: no record is ever removed from the store.
 * Revocation updates a record's status field — it does not delete the record.
 * This invariant must be preserved in all future implementations.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.11 — Consent & Rights Ledger.
 */
class ConsentLedger implements IConsentLedger {
  constructor(private readonly repo: IConsentRepository) {}

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

    await this.repo.saveRecord(record)

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
    const existing = await this.repo.findRecordById(input.consentId)

    if (!existing) {
      throw new Error(`[CONSENT_LEDGER] Consent record not found: ${input.consentId}`)
    }

    if (existing.organizationId !== input.organizationId) {
      throw new Error(
        `[CONSENT_LEDGER] Consent ${input.consentId} does not belong to organization ${input.organizationId}`
      )
    }

    const revoked: ConsentRecord = {
      ...existing,
      status: 'revoked',
      revokedAt: new Date(),
    }

    await this.repo.saveRecord(revoked)

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
    return this.repo.findActiveConsent(organizationId, action)
  }

  async history(filter: ConsentFilter): Promise<ConsentRecord[]> {
    return this.repo.listRecords(filter)
  }
}

// ---------------------------------------------------------------------------
// Singleton — defaults to in-memory; bootstrap swaps in Supabase repo
// ---------------------------------------------------------------------------

export let consentLedger: IConsentLedger = new ConsentLedger(new InMemoryConsentRepository())

export function _configureConsentRepository(repo: IConsentRepository): void {
  consentLedger = new ConsentLedger(repo)
}
