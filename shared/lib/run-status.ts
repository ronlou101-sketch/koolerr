import type { EngagementRunStatus } from '@/shared/types'

/**
 * Human-readable labels for each Engagement Run status.
 *
 * Extracted verbatim from the identical copies previously inlined in the runs list
 * and run detail pages — values are unchanged.
 */
export const RUN_STATUS_LABELS: Record<EngagementRunStatus, string> = {
  pending: 'Pending',
  running: 'Running',
  awaiting_approval: 'Awaiting Review',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
  failed: 'Failed',
}

/**
 * Badge (background + text) color classes for each Engagement Run status.
 *
 * Extracted verbatim from the identical copies previously inlined in the runs list
 * and run detail pages — values are unchanged. Note: the dashboard uses a different,
 * text-only color scheme and intentionally keeps its own map.
 */
export const RUN_STATUS_BADGE_COLORS: Record<EngagementRunStatus, string> = {
  pending: 'bg-muted text-muted-foreground',
  running: 'bg-blue-100 text-blue-700',
  awaiting_approval: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-destructive/10 text-destructive',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-destructive/10 text-destructive',
}
