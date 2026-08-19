/**
 * Billing Plan Definitions
 *
 * Defines the plan IDs and default entitlements for each plan tier.
 * Phase 1 ships with an 'unpaid' tier that is automatically assigned
 * to every new Organization during account provisioning.
 *
 * Entitlement limits are defined here so they are a single source of
 * truth — provisioning and the usage UI both reference these constants.
 *
 * See FOUNDATION_003_DEVELOPMENT_ROADMAP.md — Phase 1: Billing Foundation.
 */

export const PLAN_IDS = {
  unpaid: 'unpaid',
  build: 'build',
  grow: 'grow',
  scale: 'scale',
} as const

export type PlanId = (typeof PLAN_IDS)[keyof typeof PLAN_IDS]

export const PLAN_LABELS: Record<PlanId, string> = {
  unpaid: 'Not subscribed',
  build: 'BUILD',
  grow: 'GROW',
  scale: 'SCALE',
}

/** Monthly price in cents. Display only — Stripe is authoritative for billing. */
export const PLAN_PRICES_CENTS: Record<PlanId, number> = {
  unpaid: 0,
  build: 9900,
  grow: 49900,
  scale: 149900,
}

/** Resolve the Stripe Price ID for a plan from environment variables. */
export function stripePriceId(planId: PlanId): string | undefined {
  if (planId === 'build') return process.env.STRIPE_BUILD_PRICE_ID
  if (planId === 'grow') return process.env.STRIPE_GROW_PRICE_ID
  if (planId === 'scale') return process.env.STRIPE_SCALE_PRICE_ID
  return undefined
}

/**
 * Entitlement feature keys.
 * Must match the `type` values in UsageEventType where usage is tracked
 * so recordUsageEvent() correctly increments the right entitlement counter.
 */
export const ENTITLEMENT_FEATURES = {
  /** Number of Engagement Runs per billing period. */
  engagementRun: 'engagement_run',
  /** Model tokens consumed per billing period (sum of input + output tokens). */
  modelInvocation: 'model_invocation',
  /**
   * Brand Ambassador spokesperson videos rendered per billing period.
   * This IS the package-level budget control for real video rendering — there is
   * no separate render budget. Enforced via checkEntitlement() before each render.
   */
  spokespersonVideo: 'spokesperson_video',
  /**
   * Included spokesperson-video PRODUCTION MINUTES per billing period. A rendered
   * video consumes 1 unit of `spokespersonVideo` (the count allowance) AND its
   * actual duration from this minute allowance. This entitlement defines the
   * ALLOWANCE only; duration-based deduction is a later, separate step. The
   * allowance values (10/60/200) are whole minutes and fit the existing bigint
   * `entitlements.limit_amount` schema — no migration required here.
   */
  spokespersonVideoMinutes: 'spokesperson_video_minutes',
} as const

/**
 * Reverse-lookup: map a Stripe Price ID back to our internal PlanId.
 * Used by the webhook handler to keep planId in sync when Stripe fires
 * customer.subscription.updated (e.g. after an upgrade or downgrade).
 * Returns null when the price ID is unknown or the env var is not set.
 */
export function planIdFromStripePriceId(priceId: string): PlanId | null {
  if (process.env.STRIPE_BUILD_PRICE_ID && priceId === process.env.STRIPE_BUILD_PRICE_ID)
    return 'build'
  if (process.env.STRIPE_GROW_PRICE_ID && priceId === process.env.STRIPE_GROW_PRICE_ID)
    return 'grow'
  if (process.env.STRIPE_SCALE_PRICE_ID && priceId === process.env.STRIPE_SCALE_PRICE_ID)
    return 'scale'
  return null
}

/** Default entitlement limits for each plan tier. */
export const PLAN_ENTITLEMENTS: Record<PlanId, Record<string, number>> = {
  unpaid: {
    [ENTITLEMENT_FEATURES.engagementRun]: 10,
    [ENTITLEMENT_FEATURES.modelInvocation]: 50_000,
    [ENTITLEMENT_FEATURES.spokespersonVideo]: 0,
    [ENTITLEMENT_FEATURES.spokespersonVideoMinutes]: 0,
  },
  build: {
    [ENTITLEMENT_FEATURES.engagementRun]: 250,
    [ENTITLEMENT_FEATURES.modelInvocation]: 500_000,
    [ENTITLEMENT_FEATURES.spokespersonVideo]: 5,
    [ENTITLEMENT_FEATURES.spokespersonVideoMinutes]: 10,
  },
  grow: {
    [ENTITLEMENT_FEATURES.engagementRun]: Infinity,
    [ENTITLEMENT_FEATURES.modelInvocation]: 5_000_000,
    [ENTITLEMENT_FEATURES.spokespersonVideo]: 30,
    [ENTITLEMENT_FEATURES.spokespersonVideoMinutes]: 60,
  },
  scale: {
    [ENTITLEMENT_FEATURES.engagementRun]: Infinity,
    [ENTITLEMENT_FEATURES.modelInvocation]: Infinity,
    [ENTITLEMENT_FEATURES.spokespersonVideo]: 100,
    [ENTITLEMENT_FEATURES.spokespersonVideoMinutes]: 200,
  },
}

/**
 * Spokesperson-video production minutes consumed by a rendered video of the given
 * duration. Fractional by design (30s → 0.5 min, 90s → 1.5 min); the per-video
 * count allowance is tracked separately via `spokespersonVideo`.
 *
 * Pure calculation only — this performs NO entitlement deduction or usage
 * recording. Duration-based consumption against the allowance is a later step.
 */
export function videoMinutesForDuration(durationSeconds: number): number {
  return durationSeconds / 60
}
