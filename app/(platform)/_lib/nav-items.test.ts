import { describe, it, expect } from 'vitest'
import { PRIMARY_NAV, MORE_NAV, OWNER_NAV, platformNav } from './nav-items'

describe('platformNav()', () => {
  it('primary bar is exactly Home, Campaigns, Deliverables, Learn', () => {
    expect(PRIMARY_NAV.map((i) => i.href)).toEqual([
      '/dashboard',
      '/runs',
      '/deliverables',
      '/academy',
    ])
    expect(PRIMARY_NAV.map((i) => i.label)).toEqual(['Home', 'Campaigns', 'Deliverables', 'Learn'])
  })

  it('customer primary bar is 4 items', () => {
    expect(platformNav(false).primary).toHaveLength(4)
  })

  it('hides owner tools from customers (no Owner group, none leaked into primary/more)', () => {
    const nav = platformNav(false)
    expect(nav.owner).toHaveLength(0)
    for (const href of ['/tower', '/tracker', '/mission-control', '/revenue', '/cto']) {
      expect(nav.primary.some((i) => i.href === href)).toBe(false)
      expect(nav.more.some((i) => i.href === href)).toBe(false)
    }
  })

  it('shows owner tools to the founder in declared order', () => {
    expect(platformNav(true).owner.map((i) => i.href)).toEqual([
      '/tower',
      '/tracker',
      '/mission-control',
      '/revenue',
      '/cto',
    ])
  })

  it('primary + more are identical for customer and founder', () => {
    expect(platformNav(true).primary).toEqual(platformNav(false).primary)
    expect(platformNav(true).more).toEqual(platformNav(false).more)
  })

  it('preserves every existing route across the union of groups (no destination dropped)', () => {
    const all = new Set([...PRIMARY_NAV, ...MORE_NAV, ...OWNER_NAV].map((i) => i.href))
    const expected = [
      '/dashboard',
      '/runs',
      '/deliverables',
      '/academy',
      '/pipeline',
      '/creative',
      '/approvals',
      '/workforces',
      '/brain',
      '/analytics',
      '/billing',
      '/usage',
      '/audit',
      '/consent',
      '/tower',
      '/tracker',
      '/mission-control',
      '/revenue',
      '/cto',
    ]
    for (const href of expected) expect(all.has(href)).toBe(true)
    expect(all.size).toBe(expected.length)
  })

  it('Pipeline, Creative and Approvals remain in navigation (kept until Sprint 3)', () => {
    const more = MORE_NAV.map((i) => i.href)
    expect(more).toContain('/pipeline')
    expect(more).toContain('/creative')
    expect(more).toContain('/approvals')
  })
})
