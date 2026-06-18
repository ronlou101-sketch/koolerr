import { auditLogger } from '@/shared/audit'
import { logger } from '@/shared/lib/logger'
import type { WorkflowId, WorkflowStepId } from '@/shared/types'
import type {
  IOrchestrationEngine,
  StepCompletionReport,
  Workflow,
  WorkflowStep,
  WorkflowStepDefinition,
} from './types'
import type { IOrchestrationRepository } from './repository'

/**
 * Orchestration Engine — stub implementation.
 *
 * Manages workflow state and dependency resolution in memory.
 * The engine does not execute Digital Employee work directly — it advances
 * workflow state and determines which steps are ready to run next.
 *
 * Domain services that implement actual step execution will call
 * reportStepCompletion() to advance the workflow after each step finishes.
 *
 * The production implementation will persist workflow state to Supabase
 * so that workflows survive process restarts and can be inspected externally.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.13 — Orchestration Engine.
 */
export class OrchestrationEngine implements IOrchestrationEngine {
  private readonly workflows = new Map<WorkflowId, Workflow>()
  private repo: IOrchestrationRepository | null = null

  _configureRepository(repo: IOrchestrationRepository): void {
    this.repo = repo
  }

  /**
   * Write-through persistence: persist after every state mutation.
   * Non-fatal — a repo failure logs a warning but does not crash the engine.
   * The in-memory state remains the source of truth during active execution;
   * the DB is the recovery source after process restart.
   */
  private async saveToRepo(workflow: Workflow): Promise<void> {
    if (!this.repo) return
    try {
      await this.repo.saveWorkflow(workflow)
    } catch (err) {
      logger.warn('[ORCHESTRATION] Failed to persist workflow state — in-memory state is current', {
        workflowId: workflow.id,
        error: String(err),
      })
    }
  }

  async createWorkflow(
    context: {
      tenantId: import('@/shared/types').TenantId
      organizationId: import('@/shared/types').OrganizationId
      engagementRunId: import('@/shared/types').EngagementRunId
    },
    definitions: WorkflowStepDefinition[]
  ): Promise<Workflow> {
    this.validateDependencyGraph(definitions)

    const steps: WorkflowStep[] = definitions.map((def) => ({
      ...def,
      status: 'pending',
    }))

    const workflow: Workflow = {
      id: `workflow_${crypto.randomUUID()}` as WorkflowId,
      tenantId: context.tenantId,
      organizationId: context.organizationId,
      engagementRunId: context.engagementRunId,
      status: 'pending',
      steps,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.workflows.set(workflow.id, workflow)
    await this.saveToRepo(workflow)

    logger.info('[ORCHESTRATION] Workflow created', {
      tenantId: context.tenantId,
      organizationId: context.organizationId,
      engagementRunId: context.engagementRunId,
    })

    return workflow
  }

  async executeWorkflow(workflowId: WorkflowId): Promise<void> {
    const workflow = this.getWorkflowOrThrow(workflowId)

    this.mutate(workflow, { status: 'running' })
    await this.saveToRepo(workflow)

    await auditLogger.log({
      tenantId: workflow.tenantId,
      organizationId: workflow.organizationId,
      actor: { type: 'system', id: 'system' },
      action: 'engagement_run.started',
      resourceType: 'engagement_run',
      resourceId: workflow.engagementRunId,
      outcome: 'success',
      metadata: { workflowId: workflow.id, stepCount: workflow.steps.length },
    })

    const ready = this.readySteps(workflow)
    logger.info(`[ORCHESTRATION] Workflow started — ${ready.length} step(s) ready to run`, {
      tenantId: workflow.tenantId,
      organizationId: workflow.organizationId,
    })
  }

  async reportStepCompletion(report: StepCompletionReport): Promise<void> {
    const workflow = this.getWorkflowOrThrow(report.workflowId)
    const step = workflow.steps.find((s) => s.id === report.stepId)

    if (!step) {
      throw new Error(
        `[ORCHESTRATION] Step "${report.stepId}" not found in workflow "${report.workflowId}"`
      )
    }

    Object.assign(step, {
      status: report.outcome,
      output: report.output,
      error: report.error,
      completedAt: new Date(),
    })

    workflow.updatedAt = new Date()

    if (report.outcome === 'failed') {
      this.mutate(workflow, { status: 'failed', completedAt: new Date() })
      await this.saveToRepo(workflow)

      await auditLogger.log({
        tenantId: workflow.tenantId,
        organizationId: workflow.organizationId,
        actor: { type: 'system', id: 'system' },
        action: 'engagement_run.failed',
        resourceType: 'engagement_run',
        resourceId: workflow.engagementRunId,
        outcome: 'failure',
        metadata: { workflowId: workflow.id, failedStep: report.stepId, error: report.error },
      })
      return
    }

    const allDone = workflow.steps.every((s) => s.status === 'completed' || s.status === 'skipped')

    if (allDone) {
      this.mutate(workflow, { status: 'completed', completedAt: new Date() })
      await this.saveToRepo(workflow)

      await auditLogger.log({
        tenantId: workflow.tenantId,
        organizationId: workflow.organizationId,
        actor: { type: 'system', id: 'system' },
        action: 'engagement_run.completed',
        resourceType: 'engagement_run',
        resourceId: workflow.engagementRunId,
        outcome: 'success',
        metadata: { workflowId: workflow.id },
      })
    } else {
      await this.saveToRepo(workflow)
      const nextReady = this.readySteps(workflow)
      logger.info(`[ORCHESTRATION] Step completed — ${nextReady.length} step(s) now ready`, {
        tenantId: workflow.tenantId,
        organizationId: workflow.organizationId,
      })
    }
  }

  async cancelWorkflow(workflowId: WorkflowId): Promise<void> {
    const workflow = this.getWorkflowOrThrow(workflowId)
    this.mutate(workflow, { status: 'cancelled', completedAt: new Date() })
    await this.saveToRepo(workflow)

    await auditLogger.log({
      tenantId: workflow.tenantId,
      organizationId: workflow.organizationId,
      actor: { type: 'system', id: 'system' },
      action: 'engagement_run.failed',
      resourceType: 'engagement_run',
      resourceId: workflow.engagementRunId,
      outcome: 'failure',
      metadata: { workflowId: workflow.id, reason: 'cancelled' },
    })
  }

  async getWorkflow(workflowId: WorkflowId): Promise<Workflow> {
    // Fast path: workflow is active in this process's memory.
    const cached = this.workflows.get(workflowId)
    if (cached) return cached

    // Recovery path: workflow was created by a previous process instance.
    // Load from the persistent store and cache it locally.
    if (this.repo) {
      const persisted = await this.repo.findWorkflow(workflowId)
      if (persisted) {
        this.workflows.set(workflowId, persisted)
        return persisted
      }
    }

    throw new Error(`[ORCHESTRATION] Workflow not found: "${workflowId}"`)
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private getWorkflowOrThrow(workflowId: WorkflowId): Workflow {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) {
      throw new Error(`[ORCHESTRATION] Workflow not found: "${workflowId}"`)
    }
    return workflow
  }

  /** Returns steps whose dependencies have all completed. */
  private readySteps(workflow: Workflow): WorkflowStep[] {
    const completedIds = new Set(
      workflow.steps.filter((s) => s.status === 'completed').map((s) => s.id)
    )
    return workflow.steps.filter((s) => {
      if (s.status !== 'pending') return false
      return (s.dependsOn ?? []).every((dep: WorkflowStepId) => completedIds.has(dep))
    })
  }

  /** Validates that dependency references are all valid step IDs and that no cycles exist. */
  private validateDependencyGraph(steps: WorkflowStepDefinition[]): void {
    const ids = new Set(steps.map((s) => s.id))

    for (const step of steps) {
      for (const dep of step.dependsOn ?? []) {
        if (!ids.has(dep)) {
          throw new Error(`[ORCHESTRATION] Step "${step.id}" depends on unknown step "${dep}"`)
        }
      }
    }

    // Cycle detection via DFS
    const visited = new Set<WorkflowStepId>()
    const inStack = new Set<WorkflowStepId>()

    const visit = (id: WorkflowStepId): void => {
      if (inStack.has(id)) {
        throw new Error(`[ORCHESTRATION] Dependency cycle detected involving step "${id}"`)
      }
      if (visited.has(id)) return
      inStack.add(id)
      const step = steps.find((s) => s.id === id)!
      for (const dep of step.dependsOn ?? []) visit(dep)
      inStack.delete(id)
      visited.add(id)
    }

    for (const step of steps) visit(step.id)
  }

  private mutate(workflow: Workflow, patch: Partial<Workflow>): void {
    Object.assign(workflow, { ...patch, updatedAt: new Date() })
  }
}

const _engine = new OrchestrationEngine()

export const orchestrationEngine: IOrchestrationEngine = _engine

/** Wire the Supabase repository. Must be called at bootstrap before the first workflow is created. */
export function _configureOrchestrationRepository(repo: IOrchestrationRepository): void {
  _engine._configureRepository(repo)
}
