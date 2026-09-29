import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { PRIMARY_NAV, MORE_NAV, WORK_NAV, BUSINESS_NAV, navHrefs } from '../_lib/nav-items'
import {
  ASK_DIALOG_PANEL_CLASS,
  BOTTOM_NAV_HIDE_MQ,
  BOTTOM_NAV_VISIBILITY_CLASS,
  NAV_TAB_IDLE_CLASS,
  NAV_TAB_SELECTED_CLASS,
  bottomNavDestinationHrefs,
  bottomNavSlotLabels,
  bottomNavSlots,
  hidesPhoneBottomNav,
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

describe('selected-state treatment (lock b8febeaa Slice 1)', () => {
  it('uses a visible shade/color token, not type-weight alone', () => {
    expect(NAV_TAB_SELECTED_CLASS).toContain('bg-primary/10')
    expect(NAV_TAB_SELECTED_CLASS).toContain('rounded-md')
    expect(NAV_TAB_SELECTED_CLASS).toContain('font-medium')
    expect(NAV_TAB_SELECTED_CLASS).not.toMatch(/^(font-medium text-foreground)$/)
    expect(NAV_TAB_IDLE_CLASS).not.toContain('bg-primary/10')
    expect(NAV_TAB_IDLE_CLASS).toContain('text-muted-foreground')
  })

  it('applies the shaded class to active destinations and to More when its sheet is open', () => {
    expect(bottomNavSource).toContain('active ? NAV_TAB_SELECTED_CLASS : NAV_TAB_IDLE_CLASS')
    expect(bottomNavSource).toContain('moreOpen ? NAV_TAB_SELECTED_CLASS : NAV_TAB_IDLE_CLASS')
    expect(bottomNavSource).toMatch(/aria-current=\{active \? ['"]page['"] : undefined\}/)
    expect(bottomNavSource).toContain('aria-expanded={moreOpen}')
  })

  it('keeps the center Ask + as an always-filled FAB without changing Ask wiring', () => {
    expect(bottomNavSource).toContain(
      'rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90'
    )
    expect(bottomNavSource).toMatch(/<span aria-hidden="true"[^>]*>\s*\+\s*<\/span>/)
    expect(bottomNavSource).not.toContain('askOpen ? NAV_TAB_SELECTED_CLASS')
  })
})

describe('phone-landscape five-tab visibility', () => {
  it('hides the bar only when the viewport is tablet/desktop-wide AND tall', () => {
    expect(hidesPhoneBottomNav(390, 844)).toBe(false)
    expect(hidesPhoneBottomNav(844, 390)).toBe(false)
    expect(hidesPhoneBottomNav(767, 1024)).toBe(false)
    expect(hidesPhoneBottomNav(768, 519)).toBe(false)
    expect(hidesPhoneBottomNav(768, 1024)).toBe(true)
    expect(hidesPhoneBottomNav(1280, 800)).toBe(true)
    expect(hidesPhoneBottomNav(1024, 768)).toBe(true)
  })

  it('does not use width-only sm:hidden on the bar, matching the hide media query', () => {
    expect(BOTTOM_NAV_HIDE_MQ).toBe('(min-width:768px) and (min-height:32.5rem)')
    expect(BOTTOM_NAV_VISIBILITY_CLASS).toContain(BOTTOM_NAV_HIDE_MQ.replace(/ /g, '_'))
    expect(bottomNavSource).toContain('BOTTOM_NAV_VISIBILITY_CLASS')
    expect(bottomNavSource).not.toMatch(/className="fixed inset-x-0 bottom-0[^"]*sm:hidden/)
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
  it('hosts CampaignCreator in a labelled Ask Koolerr dialog and never links to /pipeline', () => {
    expect(bottomNavSource).toContain('CampaignCreator')
    expect(bottomNavSource).toContain('aria-label="Ask Koolerr"')
    expect(bottomNavSource).toContain('title="Ask Koolerr"')
    expect(bottomNavSource).toContain('role="dialog"')
    expect(bottomNavSource).toContain('aria-modal="true"')
    expect(bottomNavSource).toContain(
      '<h2 className="text-lg font-semibold text-foreground">Ask Koolerr</h2>'
    )
    expect(bottomNavSource).toContain('question="What do you need?"')
    expect(bottomNavSource).toContain('submitLabel="Start"')
    expect(bottomNavSource).toContain('onStarted={() => setStarted(true)}')
    expect(bottomNavSource).not.toContain('aria-label="New campaign"')
    expect(bottomNavSource).not.toContain('>New campaign</h2>')
    expect(bottomNavSource).not.toContain('Create campaign')
    expect(bottomNavSource).not.toContain('initialGoal')
    expect(bottomNavSource).toContain('type="button"')
    expect(bottomNavSource).not.toMatch(/href=["']\/pipeline["']/)
    expect(bottomNavSource).not.toMatch(/href=\{['"]\/pipeline['"]\}/)
  })

  it('keeps five-tab structure, visible Ask +, and blank Ask with no outcome prefill', () => {
    expect(bottomNavSlotLabels(PRIMARY_NAV)).toEqual(['Home', 'Work', 'Ask+', 'Business', 'More'])
    expect(bottomNavSource).toContain('aria-label="Ask Koolerr"')
    expect(bottomNavSource).toMatch(/<span aria-hidden="true"[^>]*>\s*\+\s*<\/span>/)
    expect(bottomNavSource).not.toContain('initialGoal')
    expect(bottomNavSource).not.toContain('initialCustomTopic')
    expect(bottomNavSource).not.toContain('initialFocus')
    expect(bottomNavSource).not.toContain('HOME_ASK_GOALS')
  })

  it('marks the current destination with aria-current and keeps Ask as an action', () => {
    expect(bottomNavSource).toMatch(/aria-current=\{active \? ['"]page['"] : undefined\}/)
    expect(bottomNavSource).toContain('aria-haspopup="dialog"')
    expect(bottomNavSource).toContain('aria-expanded={askOpen}')
    expect(bottomNavSource).toContain('min-h-11')
    expect(bottomNavSource).toContain('min-w-11')
  })

  it('contains the Ask dialog to the viewport so Start stays reachable in landscape', () => {
    expect(ASK_DIALOG_PANEL_CLASS).toContain('max-h-[calc(100dvh-1.5rem)]')
    expect(ASK_DIALOG_PANEL_CLASS).toContain('overflow-hidden')
    expect(ASK_DIALOG_PANEL_CLASS).toContain('flex-col')
    expect(bottomNavSource).toContain('ASK_DIALOG_PANEL_CLASS')
    expect(bottomNavSource).toContain('min-h-0 overflow-y-auto')
    expect(bottomNavSource).toContain('items-center justify-center')
    expect(bottomNavSource).not.toContain('items-start justify-center overflow-y-auto')
    expect(bottomNavSource).not.toContain('relative mt-8 w-full max-w-lg')
    expect(bottomNavSource).toContain('submitLabel="Start"')
    expect(bottomNavSource).toContain('onStarted={() => setStarted(true)}')
    expect(bottomNavSource).toContain('question="What do you need?"')
  })

  it('hides the five-tab bar on tablet/desktop without using width-only sm:hidden', () => {
    expect(bottomNavSource).toContain('BOTTOM_NAV_VISIBILITY_CLASS')
    expect(bottomNavSource).toContain('fixed inset-x-0 bottom-0')
    expect(bottomNavSource).toContain('flex-1')
    expect(bottomNavSource).toContain('min-w-0')
    expect(bottomNavSource).toContain('overflow-visible')
    expect(mobileNavSource).toContain('sm:hidden')
    expect(layoutSource).toContain('HEADER_PRIMARY_NAV_CLASS')
    expect(layoutSource).toContain('<MobileNav')
    expect(layoutSource).not.toContain('BottomNav')
  })

  it('reserves mobile main padding so the fixed bar does not cover page actions', () => {
    expect(layoutSource).toContain('pb-24')
    expect(layoutSource).toContain('MAIN_WITH_BOTTOM_NAV_PAD_CLASS')
    expect(layoutSource).toContain('MAIN_BILLING_ONLY_PAD_CLASS')
    expect(layoutSource).toContain('[@media(min-width:768px)_and_(min-height:32.5rem)]:pb-8')
    expect(layoutSource).toContain('[@media(min-width:768px)_and_(min-height:32.5rem)]:pb-16')
  })
})
