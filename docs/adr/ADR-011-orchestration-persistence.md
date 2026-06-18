# ADR-011: Orchestration Engine Persistence

**Status:** Accepted  
**Phase:** Phase 2 Pre-requisite Hardening  
**Date:** 2026-06-18

---

## Context

The Orchestration Engine manages multi-step Engagement Run workflows. Prior to this change it stored all workflow state in a process-local `Map<WorkflowId, Workflow>`. The consequence: any server restart or crash during an in-flight Engagement Run caused the workflow state to disappear. The only observable signal was a stalled Engagement Run record with no workflow to match it.

FOUNDATION_001 §2.13 requires the Orchestration Engine to support "failure recovery." Phase 2's Approval Workflow capability — a central Phase 2 feature — depends on workflow state persisting across the request lifecycle. Without persistence, Approval Workflows cannot outlive the HTTP request that triggers them.

This ADR documents the persistence design adopted during Phase 2 pre-requisite hardening.

---

## Decision

### Repository pattern (consistent with all other persistence in this codebase)

A new `IOrchestrationRepository` interface with two operations:

```
saveWorkflow(workflow: Workflow): Promise<Workflow>
findWorkflow(id: WorkflowId): Promise<Workflow | null>
```

The full `Workflow` object — including all steps — is saved on every mutation. There are no partial-update operations. This keeps the interface minimal and eliminates partial-state bugs.

**`InMemoryOrchestrationRepository`** ships with the interface for tests. It deep-clones on save so engine-side in-place mutations (`Object.assign` on steps) do not silently corrupt the stored state, mirroring actual DB round-trip semantics.

**`SupabaseOrchestrationRepository`** is the production implementation. It upserts the `workflows` row and all `workflow_steps` rows in two operations.

### Write-through cache in the engine

The engine retains its in-memory `Map<WorkflowId, Workflow>` as a write-through cache:

- Every state mutation (workflow status, step completion) writes to the DB immediately via the `saveToRepo()` helper.
- `saveToRepo` is non-fatal: a DB failure logs a warning but does not crash the engine. The in-memory state remains correct for the duration of the current request.
- `getWorkflow()` checks the in-memory Map first (fast path for active execution). On a cache miss — which happens after process restart — it falls back to the repository and re-caches the loaded workflow.

This design gives:

- **Zero latency overhead** for active workflows: the executor loop reads from memory.
- **Durability**: every step completion is persisted before the next step is attempted.
- **Recovery**: a future request can load the workflow state from DB by ID.

### Database schema (`migration 008`)

Two tables in `supabase/migrations/20260618000008_orchestration.sql`:

- `workflows`: workflow header with status, timestamps, and foreign key to `organizations`.
- `workflow_steps`: step per (workflow_id, step_id) composite PK. Stores `depends_on` as `text[]` (the dependency graph is always loaded as a whole), and `input`/`output` as `jsonb`.

Both tables have `ENABLE ROW LEVEL SECURITY` and a `tenant_isolation` policy using `current_tenant_id()` — consistent with all other tables in the schema. `workflow_steps` inherits isolation via a subquery on `workflows`.

---

## What "resumable" means in this context

True workflow resumption (automatically restarting a partially-executed workflow after a process restart) requires a background job scheduler or queue — a Phase 3 capability. What this change delivers:

1. **Durable state inspection**: after any server restart or failure, the DB contains the exact state of every workflow including which steps completed and which did not.
2. **`getWorkflow()` post-restart recovery**: a new process instance can load a workflow by ID from the DB. The executor loop could be adapted to resume from the last completed step given the loaded state.
3. **Foundation for Approval Workflows**: Phase 2 Approval Workflows require workflow state to outlive the request that triggers them. This persistence layer makes that possible.

---

## Files Changed

| File                                                   | Change                                                                                                                                |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `shared/orchestration/repository.ts`                   | NEW — `IOrchestrationRepository` interface                                                                                            |
| `shared/orchestration/in-memory-repository.ts`         | NEW — test/default implementation                                                                                                     |
| `shared/orchestration/supabase-repository.ts`          | NEW — production implementation                                                                                                       |
| `shared/orchestration/engine.ts`                       | MODIFIED — added `repo` field, `_configureRepository()`, `saveToRepo()`, updated `getWorkflow()`, persist calls at all mutation sites |
| `shared/orchestration/index.ts`                        | MODIFIED — exports `_configureOrchestrationRepository`, repository types and classes                                                  |
| `infrastructure/platform/bootstrap.ts`                 | MODIFIED — wires `SupabaseOrchestrationRepository` at step 3b-2                                                                       |
| `supabase/migrations/20260618000008_orchestration.sql` | NEW — `workflows` + `workflow_steps` schema with RLS                                                                                  |

---

## Risks and Remaining Limitations

- **Concurrent process instances**: if two processes attempt to save the same workflow simultaneously (e.g., blue-green deployment overlap), the last writer wins. Optimistic locking via an `updated_at` check would prevent this, deferred to Phase 3.
- **No automatic resumption**: a crashed in-flight run requires manual re-triggering. The DB state enables this; the executor loop does not yet implement step-skipping for already-completed steps.
- **Performance at scale**: saving all steps on every step completion is O(n) writes per step. For Phase 1–2 scale (2–4 steps per workflow), this is negligible.
