import type { WorkflowId } from '@/shared/types'
import type { Workflow, WorkflowStep } from './types'
import type { IOrchestrationRepository } from './repository'

/**
 * In-Memory Orchestration Repository
 *
 * Stores workflow state in process memory. Used in tests and as the default
 * before bootstrap wires the Supabase implementation.
 *
 * Stores deep clones on save so that engine-side in-place mutations
 * (Object.assign on steps) do not silently corrupt the stored state.
 * This mirrors what a real DB would do — you get back what you committed.
 */
export class InMemoryOrchestrationRepository implements IOrchestrationRepository {
  private readonly store = new Map<WorkflowId, Workflow>()

  async saveWorkflow(workflow: Workflow): Promise<Workflow> {
    this.store.set(workflow.id, cloneWorkflow(workflow))
    return workflow
  }

  async findWorkflow(id: WorkflowId): Promise<Workflow | null> {
    const stored = this.store.get(id)
    return stored ? cloneWorkflow(stored) : null
  }
}

// ---------------------------------------------------------------------------
// Deep clone — avoids shared references between the engine's in-memory Map
// and the repository's store. Mirrors actual DB round-trip semantics in tests.
// ---------------------------------------------------------------------------

function cloneStep(s: WorkflowStep): WorkflowStep {
  return {
    ...s,
    dependsOn: s.dependsOn ? [...s.dependsOn] : undefined,
    input: s.input ? { ...s.input } : undefined,
    output: s.output ? { ...s.output } : undefined,
    startedAt: s.startedAt ? new Date(s.startedAt) : undefined,
    completedAt: s.completedAt ? new Date(s.completedAt) : undefined,
  }
}

function cloneWorkflow(wf: Workflow): Workflow {
  return {
    ...wf,
    createdAt: new Date(wf.createdAt),
    updatedAt: new Date(wf.updatedAt),
    completedAt: wf.completedAt ? new Date(wf.completedAt) : undefined,
    steps: wf.steps.map(cloneStep),
  }
}
