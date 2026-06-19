import type { BusinessMemory, Deliverable, EngagementRun, OrganizationId } from '@/shared/types'
import type {
  BusinessBrainAnalytics,
  DeliverableAnalytics,
  EngagementRunAnalytics,
  OrganizationAnalyticsReport,
} from './types'

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
