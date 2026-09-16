import { describe, it, expect } from 'vitest'
import {
  PRIMARY_NAV,
  MORE_NAV,
  OWNER_NAV,
  WORK_NAV,
  platformNav,
  navHrefs,
} from './nav-items'

describe('platformNav()', () => {
  it('primary bar is exactly Home, Work, Business', () => {
    expect(PRIMARY_NAV.map((i) => i.href)).toEqual(['/dashboard', '/work', '/brain'])
    expect(PRIMARY_NAV.map((i) => i.label)).toEqual(['Home', 'Work', 'Business'])
  })

  it('customer primary bar is 3 items', () => {
    expect(platformNav(false).primary).toHaveLength(3)
  })

  it('Work composes Needs you, In progress, Results over existing routes', () => {
    expect(WORK_NAV.map((i) => i.href)).toEqual(['/approvals', '/runs', '/deliverables'])
    expect(WORK_NAV.map((i) => i.label)).toEqual(['Needs you', 'In progress', 'Results'])
    const work = PRIMARY_NAV.find((i) => i.href === '/work')
    expect(work?.children).toEqual(WORK_NAV)
    // Lifecycle destinations are nested under Work — not primary peers.
    for (const href of ['/approvals', '/runs', '/deliverables']) {
      expect(PRIMARY_NAV.some((i) => i.href === href)).toBe(false)
      expect(MORE_NAV.some((i) => i.href === href)).toBe(false)
    }
  })

  it('Work carries the live review badge marker (not a Review primary peer)', () => {
    const work = PRIMARY_NAV.find((i) => i.href === '/work')
    expect(work).toBeDefined()
    expect(work?.label).toBe('Work')
    expect(work?.badgeKey).toBe('review')
    // Static config never hardcodes a count; the layout injects it at render time.
    expect(work?.badge).toBeUndefined()
    expect(PRIMARY_NAV.some((i) => i.label === 'Review')).toBe(false)
    expect(MORE_NAV.some((i) => i.href === '/approvals')).toBe(false)
  })

  it('Learn is not a primary peer; it is reachable under More beside Support', () => {
    expect(PRIMARY_NAV.some((i) => i.href === '/academy')).toBe(false)
    const more = MORE_NAV.map((i) => i.href)
    expect(more).toContain('/academy')
    expect(more).toContain('/support')
    const learn = MORE_NAV.find((i) => i.href === '/academy')
    const support = MORE_NAV.find((i) => i.href === '/support')
    expect(learn?.label).toBe('Learn')
    expect(support?.label).toBe('Support')
    expect(Math.abs(more.indexOf('/academy') - more.indexOf('/support'))).toBe(1)
  })

  it('Business primary temporarily hrefs /brain and is not duplicated in More', () => {
    const business = PRIMARY_NAV.find((i) => i.label === 'Business')
    expect(business?.href).toBe('/brain')
    expect(MORE_NAV.some((i) => i.href === '/brain')).toBe(false)
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

  it('surfaces every customer/founder destination in the nav union', () => {
    // /pipeline is intentionally NOT surfaced. The route is preserved for
    // back-compat (see app/(platform)/pipeline/page.tsx) but is not a nav destination.
    const all = new Set(navHrefs([...PRIMARY_NAV, ...MORE_NAV, ...OWNER_NAV]))
    const expected = [
      '/dashboard',
      '/work',
      '/approvals',
      '/runs',
      '/deliverables',
      '/brain',
      '/academy',
      '/creative',
      '/workforces',
      '/analytics',
      '/billing',
      '/usage',
      '/audit',
      '/consent',
      '/support',
      '/tower',
      '/tracker',
      '/mission-control',
      '/revenue',
      '/cto',
    ]
    for (const href of expected) expect(all.has(href)).toBe(true)
    expect(all.size).toBe(expected.length)
    // Pipeline is delisted from the nav (route still resolves directly).
    expect(all.has('/pipeline')).toBe(false)
  })

  it('Creative remains under More until its modal replacement lands', () => {
    const more = MORE_NAV.map((i) => i.href)
    expect(more).toContain('/creative')
    expect(more).not.toContain('/pipeline')
  })

  it('Support is discoverable under More as /support', () => {
    const support = MORE_NAV.find((i) => i.href === '/support')
    expect(support).toBeDefined()
    expect(support?.label).toBe('Support')
    expect(PRIMARY_NAV.some((i) => i.href === '/support')).toBe(false)
  })

  it('does not nest Billing or Usage under Business in this slice', () => {
    const business = PRIMARY_NAV.find((i) => i.label === 'Business')
    expect(business?.children).toBeUndefined()
    expect(MORE_NAV.map((i) => i.href)).toEqual(expect.arrayContaining(['/billing', '/usage']))
  })
})
