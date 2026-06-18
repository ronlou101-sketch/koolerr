import type { ConsentId, ConsentRecord, OrganizationId } from '@/shared/types'
import type { ConsentFilter } from './types'
import type { IConsentRepository } from './repository'

export class InMemoryConsentRepository implements IConsentRepository {
  private readonly records = new Map<ConsentId, ConsentRecord>()
  private readonly byOrganization = new Map<OrganizationId, Set<ConsentId>>()

  async saveRecord(record: ConsentRecord): Promise<ConsentRecord> {
    this.records.set(record.id, record)
    const ids = this.byOrganization.get(record.organizationId) ?? new Set<ConsentId>()
    ids.add(record.id)
    this.byOrganization.set(record.organizationId, ids)
    return record
  }

  async findRecordById(id: ConsentId): Promise<ConsentRecord | null> {
    return this.records.get(id) ?? null
  }

  async findActiveConsent(
    organizationId: OrganizationId,
    action: string
  ): Promise<ConsentRecord | null> {
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

  async listRecords(filter: ConsentFilter): Promise<ConsentRecord[]> {
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
}
