/**
 * Formats a past Date as a short relative age (e.g. 'just now', '5m ago', '3h ago',
 * '2d ago'). Used by platform pages that list recent activity.
 *
 * Extracted verbatim from the identical copies previously inlined in the dashboard,
 * workforces, and runs pages — behavior is unchanged.
 */
export function timeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  return `${Math.floor(diffH / 24)}d ago`
}
