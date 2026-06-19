# ADR-020: Business Brain Multi-Workforce Intelligence

**Status:** Accepted  
**Date:** 2026-06-18  
**Phase:** 3 Milestone 3  
**Author:** Atlas (CTO Agent) via executeCTOEngagementRun

---

## Context

Phase 3 Milestone 3 extends the Business Brain with Workforce-level attribution. As Atlas orchestrates work across multiple Workforces, the insights and decisions produced by each Workforce must be attributable to their source. This enables:

1. Cross-Workforce synthesis — Atlas can reason about what each Workforce has learned and identify patterns across the full platform
2. V1 Readiness Reports — a structured synthesis of all knowledge sources (CTO context, per-Workforce learnings, platform state) into an actionable launch readiness score
3. Future Mission Control — the `workforceId` on memories is the foundational attribution layer Mission Control will use to display per-Workforce contribution metrics

Additionally, a new `cto:assess_v1_readiness` action was added, producing `v1_readiness_report` deliverables that serve as the primary launch-planning artifact for Koolerr V1.

---

## Decision 1: `workforce_id` as a nullable FK on `business_memories`

A nullable `workforce_id uuid REFERENCES workforces(id)` column was added to the `business_memories` table.

**Null means platform-global.** Memories seeded from Foundation documents, CLAUDE.md, ADRs, and git history are not attributed to any single Workforce — they represent platform-level knowledge. Only memories produced during Engagement Runs carry a `workforceId`.

**Non-null means Workforce-specific.** Memories contributed via `contributeMemories()` now accept an optional `workforceId` field. The CTO executor passes `workforceId` explicitly, attributing every CTO decision to the CTO Workforce.

**Alternatives considered:**

- **Separate `workforce_memories` join table** — rejected: the attribution is a property of the memory, not a many-to-many relationship. A nullable FK is the correct model.
- **`relevanceScope` string like `"workforce:wf_xxx"`** — rejected: opaque, not indexable, loses referential integrity.

---

## Decision 2: `listMemoriesByWorkforce` on the repository interface

A new repository method returns all memories attributed to a specific Workforce within an organization. Both the Supabase repository (via indexed `eq('workforce_id')` query) and the in-memory repository implement this method.

The method is scoped by both `workforceId` AND `organizationId` to enforce tenant isolation — a caller cannot retrieve memories from a Workforce in a different Organization.

---

## Decision 3: Cross-Workforce intelligence injected into V1 readiness context

For `v1_readiness_report` runs, the executor loads per-Workforce memory counts via `listMemoriesByWorkforce` and appends a `## Cross-Workforce Intelligence` section to Atlas's system prompt context. This gives Atlas a holistic view of what each Workforce has learned before it generates the readiness assessment.

This is a V1 Readiness-specific enhancement. Other run types (implementation plans, code reviews) do not incur the additional `listWorkforces` + N×`listMemoriesByWorkforce` calls.

---

## Decision 4: `v1_readiness_report` as a first-class DeliverableType

The V1 Readiness Report is the flagship output of M3 and the primary artifact driving launch planning. A dedicated deliverable type gives it:

- Filtering in the CTO dashboard (latest report surfaced prominently)
- Distinct routing in Mission Control (Phase 4)
- Clear differentiation from milestone_reports (which track individual milestone completion)

The V1 Readiness Report includes: overall readiness %, phase status per milestone, critical/major blockers, recommended execution order, platform integration priorities, cross-workforce intelligence, and estimated timeline to launch.

---

## Decision 5: V1 Readiness Report keyword priority over milestone detection

The `detectRunType()` function in the executor uses keyword matching. `v1_readiness_report` detection was placed BEFORE `milestone_report` detection because objectives like "Generate a V1 launch readiness report" previously matched the milestone branch. The more specific keyword set (`readiness report`, `v1 readiness`, `launch readiness`, `assess readiness`, `overall readiness`) takes priority.

---

## Consequences

**Positive:**

- Atlas can now reason across all Workforces — a foundational capability for Mission Control
- V1 Readiness Reports create a permanent, versioned record of launch readiness at each assessment point
- Per-Workforce memory counts give Atlas quantitative signal about which Workforces are well-instrumented vs. under-contributing to the Brain
- The `workforceId` attribution is the data layer that Revenue Dashboard and Mission Control will consume in Phase 4

**Negative / Trade-offs:**

- V1 readiness runs incur N+1 Brain queries (one per Workforce). At Phase 3 scale (2–3 Workforces) this is negligible. Phase 4 should add a single aggregate query.
- `workforce_id` is nullable — callers must handle both attributed and unattributed memories when doing cross-cutting analysis.

---

## Forward Compatibility

- Phase 4 Revenue Dashboard: query `business_memories WHERE workforce_id = X` to surface per-Workforce contribution metrics
- Phase 4 Mission Control: display real-time per-Workforce Brain growth using `listMemoriesByWorkforce`
- Phase 4 Platform Integrations: when Lovable/Supabase/HeyGen Workforces are provisioned, their Engagement Run outputs will be attributed to their respective `workforceId`
