import { cookies } from 'next/headers'
import { workforceEngineService } from '@/domains/workforce-engine'
import type { OrganizationId } from '@/shared/types'
import {
  deriveRunNotifications,
  countUnread,
  formatUnreadBadge,
  RUNS_SEEN_COOKIE,
} from '../_lib/run-notifications'
import { markRunsSeenAndOpen } from './notification-actions'

/**
 * Notification bell for the platform header.
 *
 * Shows how many Engagement Runs have finished (completed or failed) since the user last
 * acknowledged them. Notifications are derived live from runs — nothing is persisted.
 * Submitting the form marks them seen and opens the runs list (see markRunsSeenAndOpen).
 */
export async function NotificationBell({ organizationId }: { organizationId: OrganizationId }) {
  const [runsResult, cookieStore] = await Promise.all([
    workforceEngineService.listEngagementRuns(organizationId),
    cookies(),
  ])

  const runs = runsResult.ok ? runsResult.value : []
  const seenRaw = cookieStore.get(RUNS_SEEN_COOKIE)?.value
  const lastSeenAt = seenRaw ? new Date(seenRaw) : null

  const notifications = deriveRunNotifications(runs, lastSeenAt)
  const unread = countUnread(notifications)
  const badge = formatUnreadBadge(unread)

  return (
    <form action={markRunsSeenAndOpen}>
      <button
        type="submit"
        aria-label={unread > 0 ? `${unread} finished runs to review` : 'Run notifications'}
        title={unread > 0 ? `${unread} finished runs to review` : 'Run notifications'}
        className="relative inline-flex items-center text-muted-foreground hover:text-foreground"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {badge && (
          <span className="absolute -right-2 -top-1.5 flex min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-destructive-foreground">
            {badge}
          </span>
        )}
      </button>
    </form>
  )
}
