# ADR-015: Business Brain — Intelligence Layer

**Status:** Accepted
**Date:** 2026-06-18
**Phase:** Phase 2 — Trust, Autonomy & Customer Experience
**Authors:** Engineering

---

## Context

Phase 1 of the Business Brain gave the platform structured memory storage and retrieval
via `storeMemory()`, `queryMemory()`, and `contributeMemories()`. Digital Employees could
load relevant Business Memory at the start of an Engagement Run and write new knowledge
back to the Brain afterward.

Phase 1 answered queries. It did not synthesize understanding.

FOUNDATION_001 §2.5 — Business Intelligence defines the goal:

> "Business Intelligence is the reasoning and synthesis layer of the Business Brain.
> Where Business Memory stores facts, Business Intelligence surfaces patterns, trends,
> recommendations, and insights derived from accumulated Business Memory.
> Business Intelligence improves over time as Business Memory grows.
> It is not a dashboard. It is the platform's ability to understand the business as a
> whole rather than as isolated data points."

FOUNDATION_003 §Phase 2 — Business Brain expands on this:

> "Phase 2 expands the Business Brain from structured memory retrieval to active
> Business Intelligence. This includes pattern recognition across accumulated Business
> Memory, trend identification, and the ability for the Business Brain to surface
> insights rather than merely answer queries."

---

## Decision

### Do not invoke the Model Gateway for intelligence synthesis in Phase 2.

The Model Gateway requires a Digital Employee identity, an Engagement Run, and a Trust
Engine check. Intelligence synthesis is a platform-level operation — it does not belong
to any specific Digital Employee or Engagement Run context. Forcing AI-generated insights
through the Model Gateway at this stage would:

1. Require a dummy Digital Employee identity for a platform background operation.
2. Create earned-autonomy side effects for a non-real action.
3. Block a useful capability behind Model Gateway infrastructure that is not yet necessary.

**Algorithmic synthesis is sufficient for Phase 2.** The Business Brain can derive
meaningful patterns, coverage gaps, and cross-cutting themes from the distribution and
structure of accumulated Business Memory without an AI invocation. AI synthesis is deferred
to Phase 3 (Autonomous Intelligence) when the necessary organizational context, prompt
templates, and retrieval pipelines are designed properly.

### Add two new methods to `IBusinessBrainService`:

#### `synthesizeInsights(organizationId)`

Analyzes the full set of Business Memory for an organization and returns a
`BrainIntelligenceReport` containing:

| Component            | What it detects                                                                         |
| -------------------- | --------------------------------------------------------------------------------------- |
| `pattern` insight    | Types with ≥ `PATTERN_INSIGHT_THRESHOLD` (3) entries — areas of strong coverage         |
| `gap` insight        | Types with zero entries — blind spots that limit Digital Employee effectiveness         |
| `trend` insight      | Memories spanning ≥ 3 relevance scopes — cross-cutting themes in the business knowledge |
| `MemoryTrendSummary` | Per-type counts, most documented type, total memory count, undocumented types           |

`BrainIntelligenceReport` is **ephemeral** — it is computed on demand from current memory
state and is not stored in the database. Each call reflects the current Brain.

If the Brain has no memories, an empty report is returned with no insights. There is no
value in a gap report against an empty brain.

#### `findRelatedMemories(memoryId, organizationId, limit?)`

Retrieves memories related to a given memory by relevance scope overlap. Similarity is
scored as the intersection size of the two memories' `relevanceScope` arrays. Results are
sorted by score descending, limited to `limit` (default 10), and the target memory is
excluded from results.

This allows callers (e.g., Digital Employees or future Dashboard APIs) to surface
contextually relevant memories alongside a primary finding.

---

## Repository change: `listAllMemories()`

Both new service methods require full access to an organization's Business Memory for
cross-memory analysis. The existing `queryMemories()` filters by type or relevance scope —
it is not suited to unfiltered full-load.

A new `listAllMemories(organizationId)` method is added to `IBusinessBrainRepository` to
make the intent explicit. Both `InMemoryBusinessBrainRepository` and
`SupabaseBusinessBrainRepository` implement it.

`SupabaseBusinessBrainRepository.listAllMemories()` is a single unfiltered SELECT on
`business_memories` scoped by `organization_id`. RLS enforces tenant isolation at the
database layer.

---

## Pattern threshold

`PATTERN_INSIGHT_THRESHOLD = 3` is exported as a named constant so:

- Tests can reference it without hardcoding the magic number.
- The value can be adjusted in one place as data accumulates.

Three is chosen as the minimum threshold for "this type is well-documented":

- 1 entry suggests a placeholder.
- 2 entries could be coincidental.
- 3+ entries show deliberate, multi-instance knowledge building.

---

## No new database migration

`BrainIntelligenceReport` and its insights are computed in memory and returned to the
caller. Nothing is persisted. The only schema change is the use of the existing
`business_memories` table via `listAllMemories()`, which requires no DDL change.

---

## Consequences

### Positive

- The Business Brain can now answer "how well do we know our business?" — not just "what
  do we know about brand?"
- `findRelatedMemories()` unlocks Memory Graph traversal: callers can navigate the Brain
  by relationship, not just by type.
- No new database schema, no Model Gateway invocation — Phase 2 stays focused on the
  structural intelligence layer.
- 19 new tests verify both the algorithmic logic and the tenant-isolation invariants.

### Limitations

- Insights are purely structural (count-based, scope-based). Semantic similarity, natural
  language pattern detection, and recommendation generation require Phase 3's AI synthesis
  pipeline.
- `listAllMemories()` loads the entire org's memory into process memory. For organizations
  with very large Brains, this should be replaced with server-side aggregation. This is
  acceptable for Phase 2 where Brains are small.
- Insights are not cached — each call to `synthesizeInsights()` re-loads all memories.

---

## Files Changed

| File                                                  | Change                                                                                                                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `domains/business-brain/types.ts`                     | Added `InsightType`, `BusinessInsight`, `MemoryTrendSummary`, `BrainIntelligenceReport`                                                                      |
| `domains/business-brain/repository.ts`                | Added `listAllMemories()` to `IBusinessBrainRepository`                                                                                                      |
| `domains/business-brain/in-memory-repository.ts`      | Implemented `listAllMemories()`                                                                                                                              |
| `domains/business-brain/supabase-repository.ts`       | Implemented `listAllMemories()`                                                                                                                              |
| `domains/business-brain/service.ts`                   | Exported `BusinessBrainService`; added `PATTERN_INSIGHT_THRESHOLD`; added `synthesizeInsights()` and `findRelatedMemories()` to interface and implementation |
| `domains/business-brain/service.test-helpers.ts`      | New — `makeBusinessBrainService()`, fixture factories                                                                                                        |
| `domains/business-brain/service.intelligence.test.ts` | New — 19 tests covering both methods                                                                                                                         |
| `docs/adr/ADR-015-business-brain-intelligence.md`     | This document                                                                                                                                                |
