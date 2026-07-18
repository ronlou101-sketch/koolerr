import type { EngagementRun } from '@/shared/types'

/** The rolling window over which the per-organization run limit is enforced. */
export const RUN_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000

/** Counts the runs created within the window ending at `now`. */
export function countRunsInWindow(
  runs: EngagementRun[],
  now: Date,
  windowMs: number = RUN_LIMIT_WINDOW_MS
): number {
  const since = now.getTime() - windowMs
  return runs.filter((r) => r.createdAt.getTime() > since).length
}

/**
 * Whether starting another pipeline run would exceed the organization's rolling
 * daily limit. A guard against runaway AI provider spend from repeated triggers.
 * The limit is reached when the count of runs in the window is at or above `limit`.
 */
export function isRunLimitReached(
  runs: EngagementRun[],
  now: Date,
  limit: number,
  windowMs: number = RUN_LIMIT_WINDOW_MS
): boolean {
  return countRunsInWindow(runs, now, windowMs) >= limit
}
