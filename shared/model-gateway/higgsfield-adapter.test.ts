import { beforeEach, describe, expect, it } from 'vitest'

import { HiggsfieldAdapter } from './higgsfield-adapter'
import type { NormalizedModelRequest } from './types'

/**
 * HiggsfieldAdapter stub tests (P2-10).
 *
 * The adapter is a Phase 4 plug-in point — no live API calls are made.
 * Tests document the two error paths so the stub cannot be silently broken,
 * and serve as placeholders for the real implementation once the
 * Higgsfield API contract is published.
 */

const REQUEST: NormalizedModelRequest = {
  prompt: 'cinematic sunrise over a city skyline',
  model: 'higgsfield-v1',
}

describe('HiggsfieldAdapter', () => {
  beforeEach(() => {
    delete process.env.HIGGSFIELD_API_KEY
  })

  it('exposes provider identity as "higgsfield"', () => {
    expect(new HiggsfieldAdapter().provider).toBe('higgsfield')
  })

  it('throws when HIGGSFIELD_API_KEY is not set', async () => {
    const adapter = new HiggsfieldAdapter()
    await expect(adapter.invoke(REQUEST)).rejects.toThrow('HIGGSFIELD_API_KEY is not set')
  })

  it('throws not-yet-implemented when HIGGSFIELD_API_KEY is set', async () => {
    process.env.HIGGSFIELD_API_KEY = 'hf_test_key'
    const adapter = new HiggsfieldAdapter()
    await expect(adapter.invoke(REQUEST)).rejects.toThrow('not yet implemented')
  })
})
