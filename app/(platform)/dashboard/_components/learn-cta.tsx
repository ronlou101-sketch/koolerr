'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ACADEMY_PROGRESS_STORAGE_KEY, parseCompleted } from '../../academy/_lib/progress'

/**
 * Dashboard "Learn" banner. Client-side so the CTA can reflect the learner's
 * progress (stored in localStorage): "Start Learning" on first visit, else
 * "Continue Learning". Purely presentational — no data or logic changes; it
 * reads the same progress key the Learn section already uses.
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
      className="flex items-center justify-between gap-4 rounded-lg border border-primary/30 bg-primary/5 px-5 py-4 transition-colors hover:bg-primary/10"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">🎓 Learn</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Get the most out of your AI workforce — guided courses, walkthroughs, and best practices.
        </p>
      </div>
      <span className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
        {hasProgress ? 'Continue Learning' : 'Start Learning'} →
      </span>
    </Link>
  )
}
