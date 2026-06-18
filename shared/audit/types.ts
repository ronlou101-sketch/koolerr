import type { DigitalEmployeeId, OrganizationId, TenantId, UserId } from '@/shared/types'

/**
 * Audit Infrastructure Types
 *
 * The audit log is the platform's immutable record of every consequential
 * action. It is append-only. Records are never modified or deleted.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §8.5 — Auditability.
 * See FOUNDATION_002_ENGINEERING_PRINCIPLES.md §6.5 — Audit Logging.
 */

// ---------------------------------------------------------------------------
// Actor
// Discriminated union — encodes both who acted and what kind of actor they are.
// ---------------------------------------------------------------------------

export type AuditActor =
  | { readonly type: 'user'; readonly id: UserId }
  | { readonly type: 'digital_employee'; readonly id: DigitalEmployeeId }
  | { readonly type: 'system'; readonly id: 'system' }

// ---------------------------------------------------------------------------
// Actions
// Every consequential platform action has an explicit audit action name.
// Adding a new capability requires adding an action here first.
// ---------------------------------------------------------------------------

export type AuditAction =
  // Identity
  | 'user.authenticated'
  | 'user.signed_out'
  | 'user.permission_granted'
  | 'user.permission_revoked'
  | 'api_key.created'
  | 'api_key.revoked'
  // Consent & Rights
  | 'consent.granted'
  | 'consent.revoked'
  // Business Brain
  | 'business_brain.memory_added'
  | 'business_brain.memory_updated'
  | 'business_brain.queried'
  // Workforce
  | 'workforce.registered'
  | 'workforce.deactivated'
  | 'digital_employee.registered'
  | 'digital_employee.activated'
  | 'digital_employee.deactivated'
  // Engagement Runs
  | 'engagement_run.started'
  | 'engagement_run.completed'
  | 'engagement_run.failed'
  | 'engagement_run.approval_requested'
  | 'engagement_run.approved'
  | 'engagement_run.rejected'
  // Deliverables
  | 'deliverable.created'
  | 'deliverable.approved'
  | 'deliverable.rejected'
  | 'deliverable.published'
  // Model Gateway
  | 'model_gateway.invocation_requested'
  | 'model_gateway.invocation_completed'
  | 'model_gateway.invocation_rejected'
  // Trust Engine
  | 'trust_engine.action_permitted'
  | 'trust_engine.action_denied'
  | 'trust_engine.autonomy_level_changed'
  | 'trust_engine.evaluation_approved'
  | 'trust_engine.evaluation_rejected'
  | 'trust_engine.autonomy_earned'
  // Billing
  | 'billing.subscription_created'
  | 'billing.subscription_updated'
  | 'billing.entitlement_exceeded'

export type AuditOutcome = 'success' | 'failure' | 'denied'

export type AuditResourceType =
  | 'tenant'
  | 'organization'
  | 'user'
  | 'business_brain'
  | 'business_memory'
  | 'workforce'
  | 'digital_employee'
  | 'engagement_run'
  | 'deliverable'
  | 'consent'
  | 'model_invocation'
  | 'subscription'

// ---------------------------------------------------------------------------
// Event
// ---------------------------------------------------------------------------

export interface AuditEvent {
  readonly id: string
  readonly tenantId: TenantId
  readonly organizationId: OrganizationId
  readonly actor: AuditActor
  readonly action: AuditAction
  readonly resourceType: AuditResourceType
  readonly resourceId: string
  readonly outcome: AuditOutcome
  readonly metadata?: Record<string, unknown>
  readonly occurredAt: Date
}

/** Input type — id and occurredAt are assigned by the logger, not the caller. */
export type AuditEventInput = Omit<AuditEvent, 'id' | 'occurredAt'>

// ---------------------------------------------------------------------------
// Logger interface
// ---------------------------------------------------------------------------

export interface AuditFilter {
  tenantId: TenantId
  organizationId?: OrganizationId
  action?: AuditAction
  resourceType?: AuditResourceType
  resourceId?: string
  outcome?: AuditOutcome
  from?: Date
  to?: Date
  limit?: number
}

export interface IAuditLogger {
  log(event: AuditEventInput): Promise<void>
  query(filter: AuditFilter): Promise<AuditEvent[]>
}
