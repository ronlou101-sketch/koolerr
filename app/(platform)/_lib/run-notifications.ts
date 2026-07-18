import type { EngagementRun, EngagementRunId } from '@/shared/types'

/** The cookie that records when the user last acknowledged run notifications. */
export const RUNS_SEEN_COOKIE = 'koolerr_runs_seen_at'

export interface RunNotification {
  runId: EngagementRunId
  objective: string
  status: 'completed' | 'failed'
  /** When the run reached its terminal state (completedAt, falling back to updatedAt). */
  at: Date
  /** True when the run finished after the user last acknowledged notifications. */
  unread: boolean
}

/**
 * Derives run-completion notifications from Engagement Runs.
 *
 * Notifications are not persisted anywhere: a finished run (completed or failed) IS
 * the notification, and "unread" is computed by comparing when it finished against the
 * timestamp the user last acknowledged (stored client-side in a cookie). This keeps the
 * feature free of any new table or Business Brain memory type. Results are newest-first.
 *
 * When lastSeenAt is null (the user has never acknowledged notifications), every finished
 * run is considered unread.
 */
export function deriveRunNotifications(
  runs: EngagementRun[],
  lastSeenAt: Date | null
): RunNotification[] {
  return runs
    .filter((r) => r.status === 'completed' || r.status === 'failed')
    .map((r) => {
      const at = r.completedAt ?? r.updatedAt
      return {
        runId: r.id,
        objective: r.objective,
        status: r.status as 'completed' | 'failed',
        at,
        unread: lastSeenAt === null ? true : at.getTime() > lastSeenAt.getTime(),
      }
    })
    .sort((a, b) => b.at.getTime() - a.at.getTime())
}

/** Counts unread notifications. */
export function countUnread(notifications: RunNotification[]): number {
  return notifications.filter((n) => n.unread).length
}

/** Formats an unread count for a compact badge, capping at '9+'. */
export function formatUnreadBadge(count: number): string {
  if (count <= 0) return ''
  return count > 9 ? '9+' : String(count)
}
