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
import type { IWorkforceEngineRepository } from './repository'

export class InMemoryWorkforceEngineRepository implements IWorkforceEngineRepository {
  private readonly workforces = new Map<WorkforceId, Workforce>()
  private readonly digitalEmployees = new Map<DigitalEmployeeId, DigitalEmployee>()
  private readonly engagementRuns = new Map<EngagementRunId, EngagementRun>()

  async saveWorkforce(workforce: Workforce, _tenantId: TenantId): Promise<Workforce> {
    this.workforces.set(workforce.id, workforce)
    return workforce
  }

  async findWorkforceById(id: WorkforceId): Promise<Workforce | null> {
    return this.workforces.get(id) ?? null
  }

  async listWorkforcesByOrganization(organizationId: OrganizationId): Promise<Workforce[]> {
    const results: Workforce[] = []
    for (const w of this.workforces.values()) {
      if (w.organizationId === organizationId) results.push(w)
    }
    return results
  }

  async saveDigitalEmployee(
    employee: DigitalEmployee,
    _tenantId: TenantId
  ): Promise<DigitalEmployee> {
    this.digitalEmployees.set(employee.id, employee)
    return employee
  }

  async findDigitalEmployeeById(id: DigitalEmployeeId): Promise<DigitalEmployee | null> {
    return this.digitalEmployees.get(id) ?? null
  }

  async listDigitalEmployeesByWorkforce(workforceId: WorkforceId): Promise<DigitalEmployee[]> {
    const results: DigitalEmployee[] = []
    for (const e of this.digitalEmployees.values()) {
      if (e.workforceId === workforceId) results.push(e)
    }
    return results
  }

  async saveEngagementRun(run: EngagementRun, _tenantId: TenantId): Promise<EngagementRun> {
    this.engagementRuns.set(run.id, run)
    return run
  }

  async findEngagementRunById(id: EngagementRunId): Promise<EngagementRun | null> {
    return this.engagementRuns.get(id) ?? null
  }
}
