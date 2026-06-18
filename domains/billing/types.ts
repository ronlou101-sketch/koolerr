import type { OrganizationId, TenantId } from '@/shared/types'

/**
 * Domain-specific types for the Billing domain.
 * See FOUNDATION_001_ARCHITECTURE.md §3 — Domain Boundaries.
 */

export type BillingStatus = 'active' | 'trialing' | 'past_due' | 'canceled'

export interface Subscription {
  id: string
  tenantId: TenantId
  organizationId: OrganizationId
  planId: string
  status: BillingStatus
  currentPeriodStart: Date
  currentPeriodEnd: Date
  createdAt: Date
  updatedAt: Date
}

export interface Entitlement {
  organizationId: OrganizationId
  feature: string
  limit: number
  used: number
  resetAt?: Date
}

export interface EntitlementCheck {
  organizationId: OrganizationId
  feature: string
  quantityRequested: number
}
