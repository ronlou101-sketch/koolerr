import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  OrganizationId,
  TenantId,
  UsageEvent,
  UsageEventId,
  UsageEventType,
} from '@/shared/types'
import type { Entitlement, Subscription } from './types'
import type { IBillingRepository } from './repository'
import type { BillingStatus } from './types'

// ---------------------------------------------------------------------------
// Database row types — mirror the schema in migration 006
// ---------------------------------------------------------------------------

interface SubscriptionRow {
  id: string
  tenant_id: string
  organization_id: string
  plan_id: string
  status: string
  current_period_start: string
  current_period_end: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  stripe_price_id: string | null
  created_at: string
  updated_at: string
}

interface UsageEventRow {
  id: string
  organization_id: string
  type: string
  quantity: number
  metadata: Record<string, unknown>
  occurred_at: string
}

interface EntitlementRow {
  organization_id: string
  feature: string
  limit_amount: number | null
  used: number
  reset_at: string | null
}

// ---------------------------------------------------------------------------
// Row ↔ entity mappers
// ---------------------------------------------------------------------------

function mapSubscription(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    tenantId: row.tenant_id as TenantId,
    organizationId: row.organization_id as OrganizationId,
    planId: row.plan_id,
    status: row.status as BillingStatus,
    currentPeriodStart: new Date(row.current_period_start),
    currentPeriodEnd: new Date(row.current_period_end),
    stripeCustomerId: row.stripe_customer_id ?? undefined,
    stripeSubscriptionId: row.stripe_subscription_id ?? undefined,
    stripePriceId: row.stripe_price_id ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

function subscriptionToRow(sub: Subscription): SubscriptionRow {
  return {
    id: sub.id,
    tenant_id: sub.tenantId,
    organization_id: sub.organizationId,
    plan_id: sub.planId,
    status: sub.status,
    current_period_start: sub.currentPeriodStart.toISOString(),
    current_period_end: sub.currentPeriodEnd.toISOString(),
    stripe_customer_id: sub.stripeCustomerId ?? null,
    stripe_subscription_id: sub.stripeSubscriptionId ?? null,
    stripe_price_id: sub.stripePriceId ?? null,
    created_at: sub.createdAt.toISOString(),
    updated_at: sub.updatedAt.toISOString(),
  }
}

function mapUsageEvent(row: UsageEventRow): UsageEvent {
  return {
    id: row.id as UsageEventId,
    organizationId: row.organization_id as OrganizationId,
    type: row.type as UsageEventType,
    quantity: row.quantity,
    metadata: row.metadata,
    occurredAt: new Date(row.occurred_at),
  }
}

function usageEventToRow(event: UsageEvent): UsageEventRow {
  return {
    id: event.id,
    organization_id: event.organizationId,
    type: event.type,
    quantity: event.quantity,
    metadata: event.metadata,
    occurred_at: event.occurredAt.toISOString(),
  }
}

function mapEntitlement(row: EntitlementRow): Entitlement {
  return {
    organizationId: row.organization_id as OrganizationId,
    feature: row.feature,
    // null in DB → Infinity in TypeScript (unlimited)
    limit: row.limit_amount === null ? Infinity : row.limit_amount,
    used: row.used,
    resetAt: row.reset_at ? new Date(row.reset_at) : undefined,
  }
}

function entitlementToRow(entitlement: Entitlement): EntitlementRow {
  return {
    organization_id: entitlement.organizationId,
    feature: entitlement.feature,
    // Infinity → null in DB
    limit_amount: entitlement.limit === Infinity ? null : entitlement.limit,
    used: entitlement.used,
    reset_at: entitlement.resetAt?.toISOString() ?? null,
  }
}

// ---------------------------------------------------------------------------
// Repository implementation
// ---------------------------------------------------------------------------

export class SupabaseBillingRepository implements IBillingRepository {
  constructor(private readonly client: SupabaseClient) {}

  async saveSubscription(subscription: Subscription): Promise<Subscription> {
    const { data, error } = await this.client
      .from('subscriptions')
      .upsert(subscriptionToRow(subscription), { onConflict: 'id' })
      .select()
      .single()
    if (error || !data) throw new Error(`[BILLING_REPO] saveSubscription failed: ${error?.message}`)
    return mapSubscription(data as SubscriptionRow)
  }

  async findSubscriptionByTenantId(tenantId: TenantId): Promise<Subscription | null> {
    const { data, error } = await this.client
      .from('subscriptions')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle()
    if (error) throw new Error(`[BILLING_REPO] findSubscriptionByTenantId failed: ${error.message}`)
    return data ? mapSubscription(data as SubscriptionRow) : null
  }

  async saveUsageEvent(event: UsageEvent): Promise<UsageEvent> {
    const { data, error } = await this.client
      .from('usage_events')
      .insert(usageEventToRow(event))
      .select()
      .single()
    if (error || !data) throw new Error(`[BILLING_REPO] saveUsageEvent failed: ${error?.message}`)
    return mapUsageEvent(data as UsageEventRow)
  }

  async listUsageEvents(
    organizationId: OrganizationId,
    type?: UsageEventType
  ): Promise<UsageEvent[]> {
    let query = this.client.from('usage_events').select('*').eq('organization_id', organizationId)
    if (type) query = query.eq('type', type)
    const { data, error } = await query
    if (error) throw new Error(`[BILLING_REPO] listUsageEvents failed: ${error.message}`)
    return (data ?? []).map((r) => mapUsageEvent(r as UsageEventRow))
  }

  async saveEntitlement(entitlement: Entitlement): Promise<Entitlement> {
    const { data, error } = await this.client
      .from('entitlements')
      .upsert(entitlementToRow(entitlement), { onConflict: 'organization_id,feature' })
      .select()
      .single()
    if (error || !data) throw new Error(`[BILLING_REPO] saveEntitlement failed: ${error?.message}`)
    return mapEntitlement(data as EntitlementRow)
  }

  async findEntitlement(
    organizationId: OrganizationId,
    feature: string
  ): Promise<Entitlement | null> {
    const { data, error } = await this.client
      .from('entitlements')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('feature', feature)
      .maybeSingle()
    if (error) throw new Error(`[BILLING_REPO] findEntitlement failed: ${error.message}`)
    return data ? mapEntitlement(data as EntitlementRow) : null
  }

  async listEntitlements(organizationId: OrganizationId): Promise<Entitlement[]> {
    const { data, error } = await this.client
      .from('entitlements')
      .select('*')
      .eq('organization_id', organizationId)
    if (error) throw new Error(`[BILLING_REPO] listEntitlements failed: ${error.message}`)
    return (data ?? []).map((r) => mapEntitlement(r as EntitlementRow))
  }
}
