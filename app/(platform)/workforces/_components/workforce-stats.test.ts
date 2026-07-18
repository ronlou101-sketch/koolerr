import { describe, expect, it } from 'vitest'
import { computeWorkforceStats } from './workforce-stats'
import type {
  DeliverableId,
  EngagementRun,
  EngagementRunId,
  OrganizationId,
  WorkforceId,
} from '@/shared/types'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const WF_ID = 'workforce_main' as WorkforceId
const OTHER_WF_ID = 'workforce_other' as WorkforceId
const ORG_ID = 'org_wf_test' as OrganizationId

function makeRun(overrides: Partial<EngagementRun> = {}): EngagementRun {
  return {
    id: 'run_1' as EngagementRunId,
    organizationId: ORG_ID,
    workforceId: WF_ID,
    objective: 'Default objective',
    status: 'completed',
    participantIds: [],
    deliverableIds: [],
    createdAt: new Date('2026-06-01'),
    updatedAt: new Date('2026-06-01'),
    ...overrides,
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('computeWorkforceStats', () => {
  it('returns all zeros and empty recentRuns when no runs exist', () => {
    const stats = computeWorkforceStats(WF_ID, [])
    expect(stats.totalRuns).toBe(0)
    expect(stats.completedRuns).toBe(0)
    expect(stats.failedRuns).toBe(0)
    expect(stats.totalDeliverables).toBe(0)
    expect(stats.lastActiveAt).toBeNull()
    expect(stats.recentRuns).toHaveLength(0)
  })

  it('excludes runs belonging to other workforces', () => {
    const runs = [
      makeRun({ id: 'run_1' as EngagementRunId, workforceId: OTHER_WF_ID }),
      makeRun({ id: 'run_2' as EngagementRunId, workforceId: OTHER_WF_ID }),
    ]
    const stats = computeWorkforceStats(WF_ID, runs)
    expect(stats.totalRuns).toBe(0)
  })

  it('counts all runs for the workforce regardless of status', () => {
    const runs = [
      makeRun({ id: 'run_1' as EngagementRunId, status: 'completed' }),
      makeRun({ id: 'run_2' as EngagementRunId, status: 'running' }),
      makeRun({ id: 'run_3' as EngagementRunId, status: 'failed' }),
    ]
    const stats = computeWorkforceStats(WF_ID, runs)
    expect(stats.totalRuns).toBe(3)
  })

  it('counts only completed-status runs in completedRuns', () => {
    const runs = [
      makeRun({ id: 'run_1' as EngagementRunId, status: 'completed' }),
      makeRun({ id: 'run_2' as EngagementRunId, status: 'completed' }),
      makeRun({ id: 'run_3' as EngagementRunId, status: 'running' }),
    ]
    const stats = computeWorkforceStats(WF_ID, runs)
    expect(stats.completedRuns).toBe(2)
  })

  it('counts only failed-status runs in failedRuns', () => {
    const runs = [
      makeRun({ id: 'run_1' as EngagementRunId, status: 'failed' }),
      makeRun({ id: 'run_2' as EngagementRunId, status: 'completed' }),
    ]
    const stats = computeWorkforceStats(WF_ID, runs)
    expect(stats.failedRuns).toBe(1)
  })

  it('sums deliverableIds.length across all workforce runs for totalDeliverables', () => {
    const runs = [
      makeRun({
        id: 'run_1' as EngagementRunId,
        deliverableIds: ['del_a', 'del_b'] as DeliverableId[],
      }),
      makeRun({
        id: 'run_2' as EngagementRunId,
        deliverableIds: ['del_c'] as DeliverableId[],
      }),
    ]
    const stats = computeWorkforceStats(WF_ID, runs)
    expect(stats.totalDeliverables).toBe(3)
  })

  it('returns lastActiveAt from the most recently updated run', () => {
    const runs = [
      makeRun({ id: 'run_1' as EngagementRunId, updatedAt: new Date('2026-05-01') }),
      makeRun({ id: 'run_2' as EngagementRunId, updatedAt: new Date('2026-07-01') }),
    ]
    const stats = computeWorkforceStats(WF_ID, runs)
    expect(stats.lastActiveAt).toEqual(new Date('2026-07-01'))
  })

  it('returns null lastActiveAt when no runs belong to this workforce', () => {
    const runs = [makeRun({ workforceId: OTHER_WF_ID })]
    const stats = computeWorkforceStats(WF_ID, runs)
    expect(stats.lastActiveAt).toBeNull()
  })

  it('returns the 3 most recent runs by createdAt descending in recentRuns', () => {
    const runs = [
      makeRun({
        id: 'run_a' as EngagementRunId,
        createdAt: new Date('2026-06-01'),
        objective: 'First',
      }),
      makeRun({
        id: 'run_b' as EngagementRunId,
        createdAt: new Date('2026-06-03'),
        objective: 'Third',
      }),
      makeRun({
        id: 'run_c' as EngagementRunId,
        createdAt: new Date('2026-06-02'),
        objective: 'Second',
      }),
      makeRun({
        id: 'run_d' as EngagementRunId,
        createdAt: new Date('2026-05-01'),
        objective: 'Fourth',
      }),
    ]
    const stats = computeWorkforceStats(WF_ID, runs)
    expect(stats.recentRuns).toHaveLength(3)
    expect(stats.recentRuns[0].objective).toBe('Third')
    expect(stats.recentRuns[1].objective).toBe('Second')
    expect(stats.recentRuns[2].objective).toBe('First')
  })

  it('maps deliverableCount from deliverableIds.length in recentRuns', () => {
    const runs = [
      makeRun({
        id: 'run_1' as EngagementRunId,
        deliverableIds: ['del_1', 'del_2', 'del_3'] as DeliverableId[],
      }),
    ]
    const stats = computeWorkforceStats(WF_ID, runs)
    expect(stats.recentRuns[0].deliverableCount).toBe(3)
  })
})
