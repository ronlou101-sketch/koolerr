import { describe, it, expect } from 'vitest'
import {
  PRIMARY_NAV,
  MORE_NAV,
  OWNER_NAV,
  WORK_NAV,
  BUSINESS_NAV,
  platformNav,
  navHrefs,
  isNavGroup,
  isNavItemActive,
  flattenVisibleNavMenu,
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

  it('Business primary hrefs /brain, is not duplicated in More, and has no Profile route', () => {
    const business = PRIMARY_NAV.find((i) => i.label === 'Business')
    expect(business?.href).toBe('/brain')
    expect(MORE_NAV.some((i) => i.href === '/brain')).toBe(false)
    expect(navHrefs(BUSINESS_NAV)).not.toContain('/profile')
    expect(BUSINESS_NAV.some((i) => 'label' in i && i.label === 'Profile')).toBe(false)
  })

  it('nests the canonical Business tree over existing routes', () => {
    const business = PRIMARY_NAV.find((i) => i.label === 'Business')
    expect(business?.children).toEqual(BUSINESS_NAV)

    const [brain, billing, advanced] = BUSINESS_NAV
    expect(brain).toEqual({ href: '/brain', label: 'Brain' })
    expect(billing).toEqual({
      href: '/billing',
      label: 'Billing',
      children: [{ href: '/usage', label: 'Usage' }],
    })
    expect(isNavGroup(advanced)).toBe(true)
    if (!isNavGroup(advanced)) return
    expect(advanced.label).toBe('Advanced')
    expect(advanced.collapsed).toBe(true)
    expect('href' in advanced).toBe(false)
    expect(advanced.children).toEqual([
      { href: '/consent', label: 'Permissions' },
      { href: '/audit', label: 'Audit' },
    ])

    expect(navHrefs(BUSINESS_NAV)).toEqual(['/brain', '/billing', '/usage', '/consent', '/audit'])

    // Nested destinations are not primary peers.
    for (const href of ['/billing', '/usage', '/consent', '/audit']) {
      expect(PRIMARY_NAV.some((i) => i.href === href)).toBe(false)
    }
  })

  it('places Usage exclusively under Billing, not as a Business sibling', () => {
    const topLevelHrefs = BUSINESS_NAV.flatMap((node) => ('href' in node ? [node.href] : []))
    expect(topLevelHrefs).toEqual(['/brain', '/billing'])
    expect(topLevelHrefs).not.toContain('/usage')
    const billing = BUSINESS_NAV.find((node) => 'href' in node && node.href === '/billing')
    expect(billing && 'children' in billing ? navHrefs(billing.children ?? []) : []).toEqual([
      '/usage',
    ])
  })

  it('does not move Creative, Workforces, Analytics, Support, or Learn under Business', () => {
    const nested = navHrefs(BUSINESS_NAV)
    for (const href of ['/creative', '/workforces', '/analytics', '/support', '/academy']) {
      expect(nested).not.toContain(href)
      expect(PRIMARY_NAV.some((i) => i.href === href)).toBe(false)
    }
  })

  it('removes Billing, Usage, Consent, and Audit from More peers', () => {
    expect(MORE_NAV.map((i) => i.href)).toEqual([
      '/creative',
      '/workforces',
      '/analytics',
      '/support',
      '/academy',
    ])
    expect(MORE_NAV.map((i) => i.label)).toEqual([
      'Creative',
      'Workforces',
      'Analytics',
      'Support',
      'Learn',
    ])
    for (const href of ['/billing', '/usage', '/consent', '/audit']) {
      expect(MORE_NAV.some((i) => i.href === href)).toBe(false)
    }
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
    // Group labels never invent an href.
    expect(all.has('/advanced')).toBe(false)
    expect([...all].every((href) => href.startsWith('/'))).toBe(true)
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
})

describe('isNavItemActive()', () => {
  const business = PRIMARY_NAV.find((i) => i.label === 'Business')!

  it('marks Business current on /brain and on nested Business destinations', () => {
    expect(isNavItemActive('/brain', business)).toBe(true)
    expect(isNavItemActive('/brain/memories', business)).toBe(true)
    expect(isNavItemActive('/billing', business)).toBe(true)
    expect(isNavItemActive('/usage', business)).toBe(true)
    expect(isNavItemActive('/consent', business)).toBe(true)
    expect(isNavItemActive('/audit', business)).toBe(true)
    expect(isNavItemActive('/dashboard', business)).toBe(false)
    expect(isNavItemActive('/creative', business)).toBe(false)
    expect(isNavItemActive('/work', business)).toBe(false)
  })

  it('does not require Advanced to be expanded for descendant active state', () => {
    const advanced = BUSINESS_NAV.find((node) => isNavGroup(node) && node.label === 'Advanced')!
    expect(isNavItemActive('/consent', advanced)).toBe(true)
    expect(isNavItemActive('/audit', advanced)).toBe(true)
    expect(isNavItemActive('/billing', advanced)).toBe(false)
  })
})

describe('flattenVisibleNavMenu()', () => {
  it('shows Brain, Billing, Usage, and collapsed Advanced; hides Permissions and Audit', () => {
    expect(flattenVisibleNavMenu(BUSINESS_NAV, new Set())).toEqual([
      { kind: 'link', href: '/brain', label: 'Brain', depth: 0 },
      { kind: 'link', href: '/billing', label: 'Billing', depth: 0 },
      { kind: 'link', href: '/usage', label: 'Usage', depth: 1 },
      { kind: 'group', label: 'Advanced', expanded: false, depth: 0 },
    ])
  })

  it('reveals Permissions and Audit when Advanced is expanded', () => {
    const nodes = flattenVisibleNavMenu(BUSINESS_NAV, new Set(['Advanced']))
    expect(nodes).toEqual([
      { kind: 'link', href: '/brain', label: 'Brain', depth: 0 },
      { kind: 'link', href: '/billing', label: 'Billing', depth: 0 },
      { kind: 'link', href: '/usage', label: 'Usage', depth: 1 },
      { kind: 'group', label: 'Advanced', expanded: true, depth: 0 },
      { kind: 'link', href: '/consent', label: 'Permissions', depth: 1 },
      { kind: 'link', href: '/audit', label: 'Audit', depth: 1 },
    ])
    expect(nodes.filter((n) => n.kind === 'link').map((n) => n.href)).toEqual([
      '/brain',
      '/billing',
      '/usage',
      '/consent',
      '/audit',
    ])
  })

  it('keeps Work children as a flat reachable list', () => {
    expect(flattenVisibleNavMenu(WORK_NAV, new Set())).toEqual([
      { kind: 'link', href: '/approvals', label: 'Needs you', depth: 0 },
      { kind: 'link', href: '/runs', label: 'In progress', depth: 0 },
      { kind: 'link', href: '/deliverables', label: 'Results', depth: 0 },
    ])
  })
})
