import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { PRIMARY_NAV, MORE_NAV, WORK_NAV, BUSINESS_NAV, navHrefs } from '../_lib/nav-items'
import {
  bottomNavDestinationHrefs,
  bottomNavSlotLabels,
  bottomNavSlots,
  isAskDialogDismissKey,
  isDestinationActive,
} from './bottom-nav'

const bottomNavSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'bottom-nav.tsx'),
  'utf8'
)
const layoutSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../layout.tsx'),
  'utf8'
)
const mobileNavSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'mobile-nav.tsx'),
  'utf8'
)

describe('bottomNavSlots()', () => {
  it('renders Home, Work, Ask+, Business, More in founder order', () => {
    expect(bottomNavSlotLabels(PRIMARY_NAV)).toEqual(['Home', 'Work', 'Ask+', 'Business', 'More'])
  })

  it('keeps destination hrefs on existing primary peers only', () => {
    expect(bottomNavDestinationHrefs(PRIMARY_NAV)).toEqual(['/dashboard', '/work', '/brain'])
  })

  it('does not add Ask or More as destinations, and never surfaces /pipeline', () => {
    const slots = bottomNavSlots(PRIMARY_NAV)
    expect(slots.some((slot) => slot.kind === 'ask')).toBe(true)
    expect(slots.some((slot) => slot.kind === 'more')).toBe(true)
    expect(bottomNavDestinationHrefs(PRIMARY_NAV)).not.toContain('/pipeline')
    for (const slot of slots) {
      if (slot.kind === 'ask' || slot.kind === 'more') {
        expect('item' in slot).toBe(false)
      }
    }
  })

  it('does not promote Work children, Business nested destinations, or More-menu tools onto the bar', () => {
    const hrefs = bottomNavDestinationHrefs(PRIMARY_NAV)
    for (const href of WORK_NAV.map((item) => item.href)) {
      expect(hrefs).not.toContain(href)
    }
    for (const href of navHrefs(BUSINESS_NAV)) {
      if (href === '/brain') continue
      expect(hrefs).not.toContain(href)
    }
    for (const href of MORE_NAV.map((item) => item.href)) {
      expect(hrefs).not.toContain(href)
    }
    expect(hrefs).not.toContain('/academy')
    expect(hrefs).toEqual(['/dashboard', '/work', '/brain'])
  })

  it('inserts Ask after the first two peers even if the primary list is shorter', () => {
    expect(bottomNavSlotLabels(PRIMARY_NAV.slice(0, 1))).toEqual(['Home', 'Ask+', 'More'])
    expect(bottomNavSlotLabels([])).toEqual(['Ask+', 'More'])
  })
})

describe('isDestinationActive()', () => {
  const home = PRIMARY_NAV[0]
  const work = PRIMARY_NAV[1]
  const business = PRIMARY_NAV[2]

  it('marks Home current on /dashboard only', () => {
    expect(isDestinationActive('/dashboard', home)).toBe(true)
    expect(isDestinationActive('/dashboard/settings', home)).toBe(true)
    expect(isDestinationActive('/work', home)).toBe(false)
    expect(isDestinationActive('/brain', home)).toBe(false)
  })

  it('marks Work current on /work and on existing Work children', () => {
    expect(isDestinationActive('/work', work)).toBe(true)
    expect(isDestinationActive('/approvals', work)).toBe(true)
    expect(isDestinationActive('/runs', work)).toBe(true)
    expect(isDestinationActive('/runs/abc', work)).toBe(true)
    expect(isDestinationActive('/deliverables', work)).toBe(true)
    expect(isDestinationActive('/dashboard', work)).toBe(false)
    expect(isDestinationActive('/brain', work)).toBe(false)
    expect(isDestinationActive('/academy', work)).toBe(false)
  })

  it('marks Business current on /brain and on nested Business destinations', () => {
    expect(isDestinationActive('/brain', business)).toBe(true)
    expect(isDestinationActive('/brain/memories', business)).toBe(true)
    expect(isDestinationActive('/billing', business)).toBe(true)
    expect(isDestinationActive('/usage', business)).toBe(true)
    expect(isDestinationActive('/consent', business)).toBe(true)
    expect(isDestinationActive('/audit', business)).toBe(true)
    expect(isDestinationActive('/dashboard', business)).toBe(false)
    expect(isDestinationActive('/creative', business)).toBe(false)
    expect(isDestinationActive('/academy', business)).toBe(false)
  })

  it('does not treat /pipeline as an active primary destination', () => {
    expect(isDestinationActive('/pipeline', home)).toBe(false)
    expect(isDestinationActive('/pipeline', work)).toBe(false)
    expect(isDestinationActive('/pipeline', business)).toBe(false)
  })
})

describe('isAskDialogDismissKey()', () => {
  it('dismisses on Escape and ignores other keys', () => {
    expect(isAskDialogDismissKey('Escape')).toBe(true)
    expect(isAskDialogDismissKey('Enter')).toBe(false)
    expect(isAskDialogDismissKey('Tab')).toBe(false)
    expect(isAskDialogDismissKey(' ')).toBe(false)
  })
})

describe('Ask(+) wiring and chrome contracts', () => {
  it('hosts CampaignCreator in a labelled dialog and never links to /pipeline', () => {
    expect(bottomNavSource).toContain('CampaignCreator')
    expect(bottomNavSource).toContain('aria-label="Ask Koolerr"')
    expect(bottomNavSource).toContain('role="dialog"')
    expect(bottomNavSource).toContain('aria-modal="true"')
    expect(bottomNavSource).toContain('aria-label="New campaign"')
    expect(bottomNavSource).toContain('type="button"')
    expect(bottomNavSource).not.toMatch(/href=["']\/pipeline["']/)
    expect(bottomNavSource).not.toMatch(/href=\{['"]\/pipeline['"]\}/)
  })

  it('marks the current destination with aria-current and keeps Ask as an action', () => {
    expect(bottomNavSource).toMatch(/aria-current=\{active \? ['"]page['"] : undefined\}/)
    expect(bottomNavSource).toContain('aria-haspopup="dialog"')
    expect(bottomNavSource).toContain('aria-expanded={askOpen}')
    expect(bottomNavSource).toContain('min-h-11')
    expect(bottomNavSource).toContain('min-w-11')
  })

  it('is mobile-only so desktop header chrome stays the existing bar', () => {
    expect(bottomNavSource).toContain('sm:hidden')
    expect(bottomNavSource).toContain('fixed inset-x-0 bottom-0')
    expect(bottomNavSource).toContain('flex-1')
    expect(bottomNavSource).toContain('min-w-0')
    expect(bottomNavSource).toContain('overflow-visible')
    expect(mobileNavSource).toContain('sm:hidden')
    expect(layoutSource).toContain('hidden min-w-0 items-center gap-6 sm:flex')
    expect(layoutSource).toContain('<MobileNav')
    expect(layoutSource).not.toContain('BottomNav')
  })

  it('reserves mobile main padding so the fixed bar does not cover page actions', () => {
    expect(layoutSource).toContain('pb-24')
    expect(layoutSource).toContain('sm:pb-8')
    expect(layoutSource).toContain('sm:pb-16')
  })
})
