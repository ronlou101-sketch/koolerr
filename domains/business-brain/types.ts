import type {
  BusinessBrainId,
  BusinessMemory,
  BusinessMemoryType,
  OrganizationId,
} from '@/shared/types'

/**
 * Domain-specific types for the Business Brain domain.
 * See FOUNDATION_001_ARCHITECTURE.md §3 — Domain Boundaries.
 */

export interface BusinessBrainQuery {
  organizationId: OrganizationId
  types?: BusinessMemoryType[]
  relevanceScope?: string[]
  limit?: number
}

export interface BusinessBrainQueryResult {
  businessBrainId: BusinessBrainId
  memories: BusinessMemory[]
  totalCount: number
}

export interface BusinessBrainContribution {
  organizationId: OrganizationId
  source: string
  memories: Omit<BusinessMemory, 'id' | 'businessBrainId' | 'version' | 'createdAt' | 'updatedAt'>[]
}
