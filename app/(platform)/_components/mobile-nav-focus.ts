/**
 * Elements the drawer may hand keyboard focus to.
 *
 * Deliberately narrow: the drawer only ever renders anchors and buttons, so a
 * broad "everything focusable" selector would be speculative surface area.
 */
export const FOCUSABLE_SELECTOR = 'a[href], button, [tabindex]'

/**
 * The focus-relevant facts about one candidate element.
 *
 * Kept separate from the DOM so the filtering rule can be exercised directly by
 * the node-environment test suite, which has no document to render into.
 */
export interface FocusCandidate {
  disabled: boolean
  hidden: boolean
  /** Raw `aria-hidden` attribute value, or null when absent. */
  ariaHidden: string | null
  /** Parsed `tabindex`, or null when absent or unparseable. */
  tabIndex: number | null
  /** Whether the element occupies layout — false inside a `display: none` subtree. */
  rendered: boolean
}

/**
 * Whether a candidate should participate in the drawer's tab cycle.
 *
 * A negative `tabindex` is programmatically focusable but intentionally skipped
 * by sequential navigation, so the trap must skip it too or Tab would land
 * somewhere the browser never would.
 */
export function isFocusCandidate(candidate: FocusCandidate): boolean {
  if (candidate.disabled || candidate.hidden || !candidate.rendered) return false
  if (candidate.ariaHidden === 'true') return false
  if (candidate.tabIndex !== null && candidate.tabIndex < 0) return false
  return true
}

/** Reads the focus-relevant facts off a live element. */
export function describeFocusCandidate(el: HTMLElement): FocusCandidate {
  const rawTabIndex = el.getAttribute('tabindex')
  const parsed = rawTabIndex === null ? Number.NaN : Number.parseInt(rawTabIndex, 10)
  return {
    disabled: el.hasAttribute('disabled'),
    hidden: el.hasAttribute('hidden'),
    ariaHidden: el.getAttribute('aria-hidden'),
    tabIndex: Number.isNaN(parsed) ? null : parsed,
    rendered: el.getClientRects().length > 0,
  }
}

/**
 * Where focus must be forced on Tab, or null to let the browser move it itself.
 *
 * Generic over the element type so the cycle arithmetic can be tested without a
 * DOM. Forcing focus only at the edges keeps native tab order intact in between.
 */
export function focusTrapTarget<T>(
  focusables: readonly T[],
  active: T | null,
  shiftKey: boolean
): T | null {
  if (focusables.length === 0) return null
  const first = focusables[0]
  const last = focusables[focusables.length - 1]
  // Focus sitting outside the drawer (or nowhere) gets pulled back to an edge.
  const index = active === null ? -1 : focusables.indexOf(active)
  if (index === -1) return shiftKey ? last : first
  if (shiftKey) return index === 0 ? last : null
  return index === focusables.length - 1 ? first : null
}

/**
 * Mobile navigation drawer for the platform header (Phase 11 grouped IA).
 *
 * Rendered only below the `sm` breakpoint (the desktop bar handles larger screens).
 * A hamburger opens a right-side drawer that mirrors the desktop groups: the
 * primary items first, then a "More" section, then a founder-only "Owner" section.
 * Tapping a link or the backdrop closes it.
 *
 * Accessibility: the panel is a labelled modal dialog. On open, focus moves to the
 * Close button; Escape closes it; on close, focus returns to the trigger. While it
 * is open, Tab and Shift+Tab cycle within the panel rather than escaping to the
 * page behind it.
 */
