'use client'

import Link from 'next/link'
import { useEffect } from 'react'

/**
 * Error boundary for all platform routes.
 *
 * Next renders this in place of a route segment that throws during render/data
 * fetching, instead of crashing to the raw error page. It shows a friendly,
 * non-sensitive message with a retry (reset) and an escape hatch to the dashboard.
 * The detailed error is logged for debugging but never shown to the user.
 */
export default function PlatformError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[platform] route error', error)
  }, [error])

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        An unexpected error occurred while loading this page. You can try again, or head back to
        your dashboard.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-muted-foreground">Reference: {error.digest}</p>
      )}
      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
