/**
 * Keyboard roving logic for the desktop nav dropdown's menu.
 *
 * Kept out of `nav-dropdown.tsx` so the index arithmetic can be exercised
 * directly by the node-environment test suite, which has no document to render
 * into. Same split as `mobile-nav-focus.ts`.
 */

/** The menu's focusable children — the dropdown renders nothing else inside it. */
export const MENU_ITEM_SELECTOR = '[role="menuitem"]'

/** Keys that move focus between menu items rather than acting on one. */
export type MenuNavigationKey = 'ArrowDown' | 'ArrowUp' | 'Home' | 'End'

const MENU_NAVIGATION_KEYS: readonly string[] = ['ArrowDown', 'ArrowUp', 'Home', 'End']

/** Whether a `KeyboardEvent.key` is one this module knows how to answer. */
export function isMenuNavigationKey(key: string): key is MenuNavigationKey {
  return MENU_NAVIGATION_KEYS.includes(key)
}

/**
 * The item index a navigation key should move focus to, or null when there is
 * nowhere to go (an empty menu).
 *
 * `current` is -1 when focus is not on a menu item — the state the trigger is in
 * when ArrowDown/ArrowUp opens the menu, which is why those two keys resolve to
 * the first and last item from there.
 *
 * Wrapping is deliberate: a menu is a closed cycle, so ArrowDown past the last
 * item returns to the first rather than stalling at the bottom edge.
 */
export function nextMenuIndex(
  key: MenuNavigationKey,
  current: number,
  count: number
): number | null {
  if (count <= 0) return null
  const index = current >= 0 && current < count ? current : -1
  switch (key) {
    case 'ArrowDown':
      return index === -1 ? 0 : (index + 1) % count
    case 'ArrowUp':
      return index === -1 ? count - 1 : (index - 1 + count) % count
    case 'Home':
      return 0
    case 'End':
      return count - 1
  }
}

/** The menu's items, in DOM order. Empty when the menu is not rendered. */
export function menuItemsIn(container: HTMLElement | null): HTMLElement[] {
  return container ? Array.from(container.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR)) : []
}

/**
 * Index of the focused menu item, or -1 when focus is elsewhere (on the trigger,
 * or outside the component entirely).
 */
export function activeMenuIndex(container: HTMLElement | null): number {
  const active = container?.ownerDocument.activeElement
  // A non-item (or a null activeElement) simply does not appear in the list.
  return active ? menuItemsIn(container).indexOf(active as HTMLElement) : -1
}

/**
 * Moves focus to the item `key` selects, starting from `from`.
 *
 * Reports whether focus actually moved, so the caller only swallows the
 * keystroke when it had somewhere to put it.
 */
export function focusMenuItem(
  container: HTMLElement | null,
  key: MenuNavigationKey,
  from: number
): boolean {
  const items = menuItemsIn(container)
  const target = nextMenuIndex(key, from, items.length)
  if (target === null) return false
  items[target]?.focus()
  return true
}
