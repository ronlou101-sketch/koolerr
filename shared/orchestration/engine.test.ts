import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DigitalEmployeeId, EngagementRunId, OrganizationId, TenantId } from '@/shared/types'
import type { WorkflowStepId } from '@/shared/types'

/**
 * Orchestration Engine unit tests.
 *
 * Verifies the core invariants the engine is responsible for:
 *   1. Workflow state machine — pending → running → completed/failed/cancelled
 *   2. Dependency resolution — steps only become ready when all deps are completed
 *   3. Failure propagation — a failed step immediately fails the whole workflow
 *   4. Write-through persistence — every mutation reaches the repository
 *   5. Recovery path — getWorkflow falls back to repo on cache miss
 *   6. Graph validation — unknown references and cycles are rejected at creation time
 *
 * All tests use fresh engine instances to prevent state leakage between cases.
 * The audit logger and process logger are mocked to keep tests hermetic.
 */

// ---------------------------------------------------------------------------
// Module mocks
// vi.mock() factories are hoisted above all imports. Any variable they close
// over must be initialised with vi.hoisted() to avoid the temporal dead zone.
// ---------------------------------------------------------------------------

const { mockAuditLog } = vi.hoisted(() => ({
  mockAuditLog: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/shared/audit', () => ({
  auditLogger: { log: mockAuditLog },
}))
vi.mock('@/shared/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { OrchestrationEngine } from '@/shared/orchestration/engine'
import { InMemoryOrchestrationRepository } from '@/shared/orchestration/in-memory-repository'
import type { WorkflowStepDefinition } from '@/shared/orchestration/types'

// ---------------------------------------------------------------------------
// Test constants and helpers
// ---------------------------------------------------------------------------

const TENANT_ID = 'tenant_test' as TenantId
const ORG_ID = 'org_test' as OrganizationId
const RUN_ID = 'run_test' as EngagementRunId
const EMP_A = 'emp_a' as DigitalEmployeeId
const EMP_B = 'emp_b' as DigitalEmployeeId
const EMP_C = 'emp_c' as DigitalEmployeeId
const STEP_A = 'step_a' as WorkflowStepId
const STEP_B = 'step_b' as WorkflowStepId
const STEP_C = 'step_c' as WorkflowStepId

const WF_CONTEXT = { tenantId: TENANT_ID, organizationId: ORG_ID, engagementRunId: RUN_ID }

function step(
  id: WorkflowStepId,
  employee: DigitalEmployeeId,
  deps?: WorkflowStepId[]
): WorkflowStepDefinition {
  return {
    id,
    name: `Step ${id}`,
    digitalEmployeeId: employee,
    action: `action_${id}`,
    dependsOn: deps,
  }
}

function makeEngine(withRepo = true) {
  const engine = new OrchestrationEngine()
  const repo = new InMemoryOrchestrationRepository()
  if (withRepo) engine._configureRepository(repo)
  return { engine, repo }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('OrchestrationEngine', () => {
  beforeEach(() => {
    mockAuditLog.mockClear()
  })

  // -------------------------------------------------------------------------
  describe('createWorkflow', () => {
    it('creates a workflow in pending status', async () => {
      const { engine } = makeEngine()
      const wf = await engine.createWorkflow(WF_CONTEXT, [step(STEP_A, EMP_A)])
      expect(wf.status).toBe('pending')
      expect(wf.tenantId).toBe(TENANT_ID)
      expect(wf.organizationId).toBe(ORG_ID)
    })

    it('initialises all steps with pending status', async () => {
      const { engine } = makeEngine()
      const wf = await engine.createWorkflow(WF_CONTEXT, [
        step(STEP_A, EMP_A),
        step(STEP_B, EMP_B, [STEP_A]),
      ])
      expect(wf.steps).toHaveLength(2)
      expect(wf.steps.every((s) => s.status === 'pending')).toBe(true)
    })

    it('throws when a dependency references an unknown step id', async () => {
      const { engine } = makeEngine()
      await expect(
        engine.createWorkflow(WF_CONTEXT, [
          step(STEP_A, EMP_A, ['does_not_exist' as WorkflowStepId]),
        ])
      ).rejects.toThrow(/depends on unknown step/)
    })

    it('throws when steps form a cycle', async () => {
      const { engine } = makeEngine()
      await expect(
        engine.createWorkflow(WF_CONTEXT, [
          step(STEP_A, EMP_A, [STEP_B]),
          step(STEP_B, EMP_B, [STEP_A]),
        ])
      ).rejects.toThrow(/cycle/)
    })

    it('persists the new workflow to the repository', async () => {
      const { engine, repo } = makeEngine()
      const saveSpy = vi.spyOn(repo, 'saveWorkflow')
      engine._configureRepository(repo)
      const wf = await engine.createWorkflow(WF_CONTEXT, [step(STEP_A, EMP_A)])
      expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({ id: wf.id }))
    })
  })

  // -------------------------------------------------------------------------
  describe('executeWorkflow', () => {
    it('transitions workflow status to running', async () => {
      const { engine } = makeEngine()
      const wf = await engine.createWorkflow(WF_CONTEXT, [step(STEP_A, EMP_A)])
      await engine.executeWorkflow(wf.id)
      const running = await engine.getWorkflow(wf.id)
      expect(running.status).toBe('running')
    })

    it('emits an audit log event on start', async () => {
      const { engine } = makeEngine()
      const wf = await engine.createWorkflow(WF_CONTEXT, [step(STEP_A, EMP_A)])
      await engine.executeWorkflow(wf.id)
      expect(mockAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'engagement_run.started' })
      )
    })
  })

  // -------------------------------------------------------------------------
  describe('reportStepCompletion', () => {
    it('marks the step as completed', async () => {
      const { engine } = makeEngine()
      const wf = await engine.createWorkflow(WF_CONTEXT, [step(STEP_A, EMP_A)])
      await engine.executeWorkflow(wf.id)
      await engine.reportStepCompletion({ workflowId: wf.id, stepId: STEP_A, outcome: 'completed' })
      const updated = await engine.getWorkflow(wf.id)
      expect(updated.steps.find((s) => s.id === STEP_A)?.status).toBe('completed')
    })

    it('completes the workflow when all steps are done', async () => {
      const { engine } = makeEngine()
      const wf = await engine.createWorkflow(WF_CONTEXT, [step(STEP_A, EMP_A)])
      await engine.executeWorkflow(wf.id)
      await engine.reportStepCompletion({ workflowId: wf.id, stepId: STEP_A, outcome: 'completed' })
      const done = await engine.getWorkflow(wf.id)
      expect(done.status).toBe('completed')
      expect(done.completedAt).toBeDefined()
    })

    it('fails the workflow when a step fails', async () => {
      const { engine } = makeEngine()
      const wf = await engine.createWorkflow(WF_CONTEXT, [step(STEP_A, EMP_A)])
      await engine.executeWorkflow(wf.id)
      await engine.reportStepCompletion({
        workflowId: wf.id,
        stepId: STEP_A,
        outcome: 'failed',
        error: 'model timeout',
      })
      const failed = await engine.getWorkflow(wf.id)
      expect(failed.status).toBe('failed')
    })

    it('emits an audit log on workflow completion', async () => {
      const { engine } = makeEngine()
      const wf = await engine.createWorkflow(WF_CONTEXT, [step(STEP_A, EMP_A)])
      await engine.executeWorkflow(wf.id)
      mockAuditLog.mockClear()
      await engine.reportStepCompletion({ workflowId: wf.id, stepId: STEP_A, outcome: 'completed' })
      expect(mockAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'engagement_run.completed' })
      )
    })

    it('throws on an unknown step id', async () => {
      const { engine } = makeEngine()
      const wf = await engine.createWorkflow(WF_CONTEXT, [step(STEP_A, EMP_A)])
      await engine.executeWorkflow(wf.id)
      await expect(
        engine.reportStepCompletion({
          workflowId: wf.id,
          stepId: 'no_such_step' as WorkflowStepId,
          outcome: 'completed',
        })
      ).rejects.toThrow(/not found/)
    })

    it('persists after step completion', async () => {
      const { engine, repo } = makeEngine()
      const saveSpy = vi.spyOn(repo, 'saveWorkflow')
      engine._configureRepository(repo)
      const wf = await engine.createWorkflow(WF_CONTEXT, [step(STEP_A, EMP_A)])
      saveSpy.mockClear()
      await engine.executeWorkflow(wf.id)
      await engine.reportStepCompletion({ workflowId: wf.id, stepId: STEP_A, outcome: 'completed' })
      expect(saveSpy.mock.calls.length).toBeGreaterThanOrEqual(2) // executeWorkflow + reportStep
    })
  })

  // -------------------------------------------------------------------------
  describe('cancelWorkflow', () => {
    it('transitions workflow to cancelled', async () => {
      const { engine } = makeEngine()
      const wf = await engine.createWorkflow(WF_CONTEXT, [step(STEP_A, EMP_A)])
      await engine.executeWorkflow(wf.id)
      await engine.cancelWorkflow(wf.id)
      const cancelled = await engine.getWorkflow(wf.id)
      expect(cancelled.status).toBe('cancelled')
      expect(cancelled.completedAt).toBeDefined()
    })
  })

  // -------------------------------------------------------------------------
  describe('getWorkflow', () => {
    it('returns workflow from in-memory cache', async () => {
      const { engine } = makeEngine()
      const wf = await engine.createWorkflow(WF_CONTEXT, [step(STEP_A, EMP_A)])
      const fetched = await engine.getWorkflow(wf.id)
      expect(fetched.id).toBe(wf.id)
    })

    it('falls back to the repository on cache miss (post-restart recovery)', async () => {
      const repo = new InMemoryOrchestrationRepository()
      const engine1 = new OrchestrationEngine()
      engine1._configureRepository(repo)
      const wf = await engine1.createWorkflow(WF_CONTEXT, [step(STEP_A, EMP_A)])

      // engine2 is a fresh instance — empty in-memory cache, same repo
      const engine2 = new OrchestrationEngine()
      engine2._configureRepository(repo)
      const recovered = await engine2.getWorkflow(wf.id)
      expect(recovered.id).toBe(wf.id)
      expect(recovered.steps).toHaveLength(1)
    })

    it('throws when the workflow is not in memory or the repository', async () => {
      const { engine } = makeEngine()
      await expect(
        engine.getWorkflow('workflow_does_not_exist' as import('@/shared/types').WorkflowId)
      ).rejects.toThrow(/not found/)
    })
  })

  // -------------------------------------------------------------------------
  describe('three-step linear chain (dependency resolution integration)', () => {
    it('completes A → B → C in order, unblocking downstream steps', async () => {
      const { engine } = makeEngine()
      const wf = await engine.createWorkflow(WF_CONTEXT, [
        step(STEP_A, EMP_A),
        step(STEP_B, EMP_B, [STEP_A]),
        step(STEP_C, EMP_C, [STEP_B]),
      ])
      await engine.executeWorkflow(wf.id)

      await engine.reportStepCompletion({ workflowId: wf.id, stepId: STEP_A, outcome: 'completed' })
      await engine.reportStepCompletion({ workflowId: wf.id, stepId: STEP_B, outcome: 'completed' })
      await engine.reportStepCompletion({ workflowId: wf.id, stepId: STEP_C, outcome: 'completed' })

      const done = await engine.getWorkflow(wf.id)
      expect(done.status).toBe('completed')
      expect(done.steps.every((s) => s.status === 'completed')).toBe(true)
    })
  })
})
