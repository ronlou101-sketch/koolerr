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
}

/** Primary customer navigation — always visible in the header bar. */
export const PRIMARY_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Home' },
  { href: '/runs', label: 'Campaigns' },
  { href: '/deliverables', label: 'Deliverables' },
  { href: '/academy', label: 'Learn' },
]

/**
 * Secondary customer tools — surfaced under the "More" dropdown.
 * Pipeline/Creative/Approvals remain here until Sprint 3 introduces their
 * modal/unified-Review replacements (discoverability is never reduced).
 */
export const MORE_NAV: NavItem[] = [
  { href: '/pipeline', label: 'Pipeline' },
  { href: '/creative', label: 'Creative' },
  { href: '/approvals', label: 'Approvals' },
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
