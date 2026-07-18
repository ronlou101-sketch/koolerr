'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AIWorkforceProgress } from './AIWorkforceProgress'

interface ActiveRun {
  id: string
  objective: string
}

export function LiveRunsPanel({ runs }: { runs: ActiveRun[] }) {
  const router = useRouter()
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())

  const handleComplete = useCallback(
    (runId: string) => {
      setCompletedIds((prev) => {
        const next = new Set(prev)
        next.add(runId)
        if (next.size >= runs.length) {
          router.refresh()
        }
        return next
      })
    },
    [runs.length, router]
  )

  if (runs.length === 0) return null

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-medium text-foreground">Live Workforce Activity</h2>
        <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
      </div>
      {runs.map((run) => (
        <div key={run.id} className="space-y-1.5">
          <p className="truncate text-xs text-muted-foreground">{run.objective}</p>
          <AIWorkforceProgress runId={run.id} onComplete={() => handleComplete(run.id)} />
        </div>
      ))}
    </section>
  )
}
