import { describe, it, expect } from 'vitest'
import { PLATFORM_NAV_ITEMS, visibleNavItems } from './nav-items'

describe('visibleNavItems()', () => {
  it('hides founder-only items from non-founders', () => {
    const items = visibleNavItems(false)
    expect(items.some((i) => i.href === '/tower')).toBe(false)
    expect(items.some((i) => i.href === '/tracker')).toBe(false)
  })

  it('shows founder-only items to the founder', () => {
    const items = visibleNavItems(true)
    expect(items.some((i) => i.href === '/tower')).toBe(true)
    expect(items.some((i) => i.href === '/tracker')).toBe(true)
  })

  it('always includes the core customer routes for everyone', () => {
    const hrefs = visibleNavItems(false).map((i) => i.href)
    expect(hrefs).toEqual(
      expect.arrayContaining(['/pipeline', '/runs', '/deliverables', '/workforces', '/billing'])
    )
  })

  it('preserves the declared order', () => {
    const founderHrefs = visibleNavItems(true).map((i) => i.href)
    expect(founderHrefs).toEqual(PLATFORM_NAV_ITEMS.map((i) => i.href))
  })

  it('marks exactly one primary item (CTO Agent)', () => {
    const primary = PLATFORM_NAV_ITEMS.filter((i) => i.primary)
    expect(primary).toHaveLength(1)
    expect(primary[0].href).toBe('/cto')
  })

  it('non-founder list is exactly the full list minus founder-only items', () => {
    const founderOnlyCount = PLATFORM_NAV_ITEMS.filter((i) => i.founderOnly).length
    expect(visibleNavItems(false)).toHaveLength(PLATFORM_NAV_ITEMS.length - founderOnlyCount)
  })
})
