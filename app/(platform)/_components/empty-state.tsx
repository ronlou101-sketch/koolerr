import type { ReactNode } from 'react'

/**
 * Standardized empty state for list/section surfaces across the platform.
 *
 * Matches the existing dashed-border style so adoption is visually consistent.
 * `action` is an optional call-to-action (e.g. a Link) rendered below the message.
 *
 * Accessibility: the box is a status region. The dashed border is the only thing
 * that tells a sighted reader "this section has nothing in it yet"; `role="status"`
 * is the equivalent for assistive technology, and it means a surface that swaps a
 * list for this component during a client transition announces the message rather
 * than emptying silently. The region is deliberately atomic — the announcement
 * carries the action along with the message, so the answer to "what do I do now?"
 * arrives with the news.
 *
 * The message stays a paragraph rather than becoming a heading: an empty state
 * reports on the section it sits inside (each caller already renders a heading
 * above it), it does not introduce a new one.
 */
export function EmptyState({
  message,
  action,
  className = '',
}: {
  message: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      role="status"
      className={`rounded-lg border border-dashed border-border p-6 text-center ${className}`}
    >
      <p className="text-sm text-muted-foreground">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
