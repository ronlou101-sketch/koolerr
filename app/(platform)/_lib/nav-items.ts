/**
 * Single source of truth for the platform header navigation.
 *
 * Primary customer peers are Home / Work / Business (Architect lock 339fed89).
 * Work is lifecycle chrome — not a fourth product area — and composes the
 * existing destinations Needs you (/approvals), In progress (/runs), and
 * Results (/deliverables). Business is account chrome (Architect lock 526a07ad)
 * and composes Brain, Billing → Usage, and Advanced (Permissions / Audit).
 * Desktop bar and mobile drawer both render from these groups, so nav changes
 * are made in exactly one place.
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
   * Nested destinations (or group labels) surfaced under this item.
   * Nested entries are not primary peers — desktop and mobile both read them
   * from here so composition stays in one place.
   */
  children?: NavNode[]
}

/**
 * Non-navigable group label (Advanced). Has no href and must not invent a
 * route. When `collapsed` is set, children start hidden until expanded.
 */
export interface NavGroup {
  label: string
  collapsed?: boolean
  children: NavNode[]
}

/** Destination or non-route group label in a nested nav tree. */
export type NavNode = NavItem | NavGroup

/** True when the node is a group label with no destination href. */
export function isNavGroup(node: NavNode): node is NavGroup {
  return !('href' in node)
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
 * Business destinations — composed over existing routes, never replacing them.
 * Usage lives exclusively under Billing. Advanced is a collapsed group label
 * (not a route); Consent is labeled Permissions in chrome only.
 */
export const BUSINESS_NAV: NavNode[] = [
  { href: '/brain', label: 'Brain' },
  {
    href: '/billing',
    label: 'Billing',
    children: [{ href: '/usage', label: 'Usage' }],
  },
  {
    label: 'Advanced',
    collapsed: true,
    children: [
      { href: '/consent', label: 'Permissions' },
      { href: '/audit', label: 'Audit' },
    ],
  },
]

/**
 * Primary customer navigation — always visible in the header bar.
 * Work carries the live pending-review badge so "does my employee need
 * anything from me?" is answered without hunting for a separate Review peer.
 * Business hrefs /brain (Brain remains the existing destination; no Profile).
 */
export const PRIMARY_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Home' },
  { href: '/work', label: 'Work', badgeKey: 'review', children: WORK_NAV },
  { href: '/brain', label: 'Business', children: BUSINESS_NAV },
]

/**
 * Secondary customer tools — surfaced under the "More" dropdown.
 * Learn is demoted here (beside Support) so it is reachable without being a
 * primary peer. Brain is omitted while Business owns /brain. Billing, Usage,
 * Consent, and Audit nest under Business (lock 526a07ad) and are not More peers.
 * Pipeline stays delisted (route preserved for back-compat).
 */
export const MORE_NAV: NavItem[] = [
  { href: '/creative', label: 'Creative' },
  { href: '/workforces', label: 'Workforces' },
  { href: '/analytics', label: 'Analytics' },
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
 * Flatten a nav list including nested children. Group labels contribute no
 * href. Used by tests (and the Work / Business shells) so href union checks
 * cannot silently drop destinations.
 */
export function navHrefs(items: NavNode[]): string[] {
  return items.flatMap((item) => {
    if (isNavGroup(item)) return navHrefs(item.children)
    return [item.href, ...(item.children ? navHrefs(item.children) : [])]
  })
}

/**
 * Whether a path is this node or any nested descendant.
 *
 * Group labels have no href; they match only through children. Recurses so
 * Usage (/usage) under Billing and Advanced destinations still mark Business
 * current without promoting those children to primary peers.
 */
export function isNavItemActive(pathname: string, item: NavNode): boolean {
  if (!isNavGroup(item) && (pathname === item.href || pathname.startsWith(`${item.href}/`))) {
    return true
  }
  return (item.children ?? []).some((child) => isNavItemActive(pathname, child))
}

/** Visible row in a nested menu after applying collapsed-group expansion. */
export type VisibleNavNode =
  | { kind: 'link'; href: string; label: string; depth: number }
  | { kind: 'group'; label: string; expanded: boolean; depth: number }

/**
 * Flatten nested nav for desktop/mobile menus.
 *
 * Destination children (Billing → Usage) are always visible. Collapsed group
 * labels (Advanced) hide their children until `expandedLabels` contains the
 * group label — empty set means Advanced starts collapsed.
 */
export function flattenVisibleNavMenu(
  items: NavNode[],
  expandedLabels: ReadonlySet<string>,
  depth = 0
): VisibleNavNode[] {
  const nodes: VisibleNavNode[] = []
  for (const item of items) {
    if (isNavGroup(item)) {
      const expanded = item.collapsed ? expandedLabels.has(item.label) : true
      nodes.push({ kind: 'group', label: item.label, expanded, depth })
      if (expanded) {
        nodes.push(...flattenVisibleNavMenu(item.children, expandedLabels, depth + 1))
      }
      continue
    }
    nodes.push({ kind: 'link', href: item.href, label: item.label, depth })
    if (item.children?.length) {
      nodes.push(...flattenVisibleNavMenu(item.children, expandedLabels, depth + 1))
    }
  }
  return nodes
}
