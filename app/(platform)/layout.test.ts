import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

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
    expect(layoutSource).toContain('export const HEADER_OWNER_BELL_BREAKPOINTS_PX = [1280, 768, 390] as const')
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
    const nav = sliceBetween(
      layoutSource,
      '<nav className="hidden min-w-0 items-center gap-6 sm:flex">',
      '</nav>'
    )
    expect(nav).toContain('label="More"')
    expect(nav).not.toContain('⌘ Owner')
    expect(nav).not.toContain('NotificationBell')
    expect(nav).not.toContain('Owner tools')
  })

  it('preserves founder gating, labels, and notification wiring', () => {
    expect(layoutSource).toContain('{owner.length > 0 && (')
    expect(layoutSource).toContain('label="⌘ Owner"')
    expect(layoutSource).toContain('ariaLabel="Owner tools"')
    expect(layoutSource).toContain('{ctx && <NotificationBell organizationId={ctx.organizationId} />}')
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
