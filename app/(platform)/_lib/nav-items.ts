/**
 * Single source of truth for the platform header navigation.
 *
 * Both the desktop nav bar and the mobile drawer render from this list, so a nav
 * change is made in exactly one place. Labels here mirror the current desktop nav
 * verbatim (the "Media" → "Deliverables" rename is handled separately in 7.2).
 */
export interface NavItem {
  href: string
  label: string
  /** Emphasized styling in the desktop bar (bolder, foreground color). */
  primary?: boolean
  /** Only shown to the platform founder. */
  founderOnly?: boolean
}

export const PLATFORM_NAV_ITEMS: NavItem[] = [
  { href: '/cto', label: 'CTO Agent', primary: true },
  { href: '/pipeline', label: 'Pipeline' },
  { href: '/runs', label: 'Runs' },
  { href: '/creative', label: 'Creative' },
  { href: '/deliverables', label: 'Deliverables' },
  { href: '/workforces', label: 'Workforces' },
  { href: '/academy', label: 'Academy' },
  { href: '/approvals', label: 'Approvals' },
  { href: '/brain', label: 'Brain' },
  { href: '/consent', label: 'Consent' },
  { href: '/audit', label: 'Audit' },
  { href: '/usage', label: 'Usage' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/revenue', label: 'Revenue' },
  { href: '/mission-control', label: 'Mission Control' },
  { href: '/billing', label: 'Billing' },
  { href: '/tower', label: 'Tower', founderOnly: true },
  { href: '/tracker', label: 'Tracker', founderOnly: true },
]

/** The nav items visible to a viewer, filtering founder-only items by role. */
export function visibleNavItems(isFounder: boolean): NavItem[] {
  return PLATFORM_NAV_ITEMS.filter((item) => !item.founderOnly || isFounder)
}
