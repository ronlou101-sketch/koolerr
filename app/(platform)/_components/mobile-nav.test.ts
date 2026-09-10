import { describe, it, expect } from 'vitest'
import {
  FOCUSABLE_SELECTOR,
  describeFocusCandidate,
  focusTrapTarget,
  isFocusCandidate,
  type FocusCandidate,
} from './mobile-nav-focus'

/**
 * Vitest runs in the `node` environment for this repo (see vitest.config.ts) and
 * no DOM test environment is installed, so these tests cover the focus-trap
 * decision logic — not a rendered drawer receiving real Tab keystrokes. See the
 * "not covered" note at the bottom of this file.
 */

const candidate = (overrides: Partial<FocusCandidate> = {}): FocusCandidate => ({
  disabled: false,
  hidden: false,
  ariaHidden: null,
  tabIndex: null,
  rendered: true,
  ...overrides,
})

/** Minimal stand-in for the handful of element APIs describeFocusCandidate reads. */
const fakeElement = (attributes: Record<string, string>, rectCount = 1) =>
  ({
    hasAttribute: (name: string) => name in attributes,
    getAttribute: (name: string) => (name in attributes ? attributes[name] : null),
    getClientRects: () => ({ length: rectCount }),
  }) as unknown as HTMLElement

describe('FOCUSABLE_SELECTOR', () => {
  it('matches the element kinds the drawer actually renders', () => {
    expect(FOCUSABLE_SELECTOR).toContain('a[href]')
    expect(FOCUSABLE_SELECTOR).toContain('button')
  })
})

describe('isFocusCandidate()', () => {
  it('accepts a plain rendered, enabled element', () => {
    expect(isFocusCandidate(candidate())).toBe(true)
  })

  it('rejects disabled elements', () => {
    expect(isFocusCandidate(candidate({ disabled: true }))).toBe(false)
  })

  it('rejects hidden elements', () => {
    expect(isFocusCandidate(candidate({ hidden: true }))).toBe(false)
  })

  it('rejects elements that occupy no layout', () => {
    expect(isFocusCandidate(candidate({ rendered: false }))).toBe(false)
  })

  it('rejects aria-hidden="true" but not aria-hidden="false"', () => {
    expect(isFocusCandidate(candidate({ ariaHidden: 'true' }))).toBe(false)
    expect(isFocusCandidate(candidate({ ariaHidden: 'false' }))).toBe(true)
  })

  it('skips negative tabindex, keeps zero and positive', () => {
    expect(isFocusCandidate(candidate({ tabIndex: -1 }))).toBe(false)
    expect(isFocusCandidate(candidate({ tabIndex: 0 }))).toBe(true)
    expect(isFocusCandidate(candidate({ tabIndex: 2 }))).toBe(true)
  })
})

describe('describeFocusCandidate()', () => {
  it('reads attributes off an element', () => {
    const described = describeFocusCandidate(
      fakeElement({ disabled: '', 'aria-hidden': 'true', tabindex: '-1' })
    )
    expect(described).toEqual({
      disabled: true,
      hidden: false,
      ariaHidden: 'true',
      tabIndex: -1,
      rendered: true,
    })
  })

  it('reports a missing tabindex as null rather than zero', () => {
    expect(describeFocusCandidate(fakeElement({})).tabIndex).toBeNull()
  })

  it('treats an unparseable tabindex as absent', () => {
    expect(describeFocusCandidate(fakeElement({ tabindex: 'nope' })).tabIndex).toBeNull()
  })

  it('marks an element with no client rects as not rendered', () => {
    expect(describeFocusCandidate(fakeElement({}, 0)).rendered).toBe(false)
  })
})

describe('focusTrapTarget()', () => {
  const items = ['backdrop', 'close', 'home', 'campaigns'] as const
  const first = items[0]
  const last = items[items.length - 1]

  it('lets the browser handle Tab in the middle of the cycle', () => {
    expect(focusTrapTarget(items, 'close', false)).toBeNull()
    expect(focusTrapTarget(items, 'home', false)).toBeNull()
  })

  it('lets the browser handle Shift+Tab in the middle of the cycle', () => {
    expect(focusTrapTarget(items, 'close', true)).toBeNull()
    expect(focusTrapTarget(items, 'campaigns', true)).toBeNull()
  })

  it('wraps Tab from the last element to the first', () => {
    expect(focusTrapTarget(items, last, false)).toBe(first)
  })

  it('wraps Shift+Tab from the first element to the last', () => {
    expect(focusTrapTarget(items, first, true)).toBe(last)
  })

  it('pulls focus back in when it is outside the dialog', () => {
    expect(focusTrapTarget(items, 'page-content-behind-drawer', false)).toBe(first)
    expect(focusTrapTarget(items, 'page-content-behind-drawer', true)).toBe(last)
  })

  it('pulls focus back in when nothing is focused', () => {
    expect(focusTrapTarget(items, null, false)).toBe(first)
    expect(focusTrapTarget(items, null, true)).toBe(last)
  })

  it('keeps a lone focusable focused in both directions', () => {
    expect(focusTrapTarget(['only'], 'only', false)).toBe('only')
    expect(focusTrapTarget(['only'], 'only', true)).toBe('only')
  })

  it('has no target when the dialog holds nothing focusable', () => {
    expect(focusTrapTarget([], null, false)).toBeNull()
    expect(focusTrapTarget([], null, true)).toBeNull()
  })

  it('cycles a full forward loop back to where it started', () => {
    let current: string = first
    for (let step = 0; step < items.length; step += 1) {
      const forced = focusTrapTarget(items, current, false)
      // A null result means the browser advances one step natively.
      current = forced ?? items[items.indexOf(current as never) + 1]
    }
    expect(current).toBe(first)
  })

  it('cycles a full backward loop back to where it started', () => {
    let current: string = last
    for (let step = 0; step < items.length; step += 1) {
      const forced = focusTrapTarget(items, current, true)
      current = forced ?? items[items.indexOf(current as never) - 1]
    }
    expect(current).toBe(last)
  })
})

/**
 * NOT covered by this file, and not claimed to be:
 *
 * - Real `Tab` / `Shift+Tab` keystrokes against a rendered drawer. There is no
 *   jsdom/happy-dom/testing-library in this repo and no dependency may be added,
 *   so the component's keydown listener, its querySelectorAll wiring, Escape
 *   handling, and focus restoration to the trigger are verified by typecheck,
 *   build, and manual browser testing rather than by vitest.
 * - Browser-native tab order between the edges (the null results above), which
 *   is deliberately delegated to the browser.
 */
