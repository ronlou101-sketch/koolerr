import type { WorkflowId } from '@/shared/types'
import type { Workflow } from './types'

/**
 * Orchestration Repository Interface
 *
 * Provides durable storage for Workflow state. The engine uses a write-through
 * cache: in-memory for fast reads during active execution, persistent store for
 * durability across restarts and failures.
 *
 * Only two operations are needed: save the full workflow state (upsert) and
 * load it by ID. Steps are embedded in the Workflow object so there is no
 * partial-update surface.
 *
 * See docs/adr/ADR-004-repository-pattern.md — Repository Pattern.
 * See docs/adr/ADR-011-orchestration-persistence.md — this decision.
 */
export interface IOrchestrationRepository {
  /**
   * Persist the complete workflow state including all steps.
   * Idempotent — calling with the same workflow ID replaces the previous state.
   */
  saveWorkflow(workflow: Workflow): Promise<Workflow>

  /**
   * Load a workflow and all of its steps by ID.
   * Returns null when no workflow exists for the given ID.
   */
  findWorkflow(id: WorkflowId): Promise<Workflow | null>
}
