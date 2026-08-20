import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  ENTITLEMENT_FEATURES,
  PLAN_ENTITLEMENTS,
  PLAN_PRICES_CENTS,
  billableSeconds,
  planIdFromStripePriceId,
  stripePriceId,
  videoMinutesForDuration,
} from './plans'

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

describe('PLAN_ENTITLEMENTS — video count + second allowances', () => {
  const video = ENTITLEMENT_FEATURES.spokespersonVideo
  const seconds = ENTITLEMENT_FEATURES.spokespersonVideoSeconds

  it('preserves the per-video COUNT allowance (5 / 30 / 100)', () => {
    expect(PLAN_ENTITLEMENTS.build[video]).toBe(5)
    expect(PLAN_ENTITLEMENTS.grow[video]).toBe(30)
    expect(PLAN_ENTITLEMENTS.scale[video]).toBe(100)
    expect(PLAN_ENTITLEMENTS.unpaid[video]).toBe(0)
  })

  it('stores the video-time allowance in SECONDS (600 / 3600 / 12000 = 10 / 60 / 200 min)', () => {
    expect(PLAN_ENTITLEMENTS.build[seconds]).toBe(600)
    expect(PLAN_ENTITLEMENTS.grow[seconds]).toBe(3600)
    expect(PLAN_ENTITLEMENTS.scale[seconds]).toBe(12000)
    expect(PLAN_ENTITLEMENTS.unpaid[seconds]).toBe(0)
    // …which are exactly the customer-facing 10 / 60 / 200 minutes
    expect(videoMinutesForDuration(PLAN_ENTITLEMENTS.build[seconds])).toBe(10)
    expect(videoMinutesForDuration(PLAN_ENTITLEMENTS.grow[seconds])).toBe(60)
    expect(videoMinutesForDuration(PLAN_ENTITLEMENTS.scale[seconds])).toBe(200)
  })

  it('keeps count and seconds as two distinct entitlement features', () => {
    expect(video).toBe('spokesperson_video')
    expect(seconds).toBe('spokesperson_video_seconds')
    expect(video).not.toBe(seconds)
  })

  it('does not reduce existing engagement-run entitlements', () => {
    expect(PLAN_ENTITLEMENTS.build[ENTITLEMENT_FEATURES.engagementRun]).toBe(250)
    expect(PLAN_ENTITLEMENTS.grow[ENTITLEMENT_FEATURES.engagementRun]).toBe(Infinity)
    expect(PLAN_ENTITLEMENTS.scale[ENTITLEMENT_FEATURES.engagementRun]).toBe(Infinity)
  })
})

describe('PLAN_PRICES_CENTS — prices unchanged', () => {
  it('keeps $99 / $499 / $1,499', () => {
    expect(PLAN_PRICES_CENTS.build).toBe(9900)
    expect(PLAN_PRICES_CENTS.grow).toBe(49900)
    expect(PLAN_PRICES_CENTS.scale).toBe(149900)
  })
})

describe('videoMinutesForDuration — fractional display minutes', () => {
  it('represents 30 seconds as 0.5 minutes', () => {
    expect(videoMinutesForDuration(30)).toBe(0.5)
  })
  it('represents 90 seconds as 1.5 minutes', () => {
    expect(videoMinutesForDuration(90)).toBe(1.5)
  })
  it('represents whole minutes exactly', () => {
    expect(videoMinutesForDuration(60)).toBe(1)
    expect(videoMinutesForDuration(0)).toBe(0)
  })
})

describe('billableSeconds — ceil to whole seconds (never undercharge)', () => {
  it("ceils HeyGen's fractional duration (3.29143 → 4)", () => {
    expect(billableSeconds(3.29143)).toBe(4)
  })
  it('leaves whole seconds unchanged (30 → 30, 60 → 60)', () => {
    expect(billableSeconds(30)).toBe(30)
    expect(billableSeconds(60)).toBe(60)
  })
  it('ceils any positive fraction up to at least 1 (0.1 → 1)', () => {
    expect(billableSeconds(0.1)).toBe(1)
  })
  it('clamps non-positive to 0', () => {
    expect(billableSeconds(0)).toBe(0)
    expect(billableSeconds(-5)).toBe(0)
  })
})
