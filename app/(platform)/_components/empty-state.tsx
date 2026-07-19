import type { ReactNode } from 'react'

/**
 * Standardized empty state for list/section surfaces across the platform.
 *
 * Matches the existing dashed-border style so adoption is visually consistent.
 * `action` is an optional call-to-action (e.g. a Link) rendered below the message.
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
    <div className={`rounded-lg border border-dashed border-border p-6 text-center ${className}`}>
      <p className="text-sm text-muted-foreground">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
