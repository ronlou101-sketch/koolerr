import type {
  BusinessBrain,
  BusinessBrainId,
  BusinessMemory,
  BusinessMemoryId,
  BusinessMemoryType,
  OrganizationId,
  TenantId,
  WorkforceId,
} from '@/shared/types'

/**
 * Business Brain Repository Interface
 *
 * Declares the storage contract for the Business Brain domain.
 *
 * tenantId is required on all write operations. Database rows carry a
 * tenant_id column for efficient RLS enforcement. The TypeScript entity
 * types do not carry tenantId (it is derivable from organizationId via
 * organizations.tenant_id), so it is passed as a separate parameter.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.3, §2.4 — Business Brain.
 * See docs/adr/ADR-004-repository-pattern.md.
 */

export interface MemoryQueryOptions {
  types?: BusinessMemoryType[]
  relevanceScope?: string[]
  limit?: number
}

export interface IBusinessBrainRepository {
  // Business Brain — one per Organization
  saveBrain(brain: BusinessBrain, tenantId: TenantId): Promise<BusinessBrain>
  findBrainByOrganizationId(organizationId: OrganizationId): Promise<BusinessBrain | null>

  // Business Memory — individual knowledge units
  saveMemory(memory: BusinessMemory, tenantId: TenantId): Promise<BusinessMemory>
  findMemoryById(id: BusinessMemoryId): Promise<BusinessMemory | null>
  queryMemories(
    organizationId: OrganizationId,
    options: MemoryQueryOptions
  ): Promise<BusinessMemory[]>
  /** Return every memory for an organization — used by the Intelligence Layer for full analysis. */
  listAllMemories(organizationId: OrganizationId): Promise<BusinessMemory[]>
  /** Return memories attributed to a specific Workforce — used by Atlas for cross-Workforce synthesis. */
  listMemoriesByWorkforce(
    workforceId: WorkforceId,
    organizationId: OrganizationId
  ): Promise<BusinessMemory[]>
}
