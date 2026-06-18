import type {
  DigitalEmployeeId,
  EngagementRunId,
  OrganizationId,
  TenantId,
  WorkflowId,
  WorkflowStepId,
} from '@/shared/types'

/**
 * Orchestration Engine Types
 *
 * The Orchestration Engine coordinates multi-step, multi-agent workflows.
 * It manages state, resolves step dependencies, handles failure recovery,
 * and provides full auditability of workflow execution.
 *
 * The engine coordinates execution. Digital Employees perform the work.
 * Business logic does not live in the Orchestration Engine.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.13 — Orchestration Engine.
 */

// ---------------------------------------------------------------------------
// Workflow step
// ---------------------------------------------------------------------------

export type WorkflowStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped'

export interface WorkflowStepDefinition {
  /** Client-assigned step ID used to express dependencies. */
  id: WorkflowStepId
  name: string
  digitalEmployeeId: DigitalEmployeeId
  /** The action the Digital Employee will perform. Must match a registered TrustRule. */
  action: string
  /** IDs of steps that must complete before this step may start. */
  dependsOn?: WorkflowStepId[]
  input?: Record<string, unknown>
}

export interface WorkflowStep extends WorkflowStepDefinition {
  status: WorkflowStepStatus
  output?: Record<string, unknown>
  error?: string
  startedAt?: Date
  completedAt?: Date
}

// ---------------------------------------------------------------------------
// Workflow
// ---------------------------------------------------------------------------

export type WorkflowStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface Workflow {
  id: WorkflowId
  tenantId: TenantId
  organizationId: OrganizationId
  engagementRunId: EngagementRunId
  status: WorkflowStatus
  steps: WorkflowStep[]
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

// ---------------------------------------------------------------------------
// Step completion — what the executing layer reports back to the engine
// ---------------------------------------------------------------------------

export interface StepCompletionReport {
  workflowId: WorkflowId
  stepId: WorkflowStepId
  outcome: 'completed' | 'failed'
  output?: Record<string, unknown>
  error?: string
}

// ---------------------------------------------------------------------------
// Orchestration Engine interface
// ---------------------------------------------------------------------------

export interface IOrchestrationEngine {
  /**
   * Create a new workflow for an Engagement Run.
   * Steps are registered with their dependency graph. Execution has not started.
   */
  createWorkflow(
    context: {
      tenantId: TenantId
      organizationId: OrganizationId
      engagementRunId: EngagementRunId
    },
    steps: WorkflowStepDefinition[]
  ): Promise<Workflow>

  /**
   * Begin executing a workflow.
   * Steps with no unresolved dependencies are started immediately.
   * Subsequent steps start as their dependencies complete.
   */
  executeWorkflow(workflowId: WorkflowId): Promise<void>

  /**
   * Report a step outcome back to the engine.
   * The engine advances the workflow based on the dependency graph.
   */
  reportStepCompletion(report: StepCompletionReport): Promise<void>

  /** Cancel a running workflow. In-flight steps are allowed to drain. */
  cancelWorkflow(workflowId: WorkflowId): Promise<void>

  /** Return the current state of a workflow and all its steps. */
  getWorkflow(workflowId: WorkflowId): Promise<Workflow>
}
