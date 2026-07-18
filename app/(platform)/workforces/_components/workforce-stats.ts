import type { EngagementRun, EngagementRunStatus, WorkforceId } from '@/shared/types'

export interface WorkforceRunSummary {
  id: string
  objective: string
  status: EngagementRunStatus
  createdAt: Date
  deliverableCount: number
}

export interface WorkforceStats {
  totalRuns: number
  completedRuns: number
  failedRuns: number
  totalDeliverables: number
  lastActiveAt: Date | null
  recentRuns: WorkforceRunSummary[]
}

export function computeWorkforceStats(
  workforceId: WorkforceId,
  allRuns: EngagementRun[]
): WorkforceStats {
  const runs = allRuns.filter((r) => r.workforceId === workforceId)

  const completedRuns = runs.filter((r) => r.status === 'completed').length
  const failedRuns = runs.filter((r) => r.status === 'failed').length
  const totalDeliverables = runs.reduce((sum, r) => sum + r.deliverableIds.length, 0)

  const lastActiveAt =
    runs.length > 0
      ? runs.reduce((latest, r) => (r.updatedAt > latest ? r.updatedAt : latest), runs[0].updatedAt)
      : null

  const recentRuns = [...runs]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 3)
    .map((r) => ({
      id: r.id,
      objective: r.objective,
      status: r.status,
      createdAt: r.createdAt,
      deliverableCount: r.deliverableIds.length,
    }))

  return {
    totalRuns: runs.length,
    completedRuns,
    failedRuns,
    totalDeliverables,
    lastActiveAt,
    recentRuns,
  }
}
