'use client'

import { useEffect, useRef } from 'react'
import { logger } from '@/shared/lib/logger'
import { ROOT_ERROR_BODY, ROOT_ERROR_TITLE, supportReference } from './error-copy'

/**
 * Root error boundary.
 *
 * Next renders this in place of any route below `app/` that throws during
 * render or data fetching. It shows fixed, plain-language copy with a retry
 * (reset); the thrown error's own message, stack, and cause are logged for
 * diagnosis and never shown, because a raw message can carry internal details a
 * customer must not see (FOUNDATION_004_PRODUCT_PRINCIPLES.md §12). Only the
 * Next `digest` — an opaque hash, safe to quote to support — is surfaced, which
 * is the same contract the platform boundary already follows.
 *
 * Accessibility: the segment's content is replaced without a navigation, so
 * focus would otherwise stay wherever the customer last was, leaving a screen
 * reader or keyboard user with no idea the page failed. On mount focus moves to
 * the heading, which puts the explanation first and the retry one Tab away.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const reference = supportReference(error)

  useEffect(() => {
    logger.error('Unhandled client error', { message: error.message, digest: error.digest })
  }, [error])

  // Mount only: a retry that fails again remounts this boundary, and moving
  // focus on every re-render would yank it back from the control the customer
  // chose.
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center text-foreground">
      <p className="text-4xl font-semibold">500</p>
      {/* tabIndex -1 makes the heading a focus target without adding it to the tab order. */}
      <h1 ref={headingRef} tabIndex={-1} className="mt-2 text-lg font-medium">
        {ROOT_ERROR_TITLE}
      </h1>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{ROOT_ERROR_BODY}</p>
      {reference && (
        <p className="mt-2 font-mono text-xs text-muted-foreground/60">Reference: {reference}</p>
      )}
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
      >
        Try again
      </button>
    </div>
  )
}
