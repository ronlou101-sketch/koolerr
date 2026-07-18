import { describe, it, expect } from 'vitest'
import type {
  EngagementRun,
  EngagementRunId,
  EngagementRunStatus,
  OrganizationId,
  WorkforceId,
} from '@/shared/types'
import { deriveRunNotifications, countUnread, formatUnreadBadge } from './run-notifications'

// ── Fixtures ────────────────────────────────────────────────────────────────

function makeRun(overrides: Partial<EngagementRun> = {}): EngagementRun {
  return {
    id: 'run_1' as EngagementRunId,
    organizationId: 'org_1' as OrganizationId,
    workforceId: 'wf_1' as WorkforceId,
    objective: 'Launch summer campaign',
    status: 'completed' as EngagementRunStatus,
    participantIds: [],
    deliverableIds: [],
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T01:00:00Z'),
    ...overrides,
  }
}

// ── deriveRunNotifications ─────────────────────────────────────────────────────

describe('deriveRunNotifications()', () => {
  it('returns an empty list when there are no runs', () => {
    expect(deriveRunNotifications([], null)).toEqual([])
  })

  it('includes only completed and failed runs', () => {
    const runs = [
      makeRun({ id: 'r_done' as EngagementRunId, status: 'completed' }),
      makeRun({ id: 'r_fail' as EngagementRunId, status: 'failed' }),
      makeRun({ id: 'r_run' as EngagementRunId, status: 'running' }),
      makeRun({ id: 'r_pend' as EngagementRunId, status: 'pending' }),
      makeRun({ id: 'r_wait' as EngagementRunId, status: 'awaiting_approval' }),
    ]
    const ids = deriveRunNotifications(runs, null).map((n) => n.runId)
    expect(ids).toEqual(expect.arrayContaining(['r_done', 'r_fail']))
    expect(ids).toHaveLength(2)
  })

  it('uses completedAt for the notification time when present', () => {
    const completedAt = new Date('2026-03-01T00:00:00Z')
    const [n] = deriveRunNotifications([makeRun({ completedAt })], null)
    expect(n.at).toEqual(completedAt)
  })

  it('falls back to updatedAt when completedAt is absent', () => {
    const updatedAt = new Date('2026-04-01T00:00:00Z')
    const [n] = deriveRunNotifications([makeRun({ updatedAt, completedAt: undefined })], null)
    expect(n.at).toEqual(updatedAt)
  })

  it('marks every finished run unread when lastSeenAt is null', () => {
    const notifications = deriveRunNotifications(
      [makeRun({ id: 'a' as EngagementRunId }), makeRun({ id: 'b' as EngagementRunId })],
      null
    )
    expect(notifications.every((n) => n.unread)).toBe(true)
  })

  it('marks a run read when it finished at or before lastSeenAt', () => {
    const at = new Date('2026-01-01T00:00:00Z')
    const [n] = deriveRunNotifications([makeRun({ completedAt: at })], at)
    expect(n.unread).toBe(false)
  })

  it('marks a run unread when it finished after lastSeenAt', () => {
    const seen = new Date('2026-01-01T00:00:00Z')
    const at = new Date('2026-01-02T00:00:00Z')
    const [n] = deriveRunNotifications([makeRun({ completedAt: at })], seen)
    expect(n.unread).toBe(true)
  })

  it('sorts notifications newest-first', () => {
    const runs = [
      makeRun({ id: 'old' as EngagementRunId, completedAt: new Date('2026-01-01') }),
      makeRun({ id: 'new' as EngagementRunId, completedAt: new Date('2026-06-01') }),
      makeRun({ id: 'mid' as EngagementRunId, completedAt: new Date('2026-03-01') }),
    ]
    const ids = deriveRunNotifications(runs, null).map((n) => n.runId)
    expect(ids).toEqual(['new', 'mid', 'old'])
  })

  it('preserves the terminal status on each notification', () => {
    const [n] = deriveRunNotifications([makeRun({ status: 'failed' })], null)
    expect(n.status).toBe('failed')
  })
})

// ── countUnread & formatUnreadBadge ────────────────────────────────────────────

describe('countUnread()', () => {
  it('counts only unread notifications', () => {
    const seen = new Date('2026-02-01T00:00:00Z')
    const runs = [
      makeRun({ id: 'a' as EngagementRunId, completedAt: new Date('2026-01-01') }), // read
      makeRun({ id: 'b' as EngagementRunId, completedAt: new Date('2026-03-01') }), // unread
      makeRun({ id: 'c' as EngagementRunId, completedAt: new Date('2026-04-01') }), // unread
    ]
    expect(countUnread(deriveRunNotifications(runs, seen))).toBe(2)
  })
})

describe('formatUnreadBadge()', () => {
  it('returns an empty string for zero or negative counts', () => {
    expect(formatUnreadBadge(0)).toBe('')
    expect(formatUnreadBadge(-3)).toBe('')
  })

  it('returns the number for counts up to nine', () => {
    expect(formatUnreadBadge(1)).toBe('1')
    expect(formatUnreadBadge(9)).toBe('9')
  })

  it('caps at 9+ for larger counts', () => {
    expect(formatUnreadBadge(10)).toBe('9+')
    expect(formatUnreadBadge(250)).toBe('9+')
  })
})
