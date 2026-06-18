import type {
  BusinessBrainId,
  BusinessMemory,
  BusinessMemoryId,
  BusinessMemoryType,
  OrganizationId,
  TenantId,
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
  tenantId: TenantId
  organizationId: OrganizationId
  source: string
  memories: Omit<BusinessMemory, 'id' | 'businessBrainId' | 'version' | 'createdAt' | 'updatedAt'>[]
}

// ---------------------------------------------------------------------------
// Business Intelligence — Phase 2 Milestone 3
// Insight types produced by synthesizeInsights().
// See FOUNDATION_001_ARCHITECTURE.md §2.5 — Business Intelligence.
// ---------------------------------------------------------------------------

/** The category of a synthesized insight. */
export type InsightType = 'pattern' | 'gap' | 'trend' | 'recommendation'

/**
 * A single synthesized finding derived from accumulated Business Memory.
 * Insights are ephemeral — computed on demand, not stored in the database.
 */
export interface BusinessInsight {
  type: InsightType
  title: string
  finding: string
  /** IDs of the memories that support or evidence this insight. */
  supportingMemoryIds: BusinessMemoryId[]
}

/** Per-type memory counts and coverage summary. */
export interface MemoryTrendSummary {
  totalMemories: number
  countsByType: Partial<Record<BusinessMemoryType, number>>
  /** The memory type with the most entries, or null if no memories exist. */
  mostDocumented: BusinessMemoryType | null
  /** Memory types with zero entries — coverage gaps. */
  undocumentedTypes: BusinessMemoryType[]
}

/** Full intelligence report returned by synthesizeInsights(). */
export interface BrainIntelligenceReport {
  organizationId: OrganizationId
  businessBrainId: BusinessBrainId
  generatedAt: Date
  insights: BusinessInsight[]
  trends: MemoryTrendSummary
}
