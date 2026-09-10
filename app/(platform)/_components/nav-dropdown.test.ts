import { describe, it, expect } from 'vitest'
import {
  MENU_ITEM_SELECTOR,
  activeMenuIndex,
  focusMenuItem,
  isMenuNavigationKey,
  menuItemsIn,
  nextMenuIndex,
} from './nav-dropdown-focus'

/**
 * Vitest runs in the `node` environment for this repo (see vitest.config.ts) and
 * no DOM test environment is installed, so these tests cover the dropdown's
 * focus-movement decisions against hand-built stand-ins — not a rendered menu
 * receiving real keystrokes. See the "not covered" note at the bottom.
 */

/** Minimal stand-in for a menu item: records whether focus() was called on it. */
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
 * Minimal stand-in for the menu container: answers querySelectorAll with the
 * given items and reports `activeElement` through ownerDocument.
 */
const fakeMenu = (items: ReturnType<typeof fakeItem>[], activeElement: unknown = null) =>
  ({
    querySelectorAll: () => items,
    ownerDocument: { activeElement },
  }) as unknown as HTMLElement

describe('MENU_ITEM_SELECTOR', () => {
  it('targets the role the dropdown puts on its links', () => {
    expect(MENU_ITEM_SELECTOR).toBe('[role="menuitem"]')
  })
})

describe('isMenuNavigationKey()', () => {
  it('accepts the four keys the menu handles', () => {
    expect(isMenuNavigationKey('ArrowDown')).toBe(true)
    expect(isMenuNavigationKey('ArrowUp')).toBe(true)
    expect(isMenuNavigationKey('Home')).toBe(true)
    expect(isMenuNavigationKey('End')).toBe(true)
  })

  it('leaves other keys to the browser and to the Escape handler', () => {
    expect(isMenuNavigationKey('Escape')).toBe(false)
    expect(isMenuNavigationKey('Tab')).toBe(false)
    expect(isMenuNavigationKey('Enter')).toBe(false)
    expect(isMenuNavigationKey(' ')).toBe(false)
    expect(isMenuNavigationKey('ArrowLeft')).toBe(false)
  })
})

describe('nextMenuIndex()', () => {
  const count = 4

  it('steps forward and backward through the middle of the menu', () => {
    expect(nextMenuIndex('ArrowDown', 1, count)).toBe(2)
    expect(nextMenuIndex('ArrowUp', 2, count)).toBe(1)
  })

  it('wraps ArrowDown off the last item to the first', () => {
    expect(nextMenuIndex('ArrowDown', count - 1, count)).toBe(0)
  })

  it('wraps ArrowUp off the first item to the last', () => {
    expect(nextMenuIndex('ArrowUp', 0, count)).toBe(count - 1)
  })

  it('enters from outside at the end the arrow points at', () => {
    expect(nextMenuIndex('ArrowDown', -1, count)).toBe(0)
    expect(nextMenuIndex('ArrowUp', -1, count)).toBe(count - 1)
  })

  it('treats an out-of-range index as being outside the menu', () => {
    expect(nextMenuIndex('ArrowDown', count, count)).toBe(0)
    expect(nextMenuIndex('ArrowUp', 99, count)).toBe(count - 1)
  })

  it('jumps to the ends with Home and End regardless of where focus is', () => {
    expect(nextMenuIndex('Home', 2, count)).toBe(0)
    expect(nextMenuIndex('Home', -1, count)).toBe(0)
    expect(nextMenuIndex('End', 2, count)).toBe(count - 1)
    expect(nextMenuIndex('End', -1, count)).toBe(count - 1)
  })

  it('keeps a lone item selected in every direction', () => {
    expect(nextMenuIndex('ArrowDown', 0, 1)).toBe(0)
    expect(nextMenuIndex('ArrowUp', 0, 1)).toBe(0)
    expect(nextMenuIndex('Home', 0, 1)).toBe(0)
    expect(nextMenuIndex('End', 0, 1)).toBe(0)
  })

  it('has nowhere to go in an empty menu', () => {
    expect(nextMenuIndex('ArrowDown', -1, 0)).toBeNull()
    expect(nextMenuIndex('ArrowUp', -1, 0)).toBeNull()
    expect(nextMenuIndex('Home', -1, 0)).toBeNull()
    expect(nextMenuIndex('End', -1, 0)).toBeNull()
  })

  it('cycles a full forward loop back to where it started', () => {
    let index = 0
    for (let step = 0; step < count; step += 1) {
      index = nextMenuIndex('ArrowDown', index, count) as number
    }
    expect(index).toBe(0)
  })

  it('cycles a full backward loop back to where it started', () => {
    let index = 0
    for (let step = 0; step < count; step += 1) {
      index = nextMenuIndex('ArrowUp', index, count) as number
    }
    expect(index).toBe(0)
  })
})

describe('menuItemsIn()', () => {
  it('returns the container’s items in order', () => {
    const items = [fakeItem('a'), fakeItem('b')]
    expect(menuItemsIn(fakeMenu(items)).map((el) => (el as unknown as { id: string }).id)).toEqual([
      'a',
      'b',
    ])
  })

  it('reports nothing when the menu is not rendered', () => {
    expect(menuItemsIn(null)).toEqual([])
  })
})

describe('activeMenuIndex()', () => {
  const items = [fakeItem('a'), fakeItem('b'), fakeItem('c')]

  it('finds the focused item', () => {
    expect(activeMenuIndex(fakeMenu(items, items[1]))).toBe(1)
  })

  it('reports -1 when focus is on something outside the menu (the trigger)', () => {
    expect(activeMenuIndex(fakeMenu(items, fakeItem('trigger')))).toBe(-1)
  })

  it('reports -1 when nothing is focused', () => {
    expect(activeMenuIndex(fakeMenu(items, null))).toBe(-1)
  })

  it('reports -1 when the menu is not rendered', () => {
    expect(activeMenuIndex(null)).toBe(-1)
  })
})

describe('focusMenuItem()', () => {
  it('focuses the item the key selects and reports the move', () => {
    const items = [fakeItem('a'), fakeItem('b'), fakeItem('c')]
    expect(focusMenuItem(fakeMenu(items), 'ArrowDown', 0)).toBe(true)
    expect(items.map((i) => i.focused)).toEqual([false, true, false])
  })

  it('enters an unfocused menu at the first item on ArrowDown', () => {
    const items = [fakeItem('a'), fakeItem('b')]
    expect(focusMenuItem(fakeMenu(items), 'ArrowDown', -1)).toBe(true)
    expect(items[0].focused).toBe(true)
  })

  it('enters an unfocused menu at the last item on ArrowUp', () => {
    const items = [fakeItem('a'), fakeItem('b')]
    expect(focusMenuItem(fakeMenu(items), 'ArrowUp', -1)).toBe(true)
    expect(items[1].focused).toBe(true)
  })

  it('reports no move for an empty menu, so the keystroke stays with the browser', () => {
    expect(focusMenuItem(fakeMenu([]), 'ArrowDown', -1)).toBe(false)
  })

  it('reports no move when the menu is not rendered', () => {
    expect(focusMenuItem(null, 'ArrowDown', -1)).toBe(false)
  })
})

/**
 * NOT covered by this file, and not claimed to be:
 *
 * - Real key events against a rendered dropdown. There is no
 *   jsdom/happy-dom/testing-library in this repo and no dependency may be added,
 *   so the component's own wiring — the trigger's ArrowDown/ArrowUp handler, the
 *   menu's onKeyDown, focusing an item when the menu opens, Escape closing and
 *   restoring focus to the trigger, outside-click and pathname closing, and the
 *   aria-expanded / aria-controls attributes — is verified by typecheck, build,
 *   and manual browser testing rather than by vitest.
 * - Tab / Shift+Tab behaviour, which is deliberately left to the browser: this
 *   is a disclosure menu, not a modal dialog, so focus is not trapped.
 */
