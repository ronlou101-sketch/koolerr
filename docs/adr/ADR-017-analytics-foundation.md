# ADR-017: Analytics Foundation Layer — Phase 2 Milestone 6

**Status:** Accepted  
**Date:** 2026-06-18  
**Author:** Founder

---

## Context

FOUNDATION_003 §Phase 2 — Analytics Foundation Layer requires the platform to answer: "Is my Workforce working?" It specifies:

- Engagement Run counts (completed, how many produced Deliverables)
- Deliverable counts by type and status
- Business Memory additions over time

Advanced analytics (ROI, benchmarking, cross-workforce comparison) are explicitly scoped to Phase 3.

The challenge is that all the data needed for analytics already exists across three separate domain services: workforce-engine (runs), deliverables (deliverables), and business-brain (memories). The question is where aggregation lives and whether any new storage is needed.

---

## Decision

### 1. No new storage — analytics is computed on demand

The `OrganizationAnalyticsReport` is computed from existing domain records and discarded after each request. Domain records are already the authoritative source of truth; duplicating them into an analytics store in Phase 2 would create a synchronization problem with no corresponding benefit.

Phase 3 may introduce time-series analytics tables. Phase 2 does not need them.

### 2. Pure computation function in `shared/analytics/`

The computation logic is a pure function in `shared/analytics/service.ts`:

```typescript
computeOrganizationReport(
  organizationId: OrganizationId,
  runs: EngagementRun[],
  deliverables: Deliverable[],
  memories: BusinessMemory[]
): OrganizationAnalyticsReport
```

This function has no I/O, no side effects, and depends only on `@/shared/types`. It is fully testable without mocking any domain service. The page layer handles data fetching.

### 3. `listAllMemories()` added to `IBusinessBrainService`

The analytics report needs the full memory corpus (not a filtered page) to compute accurate `byType` breakdowns. `listAllMemories()` already existed on `IBusinessBrainRepository` (added in Milestone 3 for `synthesizeInsights`). This ADR promotes it to the public service interface, making it available to other callers without reaching into the repository directly.

### 4. Data fetching in the page via `Promise.all`

The analytics page fetches from three domain services in parallel:

- `workforceEngineService.listEngagementRuns(orgId)`
- `deliverablesService.listDeliverables({organizationId: orgId})`
- `businessBrainService.listAllMemories(orgId)`

This follows the same pattern as `dashboard/page.tsx` and avoids introducing a cross-domain service that would create a `shared/ → domains/` import dependency.

### 5. Success rate definition

`successRate = completed / (completed + failed)`. Null when no terminal runs exist. This avoids a misleading "0%" for organizations that have only pending or running runs.

---

## Alternatives Considered

**Cross-domain AnalyticsService:** Rejected. A service singleton in `shared/analytics/` that imports domain service singletons creates a `shared/ → domains/` import direction not present elsewhere in the codebase, and adds no benefit over the page fetching directly — both call the same service singletons.

**Materialized analytics tables:** Rejected for Phase 2. The overhead of keeping them synchronized with domain writes (via events or triggers) is disproportionate to the simple counts Phase 2 requires.

**Re-using `synthesizeInsights()` for brain analytics:** Possible (it returns `MemoryTrendSummary`), but it couples analytics to Intelligence Layer code. Calling `listAllMemories()` and computing counts independently keeps the two concerns separate.

---

## Consequences

- Any caller that implements `IBusinessBrainService` must now implement `listAllMemories()`. The Supabase repository already has this method (since Milestone 3).
- Phase 3 analytics can extend this foundation without removing it — time-series data would be an additive layer on top.
- The `shared/analytics/` module has no domain imports and can be tested as a pure unit.
