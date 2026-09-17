'use client'

interface ActiveRun {
  id: string
  objective: string
}

/**
 * Thin Home working pulse (Architect lock c40f0ece).
 *
 * Does not mount the 7-step Home checklist (including the video step).
 * Does not render run titles so Home cannot surface vendor/e2e/test residue.
 * Run records are unchanged.
 */
export function LiveRunsPanel({ runs }: { runs: ActiveRun[] }) {
  if (runs.length === 0) return null

  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground">
      <span
        className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-blue-500"
        aria-hidden="true"
      />
      Working now.
    </p>
  )
}
