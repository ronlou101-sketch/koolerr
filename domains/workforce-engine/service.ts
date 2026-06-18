import { err, ok } from '@/shared/types'
import { PlatformErrorCode } from '@/shared/types'
import type {
  DigitalEmployee,
  DigitalEmployeeId,
  EngagementRun,
  EngagementRunId,
  OrganizationId,
  PlatformResult,
  TenantId,
  Workforce,
  WorkforceId,
} from '@/shared/types'
import { logger } from '@/shared/lib/logger'
import type {
  DigitalEmployeeRegistration,
  EngagementRunStatusUpdate,
  EngagementRunTrigger,
  WorkforceRegistration,
} from './types'
import type { IWorkforceEngineRepository } from './repository'
import { InMemoryWorkforceEngineRepository } from './in-memory-repository'

/**
 * Workforce Engine Domain Service Interface & Stub
 *
 * The Workforce Engine owns Workforce and Digital Employee definitions,
 * Engagement Run execution, and Orchestration Engine integration. It is
 * the domain that knows how work gets done — not the domain that does the
 * work itself (Digital Employees, mediated by the Trust Engine and Model
 * Gateway, perform the actual work).
 *
 * Key invariants:
 * - Digital Employees belong to exactly one Workforce
 * - An Engagement Run always produces a Deliverable
 * - No Workforce or Digital Employee embeds provider-specific AI logic
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.6, §2.7, §2.8, §3.
 */

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface RegisterWorkforceInput extends WorkforceRegistration {
  tenantId: TenantId
}

export interface RegisterDigitalEmployeeInput extends DigitalEmployeeRegistration {
  tenantId: TenantId
  workforceId: WorkforceId
  organizationId: OrganizationId
}

// ---------------------------------------------------------------------------
// Workforce Engine service interface
// ---------------------------------------------------------------------------

export interface IWorkforceEngineService {
  // Workforces
  registerWorkforce(input: RegisterWorkforceInput): Promise<PlatformResult<Workforce>>
  getWorkforce(
    workforceId: WorkforceId,
    organizationId: OrganizationId
  ): Promise<PlatformResult<Workforce>>
  listWorkforces(organizationId: OrganizationId): Promise<PlatformResult<Workforce[]>>

  // Digital Employees
  registerDigitalEmployee(
    input: RegisterDigitalEmployeeInput
  ): Promise<PlatformResult<DigitalEmployee>>
  getDigitalEmployee(
    digitalEmployeeId: DigitalEmployeeId,
    organizationId: OrganizationId
  ): Promise<PlatformResult<DigitalEmployee>>
  listDigitalEmployees(
    workforceId: WorkforceId,
    organizationId: OrganizationId
  ): Promise<PlatformResult<DigitalEmployee[]>>

  // Engagement Runs
  triggerEngagementRun(trigger: EngagementRunTrigger): Promise<PlatformResult<EngagementRun>>
  getEngagementRun(
    engagementRunId: EngagementRunId,
    organizationId: OrganizationId
  ): Promise<PlatformResult<EngagementRun>>
  updateEngagementRunStatus(
    update: EngagementRunStatusUpdate
  ): Promise<PlatformResult<EngagementRun>>
}

// ---------------------------------------------------------------------------
// Service implementation
// ---------------------------------------------------------------------------

class WorkforceEngineService implements IWorkforceEngineService {
  constructor(private readonly repo: IWorkforceEngineRepository) {}

  async registerWorkforce(input: RegisterWorkforceInput): Promise<PlatformResult<Workforce>> {
    try {
      const workforce: Workforce = {
        id: `workforce_${crypto.randomUUID()}` as WorkforceId,
        organizationId: input.organizationId,
        name: input.name,
        businessFunction: input.businessFunction,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await this.repo.saveWorkforce(workforce, input.tenantId)
      logger.info('[WORKFORCE_ENGINE] Workforce registered', {
        tenantId: input.tenantId,
        organizationId: input.organizationId,
      })

      for (const employeeDef of input.digitalEmployees) {
        await this.registerDigitalEmployee({
          ...employeeDef,
          tenantId: input.tenantId,
          workforceId: workforce.id,
          organizationId: input.organizationId,
        })
      }

      return ok(workforce)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async getWorkforce(
    workforceId: WorkforceId,
    organizationId: OrganizationId
  ): Promise<PlatformResult<Workforce>> {
    try {
      const workforce = await this.repo.findWorkforceById(workforceId)
      if (!workforce)
        return err({ code: PlatformErrorCode.NOT_FOUND, message: 'Workforce not found' })
      if (workforce.organizationId !== organizationId) {
        return err({
          code: PlatformErrorCode.TENANT_ISOLATION_VIOLATION,
          message: 'Workforce does not belong to this organization',
        })
      }
      return ok(workforce)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async listWorkforces(organizationId: OrganizationId): Promise<PlatformResult<Workforce[]>> {
    try {
      const workforces = await this.repo.listWorkforcesByOrganization(organizationId)
      return ok(workforces)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async registerDigitalEmployee(
    input: RegisterDigitalEmployeeInput
  ): Promise<PlatformResult<DigitalEmployee>> {
    try {
      const workforceResult = await this.getWorkforce(input.workforceId, input.organizationId)
      if (!workforceResult.ok) return workforceResult

      const employee: DigitalEmployee = {
        id: `employee_${crypto.randomUUID()}` as DigitalEmployeeId,
        workforceId: input.workforceId,
        organizationId: input.organizationId,
        name: input.name,
        role: input.role,
        responsibilities: input.responsibilities,
        permittedTools: input.permittedTools,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await this.repo.saveDigitalEmployee(employee, input.tenantId)
      logger.info('[WORKFORCE_ENGINE] Digital Employee registered', {
        tenantId: input.tenantId,
        organizationId: input.organizationId,
      })
      return ok(employee)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async getDigitalEmployee(
    digitalEmployeeId: DigitalEmployeeId,
    organizationId: OrganizationId
  ): Promise<PlatformResult<DigitalEmployee>> {
    try {
      const employee = await this.repo.findDigitalEmployeeById(digitalEmployeeId)
      if (!employee) {
        return err({ code: PlatformErrorCode.NOT_FOUND, message: 'Digital Employee not found' })
      }
      if (employee.organizationId !== organizationId) {
        return err({
          code: PlatformErrorCode.TENANT_ISOLATION_VIOLATION,
          message: 'Digital Employee does not belong to this organization',
        })
      }
      return ok(employee)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async listDigitalEmployees(
    workforceId: WorkforceId,
    organizationId: OrganizationId
  ): Promise<PlatformResult<DigitalEmployee[]>> {
    try {
      const workforceResult = await this.getWorkforce(workforceId, organizationId)
      if (!workforceResult.ok) return workforceResult

      const employees = await this.repo.listDigitalEmployeesByWorkforce(workforceId)
      return ok(employees)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async triggerEngagementRun(
    trigger: EngagementRunTrigger
  ): Promise<PlatformResult<EngagementRun>> {
    try {
      const workforceResult = await this.getWorkforce(trigger.workforceId, trigger.organizationId)
      if (!workforceResult.ok) return workforceResult

      const run: EngagementRun = {
        id: `run_${crypto.randomUUID()}` as EngagementRunId,
        organizationId: trigger.organizationId,
        workforceId: trigger.workforceId,
        objective: trigger.objective,
        status: 'pending',
        participantIds: trigger.participantIds ?? [],
        deliverableIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await this.repo.saveEngagementRun(run, trigger.tenantId)
      logger.info('[WORKFORCE_ENGINE] Engagement Run triggered', {
        organizationId: trigger.organizationId,
      })
      return ok(run)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async getEngagementRun(
    engagementRunId: EngagementRunId,
    organizationId: OrganizationId
  ): Promise<PlatformResult<EngagementRun>> {
    try {
      const run = await this.repo.findEngagementRunById(engagementRunId)
      if (!run)
        return err({ code: PlatformErrorCode.NOT_FOUND, message: 'Engagement Run not found' })
      if (run.organizationId !== organizationId) {
        return err({
          code: PlatformErrorCode.TENANT_ISOLATION_VIOLATION,
          message: 'Engagement Run does not belong to this organization',
        })
      }
      return ok(run)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async updateEngagementRunStatus(
    update: EngagementRunStatusUpdate
  ): Promise<PlatformResult<EngagementRun>> {
    try {
      const run = await this.repo.findEngagementRunById(update.id)
      if (!run)
        return err({ code: PlatformErrorCode.NOT_FOUND, message: 'Engagement Run not found' })

      const updated: EngagementRun = {
        ...run,
        status: update.status,
        updatedAt: update.updatedAt,
        ...(update.status === 'completed' || update.status === 'failed'
          ? { completedAt: update.updatedAt }
          : {}),
        ...(update.status === 'running' ? { startedAt: update.updatedAt } : {}),
      }

      await this.repo.saveEngagementRun(updated, update.tenantId)
      return ok(updated)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton — defaults to in-memory; bootstrap swaps in Supabase repo
// ---------------------------------------------------------------------------

export let workforceEngineService: IWorkforceEngineService = new WorkforceEngineService(
  new InMemoryWorkforceEngineRepository()
)

export function _configureWorkforceEngineRepository(repo: IWorkforceEngineRepository): void {
  workforceEngineService = new WorkforceEngineService(repo)
}
