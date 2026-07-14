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
  },
  build: {
    [ENTITLEMENT_FEATURES.engagementRun]: 250,
    [ENTITLEMENT_FEATURES.modelInvocation]: 500_000,
  },
  grow: {
    [ENTITLEMENT_FEATURES.engagementRun]: Infinity,
    [ENTITLEMENT_FEATURES.modelInvocation]: 5_000_000,
  },
  scale: {
    [ENTITLEMENT_FEATURES.engagementRun]: Infinity,
    [ENTITLEMENT_FEATURES.modelInvocation]: Infinity,
  },
}
