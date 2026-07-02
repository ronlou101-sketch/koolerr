'use client'

import { useEffect } from 'react'
import { logger } from '@/shared/lib/logger'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('Unhandled global error', { message: error.message, digest: error.digest })
  }, [error])

  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
        <div className="max-w-md text-center">
          <p className="text-4xl font-semibold">500</p>
          <p className="mt-2 text-lg font-medium">Something went wrong</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {error.message ?? 'An unexpected error occurred.'}
            {error.digest && (
              <span className="ml-1 font-mono text-xs text-muted-foreground/60">
                ({error.digest})
              </span>
            )}
          </p>
          <button
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
