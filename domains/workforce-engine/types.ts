import type {
  DigitalEmployeeId,
  EngagementRunId,
  EngagementRunStatus,
  OrganizationId,
  WorkforceId,
} from '@/shared/types'

/**
 * Domain-specific types for the Workforce Engine domain.
 * See FOUNDATION_001_ARCHITECTURE.md §3 — Domain Boundaries.
 */

export interface EngagementRunTrigger {
  workforceId: WorkforceId
  organizationId: OrganizationId
  objective: string
  participantIds?: DigitalEmployeeId[]
  context?: Record<string, unknown>
}

export interface EngagementRunStatusUpdate {
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
