import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { planIdFromStripePriceId, stripePriceId } from './plans'

describe('planIdFromStripePriceId', () => {
  beforeEach(() => {
    delete process.env.STRIPE_BUILD_PRICE_ID
    delete process.env.STRIPE_GROW_PRICE_ID
    delete process.env.STRIPE_SCALE_PRICE_ID
  })
  afterEach(() => {
    delete process.env.STRIPE_BUILD_PRICE_ID
    delete process.env.STRIPE_GROW_PRICE_ID
    delete process.env.STRIPE_SCALE_PRICE_ID
  })

  it('returns null when env vars are not set', () => {
    expect(planIdFromStripePriceId('price_any')).toBeNull()
  })

  it('returns null for an unrecognized price ID even when env vars are set', () => {
    process.env.STRIPE_BUILD_PRICE_ID = 'price_build_123'
    process.env.STRIPE_GROW_PRICE_ID = 'price_grow_456'
    process.env.STRIPE_SCALE_PRICE_ID = 'price_scale_789'
    expect(planIdFromStripePriceId('price_unknown')).toBeNull()
  })

  it('returns "build" for the BUILD price ID', () => {
    process.env.STRIPE_BUILD_PRICE_ID = 'price_build_abc'
    expect(planIdFromStripePriceId('price_build_abc')).toBe('build')
  })

  it('returns "grow" for the GROW price ID', () => {
    process.env.STRIPE_GROW_PRICE_ID = 'price_grow_def'
    expect(planIdFromStripePriceId('price_grow_def')).toBe('grow')
  })

  it('returns "scale" for the SCALE price ID', () => {
    process.env.STRIPE_SCALE_PRICE_ID = 'price_scale_ghi'
    expect(planIdFromStripePriceId('price_scale_ghi')).toBe('scale')
  })

  it('is the exact inverse of stripePriceId when env vars are set', () => {
    process.env.STRIPE_BUILD_PRICE_ID = 'price_b'
    process.env.STRIPE_GROW_PRICE_ID = 'price_g'
    process.env.STRIPE_SCALE_PRICE_ID = 'price_s'
    for (const planId of ['build', 'grow', 'scale'] as const) {
      const priceId = stripePriceId(planId)!
      expect(planIdFromStripePriceId(priceId)).toBe(planId)
    }
  })
})
