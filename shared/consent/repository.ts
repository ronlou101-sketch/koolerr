import type { ConsentId, ConsentRecord, OrganizationId } from '@/shared/types'
import type { ConsentFilter } from './types'

/**
 * Consent Repository Interface
 *
 * Declares the storage contract for the Consent & Rights Ledger.
 *
 * Append-only invariant: saveRecord() is used for both initial grants and
 * revocations. A revocation updates the existing record's status field
 * rather than deleting it — the repository's upsert preserves this invariant.
 * No delete operation is exposed.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.11 — Consent & Rights Ledger.
 * See docs/adr/ADR-004-repository-pattern.md.
 */

export interface IConsentRepository {
  /** Save (insert or update-in-place) a consent record. Never deletes. */
  saveRecord(record: ConsentRecord): Promise<ConsentRecord>
  findRecordById(id: ConsentId): Promise<ConsentRecord | null>
  findActiveConsent(organizationId: OrganizationId, action: string): Promise<ConsentRecord | null>
  listRecords(filter: ConsentFilter): Promise<ConsentRecord[]>
}
