import type { BusinessMemory, Deliverable, EngagementRun, OrganizationId } from '@/shared/types'
import type {
  BusinessBrainAnalytics,
  DayBucket,
  DeliverableAnalytics,
  EngagementRunAnalytics,
  OrganizationAnalyticsReport,
  PlatformTimeSeries,
  RevenueMetrics,
} from './types'
import type { Subscription } from '@/domains/billing/types'
import { PLAN_LABELS, PLAN_PRICES_CENTS } from '@/domains/billing/plans'
import type { PlanId } from '@/domains/billing/plans'

/**
 * Pure computation function — accepts pre-fetched domain data and returns an
 * OrganizationAnalyticsReport. No I/O, no side effects, fully testable.
 *
 * Data fetching (across workforce-engine, deliverables, and business-brain
 * domain services) is the responsibility of the caller.
 */
export function computeOrganizationReport(
  organizationId: OrganizationId,
  runs: EngagementRun[],
  deliverables: Deliverable[],
  memories: BusinessMemory[]
): OrganizationAnalyticsReport {
  return {
    organizationId,
    generatedAt: new Date(),
    engagementRuns: computeRunAnalytics(runs),
    deliverables: computeDeliverableAnalytics(deliverables),
    businessBrain: computeBrainAnalytics(memories),
  }
}

function computeRunAnalytics(runs: EngagementRun[]): EngagementRunAnalytics {
  const byStatus: EngagementRunAnalytics['byStatus'] = {}
  for (const run of runs) {
    byStatus[run.status] = (byStatus[run.status] ?? 0) + 1
  }

  const completed = byStatus.completed ?? 0
  const failed = byStatus.failed ?? 0
  const terminal = completed + failed
  const successRate = terminal > 0 ? completed / terminal : null

  return {
    total: runs.length,
    completed,
    failed,
    successRate,
    byStatus,
  }
}

function computeDeliverableAnalytics(deliverables: Deliverable[]): DeliverableAnalytics {
  const byType: DeliverableAnalytics['byType'] = {}
  const byStatus: DeliverableAnalytics['byStatus'] = {}

  for (const d of deliverables) {
    byType[d.type] = (byType[d.type] ?? 0) + 1
    byStatus[d.status] = (byStatus[d.status] ?? 0) + 1
  }

  return {
    total: deliverables.length,
    published: byStatus.published ?? 0,
    pendingReview: byStatus.pending_review ?? 0,
    byType,
    byStatus,
  }
}

function computeBrainAnalytics(memories: BusinessMemory[]): BusinessBrainAnalytics {
  const byType: BusinessBrainAnalytics['byType'] = {}
  for (const m of memories) {
    byType[m.type] = (byType[m.type] ?? 0) + 1
  }
  return { totalMemories: memories.length, byType }
}

// ---------------------------------------------------------------------------
// Phase 3 M4 — Time-series and Revenue computation
// ---------------------------------------------------------------------------

/** Groups a list of items by their date (YYYY-MM-DD) and returns filled day buckets. */
function buildDayBuckets(dates: Date[], days: number): DayBucket[] {
  const now = new Date()
  const buckets: Record<string, number> = {}

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    buckets[d.toISOString().slice(0, 10)] = 0
  }

  for (const date of dates) {
    const key = date.toISOString().slice(0, 10)
    if (key in buckets) buckets[key]++
  }

  return Object.entries(buckets).map(([date, count]) => ({ date, count }))
}

/**
 * Compute per-day activity time series for runs, deliverables, and memories.
 * All inputs are pre-fetched lists — no I/O, pure function.
 */
export function computeTimeSeries(
  runs: EngagementRun[],
  deliverables: Deliverable[],
  memories: BusinessMemory[],
  days = 30
): PlatformTimeSeries {
  return {
    runsPerDay: buildDayBuckets(
      runs.map((r) => r.createdAt),
      days
    ),
    deliverablesPerDay: buildDayBuckets(
      deliverables.map((d) => d.createdAt),
      days
    ),
    memoriesPerDay: buildDayBuckets(
      memories.map((m) => m.createdAt),
      days
    ),
    days,
  }
}

/**
 * Compute revenue snapshot from the current subscription.
 * MRR is derived from planId × PLAN_PRICES_CENTS — Stripe is authoritative for actual billing.
 */
export function computeRevenueMetrics(subscription: Subscription | null): RevenueMetrics {
  if (!subscription) {
    return {
      mrrCents: 0,
      planId: 'unpaid',
      planLabel: 'Not subscribed',
      subscriptionStatus: 'active',
      stripeConfigured: false,
      currentPeriodEnd: null,
    }
  }

  const planId = subscription.planId as PlanId
  const mrrCents = PLAN_PRICES_CENTS[planId] ?? 0

  return {
    mrrCents,
    planId: subscription.planId,
    planLabel: PLAN_LABELS[planId] ?? subscription.planId,
    subscriptionStatus: subscription.status,
    stripeConfigured: !!subscription.stripeCustomerId,
    currentPeriodEnd: subscription.currentPeriodEnd,
  }
}
