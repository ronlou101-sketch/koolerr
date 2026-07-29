import { describe, it, expect } from 'vitest'
import { PRIMARY_NAV, MORE_NAV, OWNER_NAV, platformNav } from './nav-items'

describe('platformNav()', () => {
  it('primary bar is exactly Home, Campaigns, Deliverables, Review, Learn', () => {
    expect(PRIMARY_NAV.map((i) => i.href)).toEqual([
      '/dashboard',
      '/runs',
      '/deliverables',
      '/approvals',
      '/academy',
    ])
    expect(PRIMARY_NAV.map((i) => i.label)).toEqual([
      'Home',
      'Campaigns',
      'Deliverables',
      'Review',
      'Learn',
    ])
  })

  it('customer primary bar is 5 items', () => {
    expect(platformNav(false).primary).toHaveLength(5)
  })

  it('Review is a primary destination carrying the live review badge marker', () => {
    const review = PRIMARY_NAV.find((i) => i.href === '/approvals')
    expect(review).toBeDefined()
    expect(review?.label).toBe('Review')
    expect(review?.badgeKey).toBe('review')
    // Static config never hardcodes a count; the layout injects it at render time.
    expect(review?.badge).toBeUndefined()
    // Review is no longer in the "More" group.
    expect(MORE_NAV.some((i) => i.href === '/approvals')).toBe(false)
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

  it('Pipeline and Creative remain under More until their modal replacements land', () => {
    const more = MORE_NAV.map((i) => i.href)
    expect(more).toContain('/pipeline')
    expect(more).toContain('/creative')
  })
})
