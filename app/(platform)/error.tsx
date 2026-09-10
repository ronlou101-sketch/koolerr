'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'

/**
 * Error boundary for all platform routes.
 *
 * Next renders this in place of a route segment that throws during render/data
 * fetching, instead of crashing to the raw error page. It shows a friendly,
 * non-sensitive message with a retry (reset) and an escape hatch to the dashboard.
 * The detailed error is logged for debugging but never shown to the user.
 *
 * Accessibility: the segment's content is replaced without a navigation, so focus
 * would otherwise stay on whatever the customer last touched — or be lost to the
 * body — leaving a screen-reader or keyboard user with no idea the page failed.
 * On mount focus moves to the heading, which puts the explanation first and the
 * two recovery controls one Tab away.
 */
export default function PlatformError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    console.error('[platform] route error', error)
  }, [error])

  // Mount only: a retry that fails again remounts this boundary, and moving focus
  // on every re-render would yank it back from the control the customer chose.
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      {/* tabIndex -1 makes the heading a focus target without adding it to the tab order. */}
      <h1 ref={headingRef} tabIndex={-1} className="text-xl font-semibold text-foreground">
        This page didn&apos;t load right
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Sorry about that — this page didn&apos;t load the way it should. Try again, or head back to
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
