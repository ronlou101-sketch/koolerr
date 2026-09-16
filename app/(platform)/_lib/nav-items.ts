/**
 * Single source of truth for the platform header navigation.
 *
 * Primary customer peers are Home / Work / Business (Architect lock 339fed89).
 * Work is lifecycle chrome — not a fourth product area — and composes the
 * existing destinations Needs you (/approvals), In progress (/runs), and
 * Results (/deliverables). Desktop bar and mobile drawer both render from
 * these groups, so nav changes are made in exactly one place.
 *
 * This is presentation only — every legacy route still exists and resolves
 * directly; grouping only decides where (and to whom) a link is surfaced.
 * Founder gating uses the caller-supplied isFounder flag (resolved in the
 * layout from the existing auth context); no permission logic lives here.
 */
export interface NavItem {
  href: string
  label: string
  /**
   * Optional marker for a live count badge. When set, the platform layout
   * resolves the count for this key at render time and populates `badge`. The
   * static config only declares the marker; it never hardcodes a number.
   */
  badgeKey?: 'review'
  /**
   * Runtime-resolved count injected by the layout (not part of the static
   * config). Rendered as a small pill next to the label when greater than 0.
   */
  badge?: number
  /**
   * Nested destinations surfaced under this item (Work lifecycle chrome).
   * Nested items are not primary peers — desktop and mobile both read them
   * from here so composition stays in one place.
   */
  children?: NavItem[]
}

/**
 * Work lifecycle destinations — composed over existing routes, never replacing
 * them. Order is the customer loop: needs you → in progress → results.
 */
export const WORK_NAV: NavItem[] = [
  { href: '/approvals', label: 'Needs you' },
  { href: '/runs', label: 'In progress' },
  { href: '/deliverables', label: 'Results' },
]

/**
 * Primary customer navigation — always visible in the header bar.
 * Work carries the live pending-review badge so "does my employee need
 * anything from me?" is answered without hunting for a separate Review peer.
 * Business temporarily hrefs /brain; Billing/Usage nesting is a later slice.
 */
export const PRIMARY_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Home' },
  { href: '/work', label: 'Work', badgeKey: 'review', children: WORK_NAV },
  { href: '/brain', label: 'Business' },
]

/**
 * Secondary customer tools — surfaced under the "More" dropdown.
 * Learn is demoted here (beside Support) so it is reachable without being a
 * primary peer. Brain is omitted while Business temporarily owns /brain.
 * Pipeline stays delisted (route preserved for back-compat).
 */
export const MORE_NAV: NavItem[] = [
  { href: '/creative', label: 'Creative' },
  { href: '/workforces', label: 'Workforces' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/billing', label: 'Billing' },
  { href: '/usage', label: 'Usage' },
  { href: '/audit', label: 'Audit' },
  { href: '/consent', label: 'Consent' },
  { href: '/support', label: 'Support' },
  { href: '/academy', label: 'Learn' },
]

/** Founder-only tools — surfaced under the "⌘ Owner" dropdown; never shown to customers. */
export const OWNER_NAV: NavItem[] = [
  { href: '/tower', label: 'Command Center' },
  { href: '/tracker', label: 'Tracker' },
  { href: '/mission-control', label: 'Mission Control' },
  { href: '/revenue', label: 'Revenue' },
  { href: '/cto', label: 'CTO Agent' },
]

export interface PlatformNav {
  primary: NavItem[]
  more: NavItem[]
  owner: NavItem[]
}

/**
 * Grouped navigation for a viewer. Primary + More are identical for everyone;
 * the Owner group is populated only for the platform founder (empty otherwise).
 */
export function platformNav(isFounder: boolean): PlatformNav {
  return {
    primary: PRIMARY_NAV,
    more: MORE_NAV,
    owner: isFounder ? OWNER_NAV : [],
  }
}

/**
 * Flatten a nav list including nested children. Used by tests (and the Work
 * shell) so href union checks cannot silently drop lifecycle destinations.
 */
export function navHrefs(items: NavItem[]): string[] {
  return items.flatMap((item) => [item.href, ...(item.children ? navHrefs(item.children) : [])])
}
