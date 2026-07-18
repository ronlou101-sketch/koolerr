import { describe, it, expect } from 'vitest'
import type { EngagementRun, EngagementRunId, OrganizationId, WorkforceId } from '@/shared/types'
import { countRunsInWindow, isRunLimitReached, RUN_LIMIT_WINDOW_MS } from './run-rate-limit'

const NOW = new Date('2026-07-18T12:00:00Z')

function makeRun(createdAt: Date, id = 'run_1'): EngagementRun {
  return {
    id: id as EngagementRunId,
    organizationId: 'org_1' as OrganizationId,
    workforceId: 'wf_1' as WorkforceId,
    objective: 'Content run',
    status: 'completed',
    participantIds: [],
    deliverableIds: [],
    createdAt,
    updatedAt: createdAt,
  }
}

/** Returns a Date `hoursAgo` hours before NOW. */
function hoursAgo(hours: number): Date {
  return new Date(NOW.getTime() - hours * 60 * 60 * 1000)
}

describe('countRunsInWindow()', () => {
  it('returns 0 when there are no runs', () => {
    expect(countRunsInWindow([], NOW)).toBe(0)
  })

  it('counts runs created within the last 24 hours', () => {
    const runs = [makeRun(hoursAgo(1), 'a'), makeRun(hoursAgo(12), 'b'), makeRun(hoursAgo(23), 'c')]
    expect(countRunsInWindow(runs, NOW)).toBe(3)
  })

  it('excludes runs older than the window', () => {
    const runs = [makeRun(hoursAgo(1), 'recent'), makeRun(hoursAgo(25), 'old')]
    expect(countRunsInWindow(runs, NOW)).toBe(1)
  })

  it('excludes a run exactly at the window boundary', () => {
    const boundary = new Date(NOW.getTime() - RUN_LIMIT_WINDOW_MS)
    expect(countRunsInWindow([makeRun(boundary)], NOW)).toBe(0)
  })
})

describe('isRunLimitReached()', () => {
  it('is false when the count is below the limit', () => {
    const runs = [makeRun(hoursAgo(1), 'a'), makeRun(hoursAgo(2), 'b')]
    expect(isRunLimitReached(runs, NOW, 10)).toBe(false)
  })

  it('is true when the count equals the limit', () => {
    const runs = Array.from({ length: 10 }, (_, i) => makeRun(hoursAgo(1), `r${i}`))
    expect(isRunLimitReached(runs, NOW, 10)).toBe(true)
  })

  it('is true when the count exceeds the limit', () => {
    const runs = Array.from({ length: 12 }, (_, i) => makeRun(hoursAgo(1), `r${i}`))
    expect(isRunLimitReached(runs, NOW, 10)).toBe(true)
  })

  it('ignores runs outside the window when evaluating the limit', () => {
    const recent = Array.from({ length: 3 }, (_, i) => makeRun(hoursAgo(1), `n${i}`))
    const old = Array.from({ length: 20 }, (_, i) => makeRun(hoursAgo(30), `o${i}`))
    expect(isRunLimitReached([...recent, ...old], NOW, 10)).toBe(false)
  })
})
