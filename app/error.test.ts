import { describe, it, expect } from 'vitest'
import { ROOT_ERROR_BODY, ROOT_ERROR_TITLE, supportReference } from './error-copy'

/**
 * Regression cover for the root error boundary leaking `error.message` to the
 * screen. The boundary now derives exactly one displayable value from the
 * thrown Error — the opaque digest — so these tests pin that helper: what it
 * lets through, and what it must not.
 *
 * Vitest runs in the `node` environment for this repo (see vitest.config.ts)
 * and no DOM test environment is installed, so the rendered markup itself is
 * not asserted here. See the "not covered" note at the bottom.
 */

/** A thrown error as it would arrive at the boundary, with details worth hiding. */
const thrown = (digest?: string) => {
  const error = Object.assign(new Error('connect ECONNREFUSED 10.0.0.4:5432 as postgres'), {
    digest,
    cause: new Error('supabase service role key rejected'),
  })
  return error
}

describe('what the root error boundary may show from a thrown error', () => {
  it('surfaces the digest, which is the opaque support reference', () => {
    expect(supportReference(thrown('2451889721'))).toBe('2451889721')
  })

  it('exposes nothing else from the error — not the message, stack, or cause', () => {
    const error = thrown('2451889721')
    const shown = supportReference(error)

    expect(shown).not.toContain('ECONNREFUSED')
    expect(shown).not.toContain('postgres')
    expect(shown).not.toContain('service role key')
    expect(error.stack).toBeDefined()
    expect(shown).not.toBe(error.message)
  })

  it('shows nothing at all when the error carries no digest', () => {
    // A client-side throw has no digest; before this fix the boundary fell back
    // to the raw message here, which is exactly the leak being closed.
    expect(supportReference(thrown())).toBeNull()
  })
})

describe('when there is no reference worth printing', () => {
  it('treats a blank digest as absent so no empty "Reference:" line renders', () => {
    expect(supportReference(thrown(''))).toBeNull()
    expect(supportReference(thrown('   '))).toBeNull()
  })

  it('trims a padded digest rather than printing the padding', () => {
    expect(supportReference(thrown(' 2451889721 '))).toBe('2451889721')
  })

  it('ignores a non-string digest instead of rendering "[object Object]"', () => {
    expect(supportReference({ digest: 42 } as unknown as { digest?: string })).toBeNull()
  })

  it('survives a missing error object', () => {
    expect(supportReference(null)).toBeNull()
    expect(supportReference(undefined)).toBeNull()
  })
})

describe('the copy the customer reads', () => {
  it('is fixed text, not built from the error', () => {
    for (const copy of [ROOT_ERROR_TITLE, ROOT_ERROR_BODY]) {
      expect(copy.length).toBeGreaterThan(0)
      expect(copy).not.toContain('${')
      expect(copy).not.toMatch(/\{[a-z]/i)
    }
  })
})

/**
 * NOT covered by this file, and not claimed to be:
 *
 * - The rendered boundary itself. There is no jsdom/happy-dom/testing-library
 *   in this repo and no dependency may be added, so "the JSX references only
 *   supportReference(error) and never error.message/stack/cause", the retry
 *   button calling `reset`, and focus moving to the heading on mount are
 *   verified by typecheck, build, and manual browser testing rather than by
 *   vitest.
 * - The logging call, which is unchanged by this fix: full error detail still
 *   goes to `logger.error`, which is where it belongs.
 * - The rendered `app/global-error.tsx`, which now reuses the same helper and
 *   copy and so is covered by these tests for what it may show, but — like the
 *   root boundary above — not for its markup.
 */
