import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  DigitalEmployeeId,
  EngagementRunId,
  OrganizationId,
  TenantId,
  WorkflowId,
  WorkflowStepId,
} from '@/shared/types'
import type { Workflow, WorkflowStatus, WorkflowStep, WorkflowStepStatus } from './types'
import type { IOrchestrationRepository } from './repository'

/**
 * Supabase Orchestration Repository
 *
 * Persists workflow state across the `workflows` and `workflow_steps` tables
 * (migration 008). Both tables have RLS policies that enforce tenant isolation
 * via the current_tenant_id() JWT claim.
 *
 * Strategy:
 * - saveWorkflow: upserts the workflow header row, then upserts all step rows.
 *   The full step set is always written so the DB is always consistent with
 *   the engine's in-memory state.
 * - findWorkflow: loads the workflow row and all associated step rows, then
 *   reassembles a Workflow object. Used by the engine to recover state after
 *   a process restart.
 *
 * See supabase/migrations/20260618000008_orchestration.sql for the schema.
 * See docs/adr/ADR-011-orchestration-persistence.md.
 */

// ---------------------------------------------------------------------------
// DB row types
// ---------------------------------------------------------------------------

interface WorkflowRow {
  id: string
  tenant_id: string
  organization_id: string
  engagement_run_id: string
  status: string
  created_at: string
  updated_at: string
  completed_at: string | null
}

interface WorkflowStepRow {
  step_id: string
  workflow_id: string
  name: string
  digital_employee_id: string
  action: string
  depends_on: string[]
  input: Record<string, unknown>
  status: string
  output: Record<string, unknown> | null
  error: string | null
  started_at: string | null
  completed_at: string | null
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapWorkflow(row: WorkflowRow, steps: WorkflowStep[]): Workflow {
  return {
    id: row.id as WorkflowId,
    tenantId: row.tenant_id as TenantId,
    organizationId: row.organization_id as OrganizationId,
    engagementRunId: row.engagement_run_id as EngagementRunId,
    status: row.status as WorkflowStatus,
    steps,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
  }
}

function workflowToRow(workflow: Workflow): WorkflowRow {
  return {
    id: workflow.id,
    tenant_id: workflow.tenantId,
    organization_id: workflow.organizationId,
    engagement_run_id: workflow.engagementRunId,
    status: workflow.status,
    created_at: workflow.createdAt.toISOString(),
    updated_at: workflow.updatedAt.toISOString(),
    completed_at: workflow.completedAt?.toISOString() ?? null,
  }
}

function mapStep(row: WorkflowStepRow): WorkflowStep {
  return {
    id: row.step_id as WorkflowStepId,
    name: row.name,
    digitalEmployeeId: row.digital_employee_id as DigitalEmployeeId,
    action: row.action,
    dependsOn: row.depends_on.length > 0 ? (row.depends_on as WorkflowStepId[]) : undefined,
    input: Object.keys(row.input ?? {}).length > 0 ? row.input : undefined,
    status: row.status as WorkflowStepStatus,
    output: row.output ?? undefined,
    error: row.error ?? undefined,
    startedAt: row.started_at ? new Date(row.started_at) : undefined,
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
  }
}

function stepToRow(step: WorkflowStep, workflowId: WorkflowId): WorkflowStepRow {
  return {
    step_id: step.id,
    workflow_id: workflowId,
    name: step.name,
    digital_employee_id: step.digitalEmployeeId,
    action: step.action,
    depends_on: step.dependsOn ?? [],
    input: step.input ?? {},
    status: step.status,
    output: step.output ?? null,
    error: step.error ?? null,
    started_at: step.startedAt?.toISOString() ?? null,
    completed_at: step.completedAt?.toISOString() ?? null,
  }
}

// ---------------------------------------------------------------------------
// Repository implementation
// ---------------------------------------------------------------------------

export class SupabaseOrchestrationRepository implements IOrchestrationRepository {
  constructor(private readonly client: SupabaseClient) {}

  async saveWorkflow(workflow: Workflow): Promise<Workflow> {
    const { error: wfError } = await this.client
      .from('workflows')
      .upsert(workflowToRow(workflow), { onConflict: 'id' })
    if (wfError) throw new Error(`[ORCH_REPO] saveWorkflow failed: ${wfError.message}`)

    if (workflow.steps.length > 0) {
      const stepRows = workflow.steps.map((s) => stepToRow(s, workflow.id))
      const { error: stepsError } = await this.client
        .from('workflow_steps')
        .upsert(stepRows, { onConflict: 'workflow_id,step_id' })
      if (stepsError) throw new Error(`[ORCH_REPO] saveWorkflowSteps failed: ${stepsError.message}`)
    }

    return workflow
  }

  async findWorkflow(id: WorkflowId): Promise<Workflow | null> {
    const { data: wfData, error: wfError } = await this.client
      .from('workflows')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (wfError) throw new Error(`[ORCH_REPO] findWorkflow failed: ${wfError.message}`)
    if (!wfData) return null

    const { data: stepsData, error: stepsError } = await this.client
      .from('workflow_steps')
      .select('*')
      .eq('workflow_id', id)
      .order('step_id')
    if (stepsError) throw new Error(`[ORCH_REPO] findWorkflowSteps failed: ${stepsError.message}`)

    const steps = (stepsData ?? []).map((r) => mapStep(r as WorkflowStepRow))
    return mapWorkflow(wfData as WorkflowRow, steps)
  }
}
