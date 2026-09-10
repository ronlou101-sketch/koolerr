'use client'

import { useEffect, useRef } from 'react'
import { logger } from '@/shared/lib/logger'
import { ROOT_ERROR_BODY, ROOT_ERROR_TITLE, supportReference } from './error-copy'

/**
 * Global error boundary.
 *
 * Next renders this when the root layout itself fails, replacing the whole
 * document — which is why it must supply its own `<html>` and `<body>`.
 *
 * It shows the same fixed copy as the root boundary and derives exactly one
 * displayable value from the thrown error, the opaque `digest`. The error's own
 * message, stack, and cause are logged and never shown, because a raw message
 * can carry internal details a customer must not see
 * (FOUNDATION_004_PRODUCT_PRINCIPLES.md §12). Copy and the digest rule come from
 * `error-copy.ts` rather than being restated here, so both boundaries cannot
 * drift apart.
 *
 * Accessibility: the document is replaced without a navigation, so focus would
 * otherwise sit on nothing meaningful. On mount focus moves to the heading,
 * matching `app/error.tsx`.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const reference = supportReference(error)

  useEffect(() => {
    // console.error is a guaranteed signal in Vercel logs regardless of logger state.
    // Replace with Sentry.captureException(error) once SENTRY_DSN is configured (M5).
    console.error('[GLOBAL_ERROR]', error)
    logger.error('Unhandled global error', { message: error.message, digest: error.digest })
  }, [error])

  // Mount only: a retry that fails again remounts this boundary, and moving
  // focus on every re-render would yank it back from the control the customer
  // chose.
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
        <div className="max-w-md text-center">
          <p className="text-4xl font-semibold">500</p>
          {/* tabIndex -1 makes the heading a focus target without adding it to the tab order. */}
          <h1 ref={headingRef} tabIndex={-1} className="mt-2 text-lg font-medium">
            {ROOT_ERROR_TITLE}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{ROOT_ERROR_BODY}</p>
          {reference && (
            <p className="mt-2 font-mono text-xs text-muted-foreground/60">
              Reference: {reference}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
