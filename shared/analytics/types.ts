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

// ---------------------------------------------------------------------------
// Phase 3 M4 — Time-series and Revenue types
// Used by Revenue Dashboard and Mission Control.
// ---------------------------------------------------------------------------

/** A single day's activity count. date is 'YYYY-MM-DD'. */
export interface DayBucket {
  date: string
  count: number
}

/** Per-day activity for the last N days — used to render bar charts. */
export interface PlatformTimeSeries {
  runsPerDay: DayBucket[]
  deliverablesPerDay: DayBucket[]
  memoriesPerDay: DayBucket[]
  days: number
}

/** Revenue snapshot computed from current subscription + plan price. */
export interface RevenueMetrics {
  mrrCents: number
  planId: string
  planLabel: string
  subscriptionStatus: string
  stripeConfigured: boolean
  currentPeriodEnd: Date | null
}
