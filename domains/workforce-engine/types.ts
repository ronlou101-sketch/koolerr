import type {
  DigitalEmployeeId,
  DigitalEmployeeStatus,
  EngagementRunId,
  EngagementRunStatus,
  OrganizationId,
  TenantId,
  WorkforceId,
  WorkforceStatus,
} from '@/shared/types'

/**
 * Domain-specific types for the Workforce Engine domain.
 * See FOUNDATION_001_ARCHITECTURE.md §3 — Domain Boundaries.
 */

export interface EngagementRunTrigger {
  tenantId: TenantId
  workforceId: WorkforceId
  organizationId: OrganizationId
  objective: string
  participantIds?: DigitalEmployeeId[]
  context?: Record<string, unknown>
}

export interface EngagementRunStatusUpdate {
  tenantId: TenantId
  id: EngagementRunId
  status: EngagementRunStatus
  updatedAt: Date
}

export interface WorkforceRegistration {
  organizationId: OrganizationId
  name: string
  businessFunction: string
  digitalEmployees: DigitalEmployeeRegistration[]
}

export interface DigitalEmployeeRegistration {
  name: string
  role: string
  responsibilities: string[]
  permittedTools: string[]
}

// ---------------------------------------------------------------------------
// Workforce Management — Phase 2 Milestone 5
// ---------------------------------------------------------------------------

export interface UpdateWorkforceInput {
  tenantId: TenantId
  workforceId: WorkforceId
  organizationId: OrganizationId
  /** New business goals. Replaces the existing goals array entirely. */
  goals?: string[]
  status?: WorkforceStatus
}

export interface UpdateDigitalEmployeeInput {
  tenantId: TenantId
  digitalEmployeeId: DigitalEmployeeId
  organizationId: OrganizationId
  /** New responsibilities. Replaces the existing responsibilities array entirely. */
  responsibilities?: string[]
  status?: DigitalEmployeeStatus
}
