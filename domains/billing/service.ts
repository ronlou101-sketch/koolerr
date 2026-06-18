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
import type { IBillingRepository } from './repository'
import { InMemoryBillingRepository } from './in-memory-repository'

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
 * - Billing is scoped per Tenant, attributed per Organization
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
   */
  checkEntitlement(check: EntitlementCheck): Promise<PlatformResult<Entitlement>>

  /** Set or update an entitlement limit for an Organization. */
  setEntitlement(input: SetEntitlementInput): Promise<PlatformResult<Entitlement>>

  /** Return all entitlements for an Organization. */
  getEntitlements(organizationId: OrganizationId): Promise<PlatformResult<Entitlement[]>>
}

// ---------------------------------------------------------------------------
// Service implementation
// ---------------------------------------------------------------------------

export class BillingService implements IBillingService {
  constructor(private readonly repo: IBillingRepository) {}

  async createSubscription(input: CreateSubscriptionInput): Promise<PlatformResult<Subscription>> {
    try {
      const existing = await this.repo.findSubscriptionByTenantId(input.tenantId)
      if (existing) {
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

      await this.repo.saveSubscription(subscription)
      logger.info('[BILLING] Subscription created', {
        tenantId: input.tenantId,
        organizationId: input.organizationId,
      })
      return ok(subscription)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async getSubscription(tenantId: TenantId): Promise<PlatformResult<Subscription>> {
    try {
      const subscription = await this.repo.findSubscriptionByTenantId(tenantId)
      if (!subscription) {
        return err({ code: PlatformErrorCode.NOT_FOUND, message: 'Subscription not found' })
      }
      return ok(subscription)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async updateSubscriptionStatus(
    tenantId: TenantId,
    status: BillingStatus
  ): Promise<PlatformResult<Subscription>> {
    try {
      const result = await this.getSubscription(tenantId)
      if (!result.ok) return result
      const updated: Subscription = { ...result.value, status, updatedAt: new Date() }
      await this.repo.saveSubscription(updated)
      return ok(updated)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async recordUsageEvent(input: RecordUsageInput): Promise<PlatformResult<UsageEvent>> {
    try {
      const event: UsageEvent = {
        id: `usage_${crypto.randomUUID()}` as UsageEventId,
        organizationId: input.organizationId,
        type: input.type,
        quantity: input.quantity,
        metadata: input.metadata ?? {},
        occurredAt: new Date(),
      }

      await this.repo.saveUsageEvent(event)

      // Increment used counter on any matching entitlement.
      const entitlement = await this.repo.findEntitlement(input.organizationId, input.type)
      if (entitlement) {
        await this.repo.saveEntitlement({ ...entitlement, used: entitlement.used + input.quantity })
      }

      return ok(event)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async getUsageEvents(
    organizationId: OrganizationId,
    type?: UsageEventType
  ): Promise<PlatformResult<UsageEvent[]>> {
    try {
      const events = await this.repo.listUsageEvents(organizationId, type)
      return ok(events)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async checkEntitlement(check: EntitlementCheck): Promise<PlatformResult<Entitlement>> {
    try {
      const entitlement = await this.repo.findEntitlement(check.organizationId, check.feature)
      if (!entitlement) {
        return ok({
          organizationId: check.organizationId,
          feature: check.feature,
          limit: Infinity,
          used: 0,
        })
      }
      return ok(entitlement)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async setEntitlement(input: SetEntitlementInput): Promise<PlatformResult<Entitlement>> {
    try {
      const existing = await this.repo.findEntitlement(input.organizationId, input.feature)
      const entitlement: Entitlement = {
        organizationId: input.organizationId,
        feature: input.feature,
        limit: input.limit,
        used: existing?.used ?? 0,
        resetAt: input.resetAt,
      }
      await this.repo.saveEntitlement(entitlement)
      logger.info('[BILLING] Entitlement set', { organizationId: input.organizationId })
      return ok(entitlement)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async getEntitlements(organizationId: OrganizationId): Promise<PlatformResult<Entitlement[]>> {
    try {
      const entitlements = await this.repo.listEntitlements(organizationId)
      return ok(entitlements)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton — defaults to in-memory; bootstrap swaps in Supabase repo
// ---------------------------------------------------------------------------

export let billingService: IBillingService = new BillingService(new InMemoryBillingRepository())

export function _configureBillingRepository(repo: IBillingRepository): void {
  billingService = new BillingService(repo)
}
