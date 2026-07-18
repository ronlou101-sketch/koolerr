import type { BusinessMemory } from '@/shared/types'

export interface RunFailure {
  /** The pipeline department that failed (e.g. 'research', 'strategy'). */
  department: string
  /** Human-readable reason the run stopped. */
  reason: string
}

/**
 * Derives the failing department and reason for an engagement run from its pipeline
 * progress memories (source 'ai-workforce-pipeline', status 'failed').
 *
 * The pipeline persists failure detail to the Business Brain rather than to a schema
 * column, so the run detail page reads it back from here. Returns null when no failure
 * was recorded. If more than one failure exists (e.g. a re-run), the most recent wins.
 * Falls back to the generic step/error fields for memories written before the explicit
 * failedAtDepartment/failureReason fields existed.
 */
export function findRunFailure(memories: BusinessMemory[]): RunFailure | null {
  const failures = memories
    .filter((m) => m.source === 'ai-workforce-pipeline' && m.content.status === 'failed')
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  const latest = failures[0]
  if (!latest) return null

  const department =
    typeof latest.content.failedAtDepartment === 'string'
      ? latest.content.failedAtDepartment
      : typeof latest.content.step === 'string'
        ? latest.content.step
        : 'unknown'

  const reason =
    typeof latest.content.failureReason === 'string'
      ? latest.content.failureReason
      : typeof latest.content.error === 'string'
        ? latest.content.error
        : 'The pipeline stopped unexpectedly.'

  return { department, reason }
}
