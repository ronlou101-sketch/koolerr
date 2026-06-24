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
  starter: 'starter',
  growth: 'growth',
} as const

export type PlanId = (typeof PLAN_IDS)[keyof typeof PLAN_IDS]

export const PLAN_LABELS: Record<PlanId, string> = {
  unpaid: 'Not subscribed',
  starter: 'Starter',
  growth: 'Growth',
}

/** Monthly price in cents. Display only — Stripe is authoritative for billing. */
export const PLAN_PRICES_CENTS: Record<PlanId, number> = {
  unpaid: 0,
  starter: 9900,
  growth: 49900,
}

/** Resolve the Stripe Price ID for a plan from environment variables. */
export function stripePriceId(planId: PlanId): string | undefined {
  if (planId === 'starter') return process.env.STRIPE_STARTER_PRICE_ID
  if (planId === 'growth') return process.env.STRIPE_GROWTH_PRICE_ID
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

/** Default entitlement limits for each plan tier. */
export const PLAN_ENTITLEMENTS: Record<PlanId, Record<string, number>> = {
  unpaid: {
    [ENTITLEMENT_FEATURES.engagementRun]: 10,
    [ENTITLEMENT_FEATURES.modelInvocation]: 50_000,
  },
  starter: {
    [ENTITLEMENT_FEATURES.engagementRun]: 250,
    [ENTITLEMENT_FEATURES.modelInvocation]: 500_000,
  },
  growth: {
    [ENTITLEMENT_FEATURES.engagementRun]: Infinity,
    [ENTITLEMENT_FEATURES.modelInvocation]: 5_000_000,
  },
}
