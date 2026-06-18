import type { OrganizationId, TenantId, UsageEvent, UsageEventType } from '@/shared/types'
import type { Entitlement, Subscription } from './types'

/**
 * Billing Repository Interface
 *
 * Declares the storage contract for the Billing domain.
 *
 * Entitlements use a composite primary key of (organizationId, feature).
 * The limit field maps to a nullable bigint in the database — null represents
 * unlimited, which the service maps to/from Infinity. The repository
 * performs this translation.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.14 — Billing.
 * See docs/adr/ADR-004-repository-pattern.md.
 */

export interface IBillingRepository {
  // Subscriptions — one per Tenant
  saveSubscription(subscription: Subscription): Promise<Subscription>
  findSubscriptionByTenantId(tenantId: TenantId): Promise<Subscription | null>

  // Usage events — append-only
  saveUsageEvent(event: UsageEvent): Promise<UsageEvent>
  listUsageEvents(organizationId: OrganizationId, type?: UsageEventType): Promise<UsageEvent[]>

  // Entitlements — upsert semantics (organizationId, feature) is the key
  saveEntitlement(entitlement: Entitlement): Promise<Entitlement>
  findEntitlement(organizationId: OrganizationId, feature: string): Promise<Entitlement | null>
  listEntitlements(organizationId: OrganizationId): Promise<Entitlement[]>
}
