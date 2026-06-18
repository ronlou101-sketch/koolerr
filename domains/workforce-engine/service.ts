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
 * - An Engagement Run always produces a Deliverable (handed to the
 *   deliverables domain through its service interface)
 * - No Workforce or Digital Employee definition embeds provider-specific
 *   AI logic — all invocations route through the Model Gateway
 *
 * The stub manages state in memory. The production implementation will
 * persist to Supabase and integrate with the Orchestration Engine to
 * advance Engagement Run state as steps complete.
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
// In-memory stub implementation
// ---------------------------------------------------------------------------

class WorkforceEngineService implements IWorkforceEngineService {
  private readonly workforces = new Map<WorkforceId, Workforce>()
  private readonly digitalEmployees = new Map<DigitalEmployeeId, DigitalEmployee>()
  private readonly engagementRuns = new Map<EngagementRunId, EngagementRun>()
  /** organizationId → Set<WorkforceId> */
  private readonly workforceIndex = new Map<OrganizationId, Set<WorkforceId>>()
  /** workforceId → Set<DigitalEmployeeId> */
  private readonly employeeIndex = new Map<WorkforceId, Set<DigitalEmployeeId>>()
  /** organizationId → Set<EngagementRunId> */
  private readonly runIndex = new Map<OrganizationId, Set<EngagementRunId>>()

  async registerWorkforce(input: RegisterWorkforceInput): Promise<PlatformResult<Workforce>> {
    const workforce: Workforce = {
      id: `workforce_${crypto.randomUUID()}` as WorkforceId,
      organizationId: input.organizationId,
      name: input.name,
      businessFunction: input.businessFunction,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.workforces.set(workforce.id, workforce)
    this.indexWorkforce(input.organizationId, workforce.id)
    this.employeeIndex.set(workforce.id, new Set())

    logger.info('[WORKFORCE_ENGINE] Workforce registered', {
      tenantId: input.tenantId,
      organizationId: input.organizationId,
    })

    // Register Digital Employees declared in the WorkforceRegistration
    for (const employeeDef of input.digitalEmployees) {
      await this.registerDigitalEmployee({
        ...employeeDef,
        tenantId: input.tenantId,
        workforceId: workforce.id,
        organizationId: input.organizationId,
      })
    }

    return ok(workforce)
  }

  async getWorkforce(
    workforceId: WorkforceId,
    organizationId: OrganizationId
  ): Promise<PlatformResult<Workforce>> {
    const workforce = this.workforces.get(workforceId)
    if (!workforce)
      return err({ code: PlatformErrorCode.NOT_FOUND, message: 'Workforce not found' })
    if (workforce.organizationId !== organizationId) {
      return err({
        code: PlatformErrorCode.TENANT_ISOLATION_VIOLATION,
        message: 'Workforce does not belong to this organization',
      })
    }
    return ok(workforce)
  }

  async listWorkforces(organizationId: OrganizationId): Promise<PlatformResult<Workforce[]>> {
    const ids = this.workforceIndex.get(organizationId) ?? new Set()
    const results: Workforce[] = []
    for (const id of ids) {
      const w = this.workforces.get(id)
      if (w) results.push(w)
    }
    return ok(results)
  }

  async registerDigitalEmployee(
    input: RegisterDigitalEmployeeInput
  ): Promise<PlatformResult<DigitalEmployee>> {
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

    this.digitalEmployees.set(employee.id, employee)
    const existing = this.employeeIndex.get(input.workforceId) ?? new Set<DigitalEmployeeId>()
    existing.add(employee.id)
    this.employeeIndex.set(input.workforceId, existing)

    logger.info('[WORKFORCE_ENGINE] Digital Employee registered', {
      tenantId: input.tenantId,
      organizationId: input.organizationId,
    })

    return ok(employee)
  }

  async getDigitalEmployee(
    digitalEmployeeId: DigitalEmployeeId,
    organizationId: OrganizationId
  ): Promise<PlatformResult<DigitalEmployee>> {
    const employee = this.digitalEmployees.get(digitalEmployeeId)
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
  }

  async listDigitalEmployees(
    workforceId: WorkforceId,
    organizationId: OrganizationId
  ): Promise<PlatformResult<DigitalEmployee[]>> {
    const workforceResult = await this.getWorkforce(workforceId, organizationId)
    if (!workforceResult.ok) return workforceResult

    const ids = this.employeeIndex.get(workforceId) ?? new Set()
    const results: DigitalEmployee[] = []
    for (const id of ids) {
      const e = this.digitalEmployees.get(id)
      if (e) results.push(e)
    }
    return ok(results)
  }

  async triggerEngagementRun(
    trigger: EngagementRunTrigger
  ): Promise<PlatformResult<EngagementRun>> {
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

    this.engagementRuns.set(run.id, run)
    const existing = this.runIndex.get(trigger.organizationId) ?? new Set<EngagementRunId>()
    existing.add(run.id)
    this.runIndex.set(trigger.organizationId, existing)

    logger.info('[WORKFORCE_ENGINE] Engagement Run triggered', {
      organizationId: trigger.organizationId,
    })

    return ok(run)
  }

  async getEngagementRun(
    engagementRunId: EngagementRunId,
    organizationId: OrganizationId
  ): Promise<PlatformResult<EngagementRun>> {
    const run = this.engagementRuns.get(engagementRunId)
    if (!run) return err({ code: PlatformErrorCode.NOT_FOUND, message: 'Engagement Run not found' })
    if (run.organizationId !== organizationId) {
      return err({
        code: PlatformErrorCode.TENANT_ISOLATION_VIOLATION,
        message: 'Engagement Run does not belong to this organization',
      })
    }
    return ok(run)
  }

  async updateEngagementRunStatus(
    update: EngagementRunStatusUpdate
  ): Promise<PlatformResult<EngagementRun>> {
    const run = this.engagementRuns.get(update.id)
    if (!run) return err({ code: PlatformErrorCode.NOT_FOUND, message: 'Engagement Run not found' })

    const updated: EngagementRun = {
      ...run,
      status: update.status,
      updatedAt: update.updatedAt,
      ...(update.status === 'completed' || update.status === 'failed'
        ? { completedAt: update.updatedAt }
        : {}),
      ...(update.status === 'running' ? { startedAt: update.updatedAt } : {}),
    }

    this.engagementRuns.set(updated.id, updated)
    return ok(updated)
  }

  private indexWorkforce(organizationId: OrganizationId, workforceId: WorkforceId): void {
    const existing = this.workforceIndex.get(organizationId) ?? new Set<WorkforceId>()
    existing.add(workforceId)
    this.workforceIndex.set(organizationId, existing)
  }
}

export const workforceEngineService: IWorkforceEngineService = new WorkforceEngineService()
