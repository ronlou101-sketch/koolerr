import type {
  DigitalEmployee,
  DigitalEmployeeId,
  EngagementRun,
  EngagementRunId,
  OrganizationId,
  TenantId,
  Workforce,
  WorkforceId,
} from '@/shared/types'

/**
 * Workforce Engine Repository Interface
 *
 * Declares the storage contract for the Workforce Engine domain.
 *
 * tenantId is required on all write operations for the same reason described
 * in the Business Brain repository: entity types do not carry it, but the
 * database row must for RLS. Services receive tenantId through their inputs
 * or PlatformContext and pass it through to the repository.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.6, §2.7, §2.8 — Workforce Engine.
 * See docs/adr/ADR-004-repository-pattern.md.
 */

export interface IWorkforceEngineRepository {
  // Workforces
  saveWorkforce(workforce: Workforce, tenantId: TenantId): Promise<Workforce>
  findWorkforceById(id: WorkforceId): Promise<Workforce | null>
  listWorkforcesByOrganization(organizationId: OrganizationId): Promise<Workforce[]>

  // Digital Employees
  saveDigitalEmployee(employee: DigitalEmployee, tenantId: TenantId): Promise<DigitalEmployee>
  findDigitalEmployeeById(id: DigitalEmployeeId): Promise<DigitalEmployee | null>
  listDigitalEmployeesByWorkforce(workforceId: WorkforceId): Promise<DigitalEmployee[]>

  // Engagement Runs
  saveEngagementRun(run: EngagementRun, tenantId: TenantId): Promise<EngagementRun>
  findEngagementRunById(id: EngagementRunId): Promise<EngagementRun | null>
  listEngagementRunsByOrganization(organizationId: OrganizationId): Promise<EngagementRun[]>
}
