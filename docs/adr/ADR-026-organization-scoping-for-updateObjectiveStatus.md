# ADR-026 — Organization Scoping for updateObjectiveStatus

- Status: Accepted
- Date: 2026-09-10
- Author: KOOLERR FOREMAN / Claude implementing engineer, under Architect direction (`d276c0d4…`, `f09f1871…`)
- CTO Review: Architect-approved (Preview MCP)
- Founder Approval: Pending merge of PR #16
- Supersedes / Superseded by: none — complements ADR-012 (RLS enforcement) as defense in depth

> Governed by the Koolerr Engineering Charter. This ADR records a domain-contract change for
> Dogfooding objective status updates. It does **not** introduce database migrations or RLS policy
> changes.

## Context

`DogfoodingService.updateObjectiveStatus` (and the repository contract behind it) previously accepted
only `(id, status, engagementRunId?)` and updated by primary key alone. Sibling reads such as
`findObjectiveById(id, organizationId)` were already organization-scoped. The in-memory repository
could overwrite another organization's objective if the id were known; the Supabase repository issued
`.update(...).eq('id', id)` without an `organization_id` predicate. Production RLS (ADR-012) may
mitigate some paths, but service-role / repository callers must not treat RLS as the sole
authorization boundary.

Phase 7.3c tests (PR #16) surfaced this gap honestly and declined to encode a false cross-org
guarantee. Architect review required a code-only contract fix before merge clearance.

## Decision

1. **`organizationId` is required** on `updateObjectiveStatus` at the service and repository
   boundaries: `(id, status, organizationId, engagementRunId?)`.
2. **Every repository implementation** must enforce the organization match:
   - Supabase: include `.eq('organization_id', organizationId)` in the UPDATE predicate (not a
     post-hoc check).
   - In-memory: reject when the objective is missing **or** belongs to a different organization
     (no cross-org overwrite).
3. **Callers** (including `infrastructure/dogfooding/pipeline.ts`) must supply `organizationId` from
   the scoped run/platform context — not invent ids.
4. **Out of scope for this decision:** new migrations, RLS policy edits, auth/session changes, or
   broadening other Dogfooding update methods that may share a similar gap
   (e.g. campaign status/details) — those require separate review.

## Consequences

- Domain contract break for `IDogfoodingService` / `IDogfoodingRepository.updateObjectiveStatus`.
- Cross-organization update attempts must not mutate the target row; tests prove same-org success and
  cross-org non-mutation.
- RLS remains defense in depth (ADR-012); application-layer scoping is mandatory regardless.
- Follow-ups may address analogous gaps on other Dogfooding update paths and may refine error codes
  (`INTERNAL_ERROR` vs `NOT_FOUND`) without changing this scoping decision.

## Alternatives considered

- **Accept residual IDOR risk** (Tower-only + RLS): rejected — application boundary must enforce
  tenant isolation.
- **Migration/RLS-only hardening:** rejected for this slice — Architect authorized code-only
  remediation; RLS changes remain Founder/architecture gated separately.
