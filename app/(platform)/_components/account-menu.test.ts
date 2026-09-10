import { describe, it, expect } from 'vitest'
import {
  MENU_ITEM_SELECTOR,
  activeMenuIndex,
  focusMenuItem,
  nextMenuIndex,
} from './nav-dropdown-focus'

/**
 * The AccountMenu reuses the dropdown roving helpers rather than owning its own
 * copy, so the helpers' general behaviour is already covered by
 * `nav-dropdown.test.ts`. What is NOT covered there is the shape the account menu
 * actually renders: a menu holding exactly one actionable `role="menuitem"`
 * (Sign out) alongside a non-actionable "Signed in as" block. These tests pin
 * that shape down, because it is the case where "move to the next item" and
 * "stay where you are" are indistinguishable and easy to get wrong.
 *
 * Vitest runs in the `node` environment for this repo (see vitest.config.ts) and
 * no DOM test environment is installed, so these exercise focus-movement
 * decisions against hand-built stand-ins — not a rendered menu receiving real
 * keystrokes. See the "not covered" note at the bottom.
 */

/** Minimal stand-in for the Sign out button: records whether focus() was called. */
const fakeItem = (id: string) => {
  const item = {
    id,
    focused: false,
    focus() {
      item.focused = true
    },
  }
  return item
}

/**
 * Minimal stand-in for the menu container. `querySelectorAll` answers with the
 * items the real DOM would return for MENU_ITEM_SELECTOR — which is why the
 * non-actionable header block is simply absent from this list.
 */
const fakeMenu = (items: ReturnType<typeof fakeItem>[], activeElement: unknown = null) =>
  ({
    querySelectorAll: () => items,
    ownerDocument: { activeElement },
  }) as unknown as HTMLElement

describe('account menu roving over a single actionable item', () => {
  it('enters the menu on the Sign out button when opened downward', () => {
    const items = [fakeItem('sign-out')]
    expect(focusMenuItem(fakeMenu(items), 'ArrowDown', -1)).toBe(true)
    expect(items[0].focused).toBe(true)
  })

  it('enters the menu on the Sign out button when opened upward', () => {
    // The last item and the first item are the same element here, so ArrowUp on
    // the trigger must still land somewhere rather than falling through.
    const items = [fakeItem('sign-out')]
    expect(focusMenuItem(fakeMenu(items), 'ArrowUp', -1)).toBe(true)
    expect(items[0].focused).toBe(true)
  })

  it('keeps focus on the only item for every navigation key', () => {
    for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End'] as const) {
      const items = [fakeItem('sign-out')]
      expect(focusMenuItem(fakeMenu(items, items[0]), key, 0)).toBe(true)
      expect(items[0].focused).toBe(true)
      expect(nextMenuIndex(key, 0, items.length)).toBe(0)
    }
  })

  it('reports the focused item so repeated arrows resolve from the right place', () => {
    const items = [fakeItem('sign-out')]
    expect(activeMenuIndex(fakeMenu(items, items[0]))).toBe(0)
  })

  it('reports -1 while focus is still on the trigger, which is how opening enters', () => {
    const items = [fakeItem('sign-out')]
    expect(activeMenuIndex(fakeMenu(items, fakeItem('account-trigger')))).toBe(-1)
  })
})

describe('account menu roving when there is nothing to focus', () => {
  it('does not claim a move before the menu is rendered', () => {
    // The open effect runs with menuRef unset on the very first pass in some
    // React orderings; it must not report a move it did not make.
    expect(focusMenuItem(null, 'ArrowDown', -1)).toBe(false)
    expect(activeMenuIndex(null)).toBe(-1)
  })

  it('does not claim a move for a menu with no actionable item', () => {
    expect(focusMenuItem(fakeMenu([]), 'ArrowDown', -1)).toBe(false)
    expect(focusMenuItem(fakeMenu([]), 'End', -1)).toBe(false)
  })
})

describe('what arrow navigation is allowed to reach', () => {
  it('addresses menu items by role, which the "Signed in as" block does not carry', () => {
    // The header block renders as a plain div/p with no role, so a real
    // querySelectorAll for this selector cannot return it. This assertion pins
    // the selector; the markup side of that argument is structural, not proven
    // here — see the note below.
    expect(MENU_ITEM_SELECTOR).toBe('[role="menuitem"]')
  })
})

/**
 * NOT covered by this file, and not claimed to be:
 *
 * - Real key events against a rendered account menu. There is no
 *   jsdom/happy-dom/testing-library in this repo and no dependency may be added,
 *   so the component's own wiring — the trigger's ArrowDown/ArrowUp handler, the
 *   menu's onKeyDown, focusing the Sign out button when the menu opens, Escape
 *   closing and restoring focus to the trigger, outside-click closing, and the
 *   aria-expanded / aria-controls attributes — is verified by typecheck, build,
 *   and manual browser testing rather than by vitest.
 * - That the real DOM skips the "Signed in as" block. The fake container above
 *   returns whatever list it was given; only a browser proves that
 *   querySelectorAll('[role="menuitem"]') does not match that markup.
 * - Tab / Shift+Tab behaviour, which is deliberately left to the browser: this
 *   is a disclosure menu, not a modal dialog, so focus is not trapped.
 * - The sign-out server action, which this change does not touch.
 */
