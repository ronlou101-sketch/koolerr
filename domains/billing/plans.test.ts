import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  ENTITLEMENT_FEATURES,
  PLAN_ENTITLEMENTS,
  PLAN_PRICES_CENTS,
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

describe('PLAN_ENTITLEMENTS — video count + minute allowances', () => {
  const video = ENTITLEMENT_FEATURES.spokespersonVideo
  const minutes = ENTITLEMENT_FEATURES.spokespersonVideoMinutes

  it('preserves the per-video COUNT allowance (5 / 30 / 100)', () => {
    expect(PLAN_ENTITLEMENTS.build[video]).toBe(5)
    expect(PLAN_ENTITLEMENTS.grow[video]).toBe(30)
    expect(PLAN_ENTITLEMENTS.scale[video]).toBe(100)
    expect(PLAN_ENTITLEMENTS.unpaid[video]).toBe(0)
  })

  it('adds the video-MINUTE allowance as a second entitlement (10 / 60 / 200)', () => {
    expect(PLAN_ENTITLEMENTS.build[minutes]).toBe(10)
    expect(PLAN_ENTITLEMENTS.grow[minutes]).toBe(60)
    expect(PLAN_ENTITLEMENTS.scale[minutes]).toBe(200)
    expect(PLAN_ENTITLEMENTS.unpaid[minutes]).toBe(0)
  })

  it('keeps count and minutes as two distinct entitlement features', () => {
    expect(video).toBe('spokesperson_video')
    expect(minutes).toBe('spokesperson_video_minutes')
    expect(video).not.toBe(minutes)
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

describe('videoMinutesForDuration — fractional minutes', () => {
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
