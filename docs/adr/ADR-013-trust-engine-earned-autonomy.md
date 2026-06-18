# ADR-013: Trust Engine — Earned Autonomy

**Status:** Accepted
**Date:** 2026-06-18
**Phase:** Phase 2 — Trust, Autonomy & Customer Experience
**Authors:** Engineering

---

## Context

Phase 1 established the Trust Engine foundation with a simple binary model: every registered
TrustRule that has `requiresApproval: true` always routes the action through the customer
approval queue, regardless of how many times the customer has previously approved identical
actions from the same Digital Employee.

This is correct for a new Digital Employee with no track record. But FOUNDATION_004 §8
(Progressive Autonomy) requires that trust be earned incrementally:

> "The product surfaces opportunities to grant additional autonomy when the data supports it:
> 'Your Content Workforce has produced 20 blog posts that you approved without modifications.
> Would you like to allow first drafts to be published directly for review only after publishing?'"

Asking a customer to manually approve the same low-stakes action for the 50th time, after 49
consecutive successful approvals, erodes trust in the platform's judgment and creates unnecessary
friction. The Trust Engine must be able to recognise when a Digital Employee has earned the right
to act autonomously on a specific action.

---

## Decision

Introduce an **Earned Autonomy** mechanism that tracks a Digital Employee's performance history
per `(organization, digitalEmployee, action)` tuple and automatically permits an action that has
met the threshold — without requiring a fresh customer approval each time.

### New types

**`TrustEvaluation`** — append-only record of a customer's explicit approval or rejection of a
Digital Employee action. Stored permanently; never updated or deleted.

**`EarnedAutonomy`** — one row per `(organization, digitalEmployee, action)` tuple. Tracks:

- `consecutiveApprovals` — running count, reset to zero on any rejection
- `isEarned` — true when `consecutiveApprovals >= EARNED_AUTONOMY_THRESHOLD`
- `earnedAt` — timestamp of the first time the threshold was crossed (preserved on further approvals)

### Threshold

`EARNED_AUTONOMY_THRESHOLD = 5` consecutive approvals. This constant is exported from
`shared/trust/engine.ts` so tests and future configuration can reference it by name.

Five was chosen as the default because it is:

- Low enough to earn autonomy in a reasonable timeframe for a productive Digital Employee.
- High enough that a single "accidental" approval streak cannot grant autonomous action.
- Consistent with the product principle that trust must be demonstrated, not assumed.

### How it integrates with `check()`

The earned-autonomy check sits between consent verification and the `requiresApproval` guard:

```
1. No matching rule → requires_approval (default-deny, unchanged)
2. requiredConsentScope absent → consent check skipped
3. requiredConsentScope present but no active consent → requires_approval (unchanged)
4. requiresApproval: true AND EarnedAutonomy.isEarned: true → permitted at 'autonomous'
5. requiresApproval: true AND NOT earned → requires_approval (unchanged)
6. requiresApproval: false → permitted (unchanged)
```

Consent is always evaluated before earned autonomy. A Digital Employee can never bypass
a missing consent record, even if autonomy is fully earned.

### How `recordEvaluation()` works

Called by the Approval Workflow layer (Phase 2 Milestone 2) after a customer makes a decision:

1. Saves a `TrustEvaluation` record to the repository (append-only).
2. Loads the current `EarnedAutonomy` for this tuple (or starts from zero).
3. If decision is `'approved'`: increments `consecutiveApprovals`; if `>= threshold`, sets `isEarned`.
4. If decision is `'rejected'`: resets `consecutiveApprovals` to 0 and `isEarned` to false.
5. Saves the updated `EarnedAutonomy`.
6. Audits the event (`trust_engine.evaluation_approved` or `trust_engine.evaluation_rejected`).

### Repository additions

Three new methods added to `ITrustRuleRepository`:

- `saveEvaluation(evaluation)` — append-only insert
- `getEarnedAutonomy(orgId, employeeId, action)` — single-row lookup by tuple
- `saveEarnedAutonomy(earned)` — upsert on the UNIQUE `(organization_id, digital_employee_id, action)` constraint

### Database tables

Two new tables in migration 010:

- `trust_evaluations` — append-only, with RLS enforcing tenant isolation
- `earned_autonomy` — one row per tuple, UNIQUE constraint, with RLS enforcing tenant isolation

---

## Consequences

### Positive

- Digital Employees that demonstrate consistent reliable performance earn reduced friction.
- The trust progression is transparent: the `consecutiveApprovals` counter and `earnedAt`
  timestamp are on-record, available to the Customer Dashboard (Phase 2 Milestone 4).
- Rejection is a hard reset — customers retain full control; the platform never accumulates
  trust silently.
- The mechanism is per-action, not per-employee — a Digital Employee can earn autonomy for
  low-stakes actions while remaining supervised for high-stakes ones.

### Neutral

- The threshold (5) is a constant, not a per-rule configuration. This is intentional: per
  FOUNDATION_004 §2 (Simplicity Over Configuration), reasonable defaults that work for most
  customers are preferred over configuration options that shift decision-making burden to the
  customer. The threshold can be made configurable in a future phase if evidence supports it.

### Risks and limitations

- **Service-role bypass:** The current repository implementation uses the service-role key,
  which bypasses DB-layer RLS. This is a known limitation tracked since ADR-012. The
  earned-autonomy mechanism inherits this limitation. RLS becomes fully enforced when
  session-scoped clients are introduced in a future hardening step.

- **No grandfathering:** Customers who approved actions many times before Phase 2 launched will
  start from zero consecutive approvals. This is intentional — the counter represents a
  contiguous, verifiable streak, not a historical aggregate.

- **No inter-session continuity test:** The in-memory engine cache does not persist between
  server restarts, but earned-autonomy state is read from the repository on each `check()` call
  (via `getEarnedAutonomy`) so it survives restarts correctly.

---

## Files Changed

| File                                                       | Change                                                                                                                                            |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shared/trust/types.ts`                                    | Added `TrustEvaluation`, `EarnedAutonomy`, `RecordEvaluationInput`, `EvaluationDecision`; added `recordEvaluation()` to `ITrustEngine`            |
| `shared/trust/repository.ts`                               | Added `saveEvaluation`, `getEarnedAutonomy`, `saveEarnedAutonomy` to `ITrustRuleRepository`                                                       |
| `shared/trust/engine.ts`                                   | Exported `TrustEngine` class; added `EARNED_AUTONOMY_THRESHOLD` constant; added `recordEvaluation()`; updated `check()` to honour earned autonomy |
| `shared/trust/in-memory-repository.ts`                     | New — `InMemoryTrustRuleRepository` implementing the full extended repository                                                                     |
| `shared/trust/supabase-repository.ts`                      | Implemented `saveEvaluation`, `getEarnedAutonomy`, `saveEarnedAutonomy`                                                                           |
| `shared/trust/index.ts`                                    | Exported `TrustEngine`, `EARNED_AUTONOMY_THRESHOLD`, `InMemoryTrustRuleRepository`, new types                                                     |
| `shared/audit/types.ts`                                    | Added `trust_engine.evaluation_approved`, `trust_engine.evaluation_rejected`, `trust_engine.autonomy_earned` to `AuditAction`                     |
| `shared/trust/engine-earned-autonomy.test.ts`              | New — 11 tests covering counter mechanics and `check()` earned-autonomy path                                                                      |
| `supabase/migrations/20260618000010_trust_evaluations.sql` | New tables: `trust_evaluations`, `earned_autonomy` with RLS                                                                                       |
| `docs/adr/ADR-013-trust-engine-earned-autonomy.md`         | This document                                                                                                                                     |
