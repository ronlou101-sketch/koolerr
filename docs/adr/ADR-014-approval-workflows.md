# ADR-014: Approval Workflows

**Status:** Accepted
**Date:** 2026-06-18
**Phase:** Phase 2 — Trust, Autonomy & Customer Experience
**Authors:** Engineering

---

## Context

Phase 2 Milestone 1 (ADR-013) gave the Trust Engine the ability to track earned autonomy.
But the engine only gains that data when `recordEvaluation()` is called. Without a formal
structure for routing Digital Employee actions through customer review, `recordEvaluation()`
would never be called and earned autonomy would never accumulate.

FOUNDATION_003 §Phase 2 — Approval Workflows defines the requirement:

> "Before any Digital Employee is permitted to take a consequential action autonomously,
> it must earn that permission through a defined approval workflow."
>
> "Phase 2 introduces structured approval workflows that allow customers to:
>
> - Review proposed actions before they execute
> - Approve or reject Deliverables before they are published or sent
> - Grant permission for classes of actions that have been consistently approved
> - Revoke permissions they have previously granted"

The Deliverables domain already has an approval mechanism (`submitForReview`,
`recordApprovalDecision`) for Deliverable-level approvals. What was missing was:

1. A formal `ApprovalRequest` entity that can represent any pending customer decision,
   not just Deliverable approvals.
2. A service to manage the ApprovalRequest lifecycle.
3. The connection between approval resolution and `TrustEngine.recordEvaluation()`.

---

## Decision

Introduce a new `shared/approval/` platform module containing:

### ApprovalRequest entity

An `ApprovalRequest` is the formal record of a Digital Employee action waiting for a
customer decision. It carries:

- The identity of who is asking and why (`digitalEmployeeId`, `action`, `description`)
- Context data the customer needs to make an informed decision (`context`)
- Lifecycle state: `pending | approved | rejected | expired | cancelled`
- Resolution metadata: `resolvedBy`, `resolvedAt`, `resolutionNote`

### ApprovalWorkflowService

Five operations:

| Method             | Purpose                                                              |
| ------------------ | -------------------------------------------------------------------- |
| `createRequest()`  | Called when Trust Engine returns `requires_approval`                 |
| `getRequest()`     | Single-request fetch with tenant isolation guard                     |
| `listPending()`    | Customer dashboard query — pending items needing review              |
| `resolveRequest()` | Customer approves or rejects; calls `trustEngine.recordEvaluation()` |
| `cancelRequest()`  | Cleans up when an engagement run is cancelled before review          |

### Trust Engine integration

`resolveRequest()` is the single place where a customer decision bridges to the Trust Engine.
After updating the `ApprovalRequest` status, it calls:

```typescript
await trustEngine.recordEvaluation({
  tenantId,
  organizationId,
  digitalEmployeeId,
  action,
  engagementRunId,
  decision, // 'approved' | 'rejected'
  decidedBy,
  decidedAt,
  reason, // resolutionNote if provided
})
```

This keeps the earned-autonomy counter in sync with every customer decision.
Cancellations do NOT call `recordEvaluation()` — a cancelled request is not a
performance signal; it means the action never reached the customer.

---

## Scope boundary: Deliverable approvals

The Deliverables domain (`DeliverablesService.recordApprovalDecision()`) handles the
approval of completed Deliverables as a separate workflow path. This domain method is
not replaced by `ApprovalWorkflowService`.

For callers that need both Deliverable status to update AND Trust Engine evaluation to
be recorded (e.g., a future Customer Dashboard API route), they should:

1. Call `deliverables.recordApprovalDecision()` to update the Deliverable status.
2. Call `trustEngine.recordEvaluation()` directly, or use `approvalWorkflowService.resolveRequest()`
   if an `ApprovalRequest` was pre-created for the Deliverable.

This avoids making `shared/approval/` depend on `domains/deliverables/` which would
violate the shared → domain coupling rule.

---

## Layering

`shared/approval/` is a platform module like `shared/trust/` and `shared/consent/`.

- `shared/approval/service.ts` imports `trustEngine` from `shared/trust/` — same layer, acceptable.
- `shared/approval/service.ts` imports `auditLogger` from `shared/audit/` — same layer, acceptable.
- `domains/*` may import from `shared/approval/` to create or resolve approval requests.
- `shared/approval/` must never import from `domains/*`.

---

## Database

Migration 011 adds the `approval_requests` table:

- Primary key: `id` (prefixed `approval_`)
- Foreign keys: `tenant_id`, `organization_id`, `workforce_id`, `digital_employee_id`, `engagement_run_id`
- Status check constraint: `('pending', 'approved', 'rejected', 'expired', 'cancelled')`
- Partial index on `status = 'pending'` for fast dashboard queries
- RLS policy: `tenant_id = current_tenant_id()`

---

## Consequences

### Positive

- Every approval decision is a permanent record — auditable via the audit_events table.
- The single `resolveRequest()` path ensures `trustEngine.recordEvaluation()` is always
  called; callers cannot forget to record the evaluation.
- `listPending()` provides the data source for the Customer Dashboard (Phase 2 Milestone 4)
  without any additional work.
- `cancelRequest()` keeps the pending queue clean when engagement runs are cancelled.

### Risks and limitations

- **Deliverable approvals are two calls.** Callers that want a Deliverable approval to also
  feed the Trust Engine must make two explicit calls. A future "Deliverable approval facade"
  in infrastructure/ could combine them, but it should not live in `shared/approval/` itself.
- **No expiry enforcement.** `expiresAt` is stored but not enforced automatically. A future
  background job or middleware check can expire stale pending requests. Setting the status to
  `'expired'` manually is supported by the schema.
- **Service-role key bypass.** Inherited from ADR-012 — RLS is not enforced at the DB layer
  until session-scoped clients are introduced.

---

## Files Changed

| File                                                       | Change                                                                     |
| ---------------------------------------------------------- | -------------------------------------------------------------------------- |
| `shared/types/platform.ts`                                 | Added `ApprovalRequestId` branded type                                     |
| `shared/approval/types.ts`                                 | New — `ApprovalRequest`, input types, `IApprovalWorkflowService`           |
| `shared/approval/repository.ts`                            | New — `IApprovalRepository`                                                |
| `shared/approval/in-memory-repository.ts`                  | New — `InMemoryApprovalRepository`                                         |
| `shared/approval/supabase-repository.ts`                   | New — `SupabaseApprovalRepository`                                         |
| `shared/approval/service.ts`                               | New — `ApprovalWorkflowService`, singleton, `_configureApprovalRepository` |
| `shared/approval/service.test-helpers.ts`                  | New — `makeApprovalService()` factory                                      |
| `shared/approval/service.test.ts`                          | New — 20 tests covering full service lifecycle                             |
| `shared/approval/index.ts`                                 | New — public exports                                                       |
| `supabase/migrations/20260618000011_approval_requests.sql` | New table with RLS                                                         |
| `infrastructure/platform/bootstrap.ts`                     | Wires `SupabaseApprovalRepository`                                         |
| `docs/adr/ADR-014-approval-workflows.md`                   | This document                                                              |
