import { err, ok } from '@/shared/types'
import { PlatformErrorCode } from '@/shared/types'
import type {
  OrganizationId,
  PlatformResult,
  TenantId,
  UsageEvent,
  UsageEventId,
  UsageEventType,
} from '@/shared/types'
import { logger } from '@/shared/lib/logger'
import type { BillingStatus, Entitlement, EntitlementCheck, Subscription } from './types'

/**
 * Billing Domain Service Interface & Stub
 *
 * The Billing domain tracks platform usage, enforces subscription entitlements,
 * and manages payment relationships. It is a governance layer — it determines
 * what each Tenant is entitled to and whether usage has exceeded those limits.
 *
 * Key wiring defined in FOUNDATION_001_ARCHITECTURE.md §4:
 * - The Model Gateway emits usage events to billing (via recordUsageEvent)
 * - No other domain writes billing records directly
 * - Billing is scoped per Tenant, attributed per Organization and Workforce
 *
 * The stub manages state in memory with simplified entitlement enforcement.
 * The production implementation integrates with a payment provider (e.g.
 * Stripe), persists to Supabase, and enforces hard caps at the edge before
 * expensive operations proceed.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.14, §3 — Billing.
 */

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface CreateSubscriptionInput {
  tenantId: TenantId
  organizationId: OrganizationId
  planId: string
}

export interface RecordUsageInput {
  tenantId: TenantId
  organizationId: OrganizationId
  type: UsageEventType
  quantity: number
  metadata?: Record<string, unknown>
}

export interface SetEntitlementInput {
  organizationId: OrganizationId
  feature: string
  limit: number
  resetAt?: Date
}

// ---------------------------------------------------------------------------
// Billing service interface
// ---------------------------------------------------------------------------

export interface IBillingService {
  // Subscriptions
  createSubscription(input: CreateSubscriptionInput): Promise<PlatformResult<Subscription>>
  getSubscription(tenantId: TenantId): Promise<PlatformResult<Subscription>>
  updateSubscriptionStatus(
    tenantId: TenantId,
    status: BillingStatus
  ): Promise<PlatformResult<Subscription>>

  /**
   * Record a platform usage event.
   * Called by the Model Gateway after every AI invocation, and by the
   * workforce-engine after every Engagement Run completes.
   */
  recordUsageEvent(input: RecordUsageInput): Promise<PlatformResult<UsageEvent>>
  getUsageEvents(
    organizationId: OrganizationId,
    type?: UsageEventType
  ): Promise<PlatformResult<UsageEvent[]>>

  /**
   * Check whether an Organization has remaining entitlement for an operation.
   * Returns the current Entitlement state. Callers must enforce the limit themselves.
   * The billing domain records usage; it does not block operations directly.
   */
  checkEntitlement(check: EntitlementCheck): Promise<PlatformResult<Entitlement>>

  /** Set or update an entitlement limit for an Organization. */
  setEntitlement(input: SetEntitlementInput): Promise<PlatformResult<Entitlement>>

  /** Return all entitlements for an Organization. */
  getEntitlements(organizationId: OrganizationId): Promise<PlatformResult<Entitlement[]>>
}

// ---------------------------------------------------------------------------
// In-memory stub implementation
// ---------------------------------------------------------------------------

class BillingService implements IBillingService {
  /** tenantId → Subscription */
  private readonly subscriptions = new Map<TenantId, Subscription>()
  /** organizationId → UsageEvent[] */
  private readonly usageEvents = new Map<OrganizationId, UsageEvent[]>()
  /** `${organizationId}::${feature}` → Entitlement */
  private readonly entitlements = new Map<string, Entitlement>()

  async createSubscription(input: CreateSubscriptionInput): Promise<PlatformResult<Subscription>> {
    if (this.subscriptions.has(input.tenantId)) {
      return err({
        code: PlatformErrorCode.VALIDATION_ERROR,
        message: 'A subscription already exists for this tenant',
      })
    }

    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setMonth(periodEnd.getMonth() + 1)

    const subscription: Subscription = {
      id: `sub_${crypto.randomUUID()}`,
      tenantId: input.tenantId,
      organizationId: input.organizationId,
      planId: input.planId,
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      createdAt: now,
      updatedAt: now,
    }

    this.subscriptions.set(input.tenantId, subscription)
    logger.info('[BILLING] Subscription created', {
      tenantId: input.tenantId,
      organizationId: input.organizationId,
    })

    return ok(subscription)
  }

  async getSubscription(tenantId: TenantId): Promise<PlatformResult<Subscription>> {
    const subscription = this.subscriptions.get(tenantId)
    if (!subscription) {
      return err({ code: PlatformErrorCode.NOT_FOUND, message: 'Subscription not found' })
    }
    return ok(subscription)
  }

  async updateSubscriptionStatus(
    tenantId: TenantId,
    status: BillingStatus
  ): Promise<PlatformResult<Subscription>> {
    const result = await this.getSubscription(tenantId)
    if (!result.ok) return result
    const updated: Subscription = { ...result.value, status, updatedAt: new Date() }
    this.subscriptions.set(tenantId, updated)
    return ok(updated)
  }

  async recordUsageEvent(input: RecordUsageInput): Promise<PlatformResult<UsageEvent>> {
    const event: UsageEvent = {
      id: `usage_${crypto.randomUUID()}` as UsageEventId,
      organizationId: input.organizationId,
      type: input.type,
      quantity: input.quantity,
      metadata: input.metadata ?? {},
      occurredAt: new Date(),
    }

    const existing = this.usageEvents.get(input.organizationId) ?? []
    existing.push(event)
    this.usageEvents.set(input.organizationId, existing)

    // Increment the used counter on any matching entitlement.
    const entitlementKey = `${input.organizationId}::${input.type}`
    const entitlement = this.entitlements.get(entitlementKey)
    if (entitlement) {
      this.entitlements.set(entitlementKey, {
        ...entitlement,
        used: entitlement.used + input.quantity,
      })
    }

    return ok(event)
  }

  async getUsageEvents(
    organizationId: OrganizationId,
    type?: UsageEventType
  ): Promise<PlatformResult<UsageEvent[]>> {
    const events = this.usageEvents.get(organizationId) ?? []
    const filtered = type ? events.filter((e) => e.type === type) : events
    return ok(filtered)
  }

  async checkEntitlement(check: EntitlementCheck): Promise<PlatformResult<Entitlement>> {
    const key = `${check.organizationId}::${check.feature}`
    const entitlement = this.entitlements.get(key)

    if (!entitlement) {
      // No entitlement defined — return an unlimited placeholder so the caller
      // can decide whether that means permitted or not.
      return ok({
        organizationId: check.organizationId,
        feature: check.feature,
        limit: Infinity,
        used: 0,
      })
    }

    return ok(entitlement)
  }

  async setEntitlement(input: SetEntitlementInput): Promise<PlatformResult<Entitlement>> {
    const key = `${input.organizationId}::${input.feature}`
    const existing = this.entitlements.get(key)

    const entitlement: Entitlement = {
      organizationId: input.organizationId,
      feature: input.feature,
      limit: input.limit,
      used: existing?.used ?? 0,
      resetAt: input.resetAt,
    }

    this.entitlements.set(key, entitlement)
    logger.info('[BILLING] Entitlement set', { organizationId: input.organizationId })

    return ok(entitlement)
  }

  async getEntitlements(organizationId: OrganizationId): Promise<PlatformResult<Entitlement[]>> {
    const results: Entitlement[] = []
    for (const [key, entitlement] of this.entitlements) {
      if (key.startsWith(`${organizationId}::`)) results.push(entitlement)
    }
    return ok(results)
  }
}

export const billingService: IBillingService = new BillingService()
