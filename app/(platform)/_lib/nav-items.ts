/**
 * Single source of truth for the platform header navigation (Phase 11 IA).
 *
 * Navigation is grouped, not flat: a small PRIMARY bar for the core customer
 * goals, a "More" dropdown for secondary customer tools, and a founder-only
 * "⌘ Owner" dropdown for company-internal tools. Desktop bar and mobile drawer
 * both render from these groups, so nav changes are made in exactly one place.
 *
 * This is presentation only — every route still exists and resolves directly;
 * grouping only decides where (and to whom) a link is surfaced. Founder gating
 * uses the caller-supplied isFounder flag (resolved in the layout from the
 * existing auth context); no permission logic lives here.
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
}

/**
 * Primary customer navigation — always visible in the header bar.
 * "Review" is a primary destination (Experience Phase 13 Slice B) carrying a
 * live pending-count badge, so "does my employee need anything from me?" is
 * answered without the customer hunting for it.
 */
export const PRIMARY_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Home' },
  { href: '/runs', label: 'Campaigns' },
  { href: '/deliverables', label: 'Deliverables' },
  { href: '/approvals', label: 'Review', badgeKey: 'review' },
  { href: '/academy', label: 'Learn' },
]

/**
 * Secondary customer tools — surfaced under the "More" dropdown.
 * Review was promoted to the primary bar in Slice B; Pipeline was removed as a
 * destination in Slice C (campaigns are now created from the Campaigns page via
 * the "New campaign" modal — the /pipeline route is preserved for back-compat).
 * Creative remains here until its modal replacement lands.
 */
export const MORE_NAV: NavItem[] = [
  { href: '/creative', label: 'Creative' },
  { href: '/workforces', label: 'Workforces' },
  { href: '/brain', label: 'Brain' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/billing', label: 'Billing' },
  { href: '/usage', label: 'Usage' },
  { href: '/audit', label: 'Audit' },
  { href: '/consent', label: 'Consent' },
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
