/**
 * Billing Plan Definitions
 *
 * Defines the plan IDs and default entitlements for each plan tier.
 * Phase 1 ships with a single free tier that is automatically assigned
 * to every new Organization during account provisioning.
 *
 * Entitlement limits are defined here so they are a single source of
 * truth — provisioning and the usage UI both reference these constants.
 *
 * See FOUNDATION_003_DEVELOPMENT_ROADMAP.md — Phase 1: Billing Foundation.
 */

export const PLAN_IDS = {
  free: 'free',
} as const

export type PlanId = (typeof PLAN_IDS)[keyof typeof PLAN_IDS]

export const PLAN_LABELS: Record<PlanId, string> = {
  free: 'Free',
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
  free: {
    [ENTITLEMENT_FEATURES.engagementRun]: 10,
    [ENTITLEMENT_FEATURES.modelInvocation]: 50_000,
  },
}
