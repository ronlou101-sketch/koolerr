'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ACADEMY_PROGRESS_STORAGE_KEY, parseCompleted } from '../../academy/_lib/progress'

/**
 * Dashboard "Learn" banner. Client-side so the CTA can reflect the learner's
 * progress (stored in localStorage): "Start Learning" on first visit, else
 * "Continue Learning". Purely presentational — no data or logic changes; it
 * reads the same progress key the Learn section already uses.
 *
 * Visual (8e01c1ed): quieter footer treatment so Learn does not compete with
 * the first-viewport outcome tiles and Ask(+).
 */
export function LearnCta() {
  const [hasProgress, setHasProgress] = useState(false)

  useEffect(() => {
    setHasProgress(
      parseCompleted(window.localStorage.getItem(ACADEMY_PROGRESS_STORAGE_KEY)).size > 0
    )
  }, [])

  return (
    <Link
      href="/academy"
      className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:gap-4"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">Learn</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Get the most out of your marketing team — guided courses, walkthroughs, and best
          practices.
        </p>
      </div>
      <span className="inline-flex min-h-9 shrink-0 items-center rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground">
        {hasProgress ? 'Continue Learning' : 'Start Learning'} →
      </span>
    </Link>
  )
}
