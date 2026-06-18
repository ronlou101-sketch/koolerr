import type { OrganizationId, TenantId, UsageEvent, UsageEventType } from '@/shared/types'
import type { Entitlement, Subscription } from './types'
import type { IBillingRepository } from './repository'

export class InMemoryBillingRepository implements IBillingRepository {
  private readonly subscriptions = new Map<TenantId, Subscription>()
  private readonly usageEvents = new Map<OrganizationId, UsageEvent[]>()
  /** `${organizationId}::${feature}` → Entitlement */
  private readonly entitlements = new Map<string, Entitlement>()

  async saveSubscription(subscription: Subscription): Promise<Subscription> {
    this.subscriptions.set(subscription.tenantId, subscription)
    return subscription
  }

  async findSubscriptionByTenantId(tenantId: TenantId): Promise<Subscription | null> {
    return this.subscriptions.get(tenantId) ?? null
  }

  async saveUsageEvent(event: UsageEvent): Promise<UsageEvent> {
    const existing = this.usageEvents.get(event.organizationId) ?? []
    existing.push(event)
    this.usageEvents.set(event.organizationId, existing)
    return event
  }

  async listUsageEvents(
    organizationId: OrganizationId,
    type?: UsageEventType
  ): Promise<UsageEvent[]> {
    const events = this.usageEvents.get(organizationId) ?? []
    return type ? events.filter((e) => e.type === type) : events
  }

  async saveEntitlement(entitlement: Entitlement): Promise<Entitlement> {
    this.entitlements.set(`${entitlement.organizationId}::${entitlement.feature}`, entitlement)
    return entitlement
  }

  async findEntitlement(
    organizationId: OrganizationId,
    feature: string
  ): Promise<Entitlement | null> {
    return this.entitlements.get(`${organizationId}::${feature}`) ?? null
  }

  async listEntitlements(organizationId: OrganizationId): Promise<Entitlement[]> {
    const results: Entitlement[] = []
    for (const [key, e] of this.entitlements) {
      if (key.startsWith(`${organizationId}::`)) results.push(e)
    }
    return results
  }
}
