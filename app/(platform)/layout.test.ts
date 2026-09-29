import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { MORE_NAV, PRIMARY_NAV, isNavItemActive } from './_lib/nav-items'

const here = dirname(fileURLToPath(import.meta.url))
const layoutSource = readFileSync(join(here, 'layout.tsx'), 'utf8')
const bellSource = readFileSync(join(here, '_components/notification-bell.tsx'), 'utf8')
const dropdownSource = readFileSync(join(here, '_components/nav-dropdown.tsx'), 'utf8')

function sliceBetween(source: string, start: string, end: string): string {
  const from = source.indexOf(start)
  const to = source.indexOf(end, from)
  expect(from).toBeGreaterThan(-1)
  expect(to).toBeGreaterThan(from)
  return source.slice(from, to)
}

function exportedString(source: string, name: string): string {
  const match = source.match(new RegExp(`export const ${name} =\\s*'([^']+)'`))
  expect(match, `missing exported class ${name}`).toBeTruthy()
  return match![1]
}

describe('header Owner × notification cluster (lock 6fbbe92b)', () => {
  const barClass = exportedString(layoutSource, 'HEADER_BAR_CLASS')
  const actionsClass = exportedString(layoutSource, 'HEADER_ACTIONS_CLASS')
  const clusterClass = exportedString(layoutSource, 'HEADER_OWNER_BELL_CLUSTER_CLASS')

  it('covers desktop, tablet, and phone widths without hiding Owner to fix overlap', () => {
    expect(layoutSource).toContain(
      'export const HEADER_OWNER_BELL_BREAKPOINTS_PX = [1280, 768, 390] as const'
    )
    expect(barClass).toContain('flex-wrap')
    expect(barClass).toContain('min-h-14')
    expect(barClass).not.toMatch(/overflow-x-(auto|scroll)/)
    expect(clusterClass).toContain('flex-wrap')
    expect(clusterClass).toContain('gap-3')
    expect(actionsClass).toContain('flex-wrap')
    expect(layoutSource).not.toMatch(/owner\.length > 0 &&[\s\S]{0,120}hidden/)
  })

  it('places Owner and the bell as siblings so both stay independently reachable', () => {
    expect(layoutSource).toContain('className={HEADER_OWNER_BELL_CLUSTER_CLASS}')
    const cluster = sliceBetween(
      layoutSource,
      'className={HEADER_OWNER_BELL_CLUSTER_CLASS}',
      '<AccountMenu'
    )
    expect(cluster).toContain('label="⌘ Owner"')
    expect(cluster).toContain('ariaLabel="Owner tools"')
    expect(cluster).toContain('items={owner}')
    expect(cluster).toContain('owner.length > 0')
    expect(cluster).toContain('<NotificationBell organizationId={ctx.organizationId} />')
    expect(cluster.indexOf('⌘ Owner')).toBeLessThan(cluster.indexOf('NotificationBell'))
  })

  it('keeps Owner out of the desktop-only nav so it remains shown with the bell at 390', () => {
    const nav = sliceBetween(layoutSource, 'className={HEADER_PRIMARY_NAV_CLASS}', '</nav>')
    expect(nav).toContain('label="More"')
    expect(nav).not.toContain('⌘ Owner')
    expect(nav).not.toContain('NotificationBell')
    expect(nav).not.toContain('Owner tools')
  })

  it('preserves founder gating, labels, and notification wiring', () => {
    expect(layoutSource).toContain('{owner.length > 0 && (')
    expect(layoutSource).toContain('label="⌘ Owner"')
    expect(layoutSource).toContain('ariaLabel="Owner tools"')
    expect(layoutSource).toContain(
      '{ctx && <NotificationBell organizationId={ctx.organizationId} />}'
    )
    expect(layoutSource).toContain('const { primary, more, owner } = platformNav(isFounder)')
    expect(bellSource).toContain('workforceEngineService.listEngagementRuns(organizationId)')
    expect(bellSource).toContain('markRunsSeenAndOpen')
    expect(bellSource).toContain('deriveRunNotifications')
  })

  it('does not introduce header H-scroll or clip the Owner + bell row', () => {
    const header = sliceBetween(layoutSource, '<header', '</header>')
    expect(header).toContain('className={HEADER_BAR_CLASS}')
    expect(header).toContain('className={HEADER_ACTIONS_CLASS}')
    expect(header).not.toMatch(/overflow-x-(auto|scroll|hidden)/)
    expect(header).not.toContain('overflow-hidden')
    expect(barClass).toContain('min-h-14')
    expect(barClass.split(/\s+/)).not.toContain('h-14')
  })

  it('gives the bell its own non-collapsing hit target without changing fetch/mark logic', () => {
    expect(bellSource).toContain('className="relative shrink-0"')
    expect(bellSource).toContain(
      'className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"'
    )
    expect(bellSource).toContain(
      "aria-label={unread > 0 ? `${unread} finished runs to review` : 'Run notifications'}"
    )
    expect(dropdownSource).toContain(
      'className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-sm hover:text-foreground ${'
    )
  })
})

describe('header selected state (lock b8febeaa Slice 1)', () => {
  const work = PRIMARY_NAV[1]
  const home = PRIMARY_NAV[0]
  const business = PRIMARY_NAV[2]
  const selectedClass = exportedString(layoutSource, 'HEADER_PEER_SELECTED_CLASS')
  const dropdownWrap = exportedString(layoutSource, 'HEADER_DROPDOWN_SELECTED_WRAP_CLASS')
  const headerNavClass = exportedString(layoutSource, 'HEADER_PRIMARY_NAV_CLASS')

  it('uses a visible shade/color on selected header peers, not type-weight alone', () => {
    expect(selectedClass).toContain('bg-primary/10')
    expect(selectedClass).toContain('rounded-md')
    expect(dropdownWrap).toContain('bg-primary/10')
    expect(layoutSource).toContain('active ? HEADER_PEER_SELECTED_CLASS : HEADER_PEER_IDLE_CLASS')
    expect(layoutSource).toContain('active ? HEADER_DROPDOWN_SELECTED_WRAP_CLASS : ')
  })

  it('marks Work selected on the /work hub as well as Work child routes', () => {
    expect(isNavItemActive('/work', work)).toBe(true)
    expect(isNavItemActive('/runs', work)).toBe(true)
    expect(isNavItemActive('/approvals', work)).toBe(true)
    expect(isNavItemActive('/deliverables', work)).toBe(true)
    expect(isNavItemActive('/dashboard', work)).toBe(false)
    expect(layoutSource).toContain('isHeaderPeerActive(pathname, item)')
    expect(layoutSource).toContain('return isNavItemActive(pathname, item)')
  })

  it('marks Home and Business with the same peer-active helper', () => {
    expect(isNavItemActive('/dashboard', home)).toBe(true)
    expect(isNavItemActive('/brain', business)).toBe(true)
    expect(isNavItemActive('/billing', business)).toBe(true)
    expect(layoutSource).toContain('const active = isHeaderPeerActive(pathname, item)')
  })

  it('marks header More selected on More destinations using the same shade wrap', () => {
    expect(MORE_NAV.some((item) => isNavItemActive('/academy', item))).toBe(true)
    expect(layoutSource).toContain('more.some((item) => isNavItemActive(pathname, item))')
    expect(layoutSource).toContain('HEADER_DROPDOWN_SELECTED_WRAP_CLASS')
  })

  it('keeps header links on tablet/desktop and yields to the five-tab bar on phone landscape', () => {
    expect(headerNavClass).toContain('hidden')
    expect(headerNavClass).toContain('[@media(min-width:768px)_and_(min-height:32.5rem)]:flex')
    expect(headerNavClass).not.toContain('sm:flex')
    expect(layoutSource).toContain('MAIN_WITH_BOTTOM_NAV_PAD_CLASS')
  })
})
