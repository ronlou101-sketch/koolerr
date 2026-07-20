'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { ACADEMY_PROGRESS_STORAGE_KEY, parseCompleted, serializeCompleted } from '../_lib/progress'

interface AcademyProgressValue {
  /** True once localStorage has been read on the client (avoids hydration flicker). */
  hydrated: boolean
  completed: Set<string>
  isDone: (key: string) => boolean
  toggle: (key: string) => void
  markDone: (key: string) => void
}

const AcademyProgressContext = createContext<AcademyProgressValue | null>(null)

/**
 * Client-side Academy progress store.
 *
 * Progress (the set of completed lesson keys) is persisted in localStorage — no
 * database, no schema, no server writes. This keeps the Academy fully within the
 * no-persistence guardrail while giving each user durable per-browser progress.
 * Account-level progress sync would require a future schema addition and is out of scope.
 */
export function AcademyProgressProvider({ children }: { children: ReactNode }) {
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setCompleted(parseCompleted(window.localStorage.getItem(ACADEMY_PROGRESS_STORAGE_KEY)))
    setHydrated(true)
  }, [])

  function persist(next: Set<string>) {
    setCompleted(next)
    try {
      window.localStorage.setItem(ACADEMY_PROGRESS_STORAGE_KEY, serializeCompleted(next))
    } catch {
      // Storage may be unavailable (private mode / quota) — progress still works in-session.
    }
  }

  const value: AcademyProgressValue = {
    hydrated,
    completed,
    isDone: (key) => completed.has(key),
    toggle: (key) => {
      const next = new Set(completed)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      persist(next)
    },
    markDone: (key) => {
      if (completed.has(key)) return
      const next = new Set(completed)
      next.add(key)
      persist(next)
    },
  }

  return <AcademyProgressContext.Provider value={value}>{children}</AcademyProgressContext.Provider>
}

export function useAcademyProgress(): AcademyProgressValue {
  const ctx = useContext(AcademyProgressContext)
  if (!ctx) {
    throw new Error('useAcademyProgress must be used within an AcademyProgressProvider')
  }
  return ctx
}
