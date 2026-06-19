import type {
  BusinessMemoryType,
  DeliverableStatus,
  DeliverableType,
  EngagementRunStatus,
  OrganizationId,
} from '@/shared/types'

/**
 * Phase 2 Analytics Foundation — ephemeral report types.
 *
 * All reports are computed on demand from existing domain data and are
 * never stored. The source-of-truth is always the domain records themselves.
 *
 * See docs/adr/ADR-017-analytics-foundation.md.
 */

export interface EngagementRunAnalytics {
  total: number
  completed: number
  failed: number
  /** Completed / (completed + failed). Null when no terminal runs exist yet. */
  successRate: number | null
  byStatus: Partial<Record<EngagementRunStatus, number>>
}

export interface DeliverableAnalytics {
  total: number
  published: number
  pendingReview: number
  byType: Partial<Record<DeliverableType, number>>
  byStatus: Partial<Record<DeliverableStatus, number>>
}

export interface BusinessBrainAnalytics {
  totalMemories: number
  byType: Partial<Record<BusinessMemoryType, number>>
}

export interface OrganizationAnalyticsReport {
  organizationId: OrganizationId
  generatedAt: Date
  engagementRuns: EngagementRunAnalytics
  deliverables: DeliverableAnalytics
  businessBrain: BusinessBrainAnalytics
}
