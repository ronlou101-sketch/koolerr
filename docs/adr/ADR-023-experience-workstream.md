# ADR-023 — Experience Workstream (parallel to the Launch Roadmap)

- **Status:** Accepted
- **Date:** 2026-07-29
- **Deciders:** Founder (ronlou101), CTO Agent session
- **Supersedes / amends:** None (additive to `FOUNDATION_003_DEVELOPMENT_ROADMAP.md`)

## Context

Two independent phase-numbering schemes were being used at once and had begun to collide:

1. **Launch Roadmap (Foundation numbering, Phases 7–12)** — the strategic delivery sequence in
   `Foundation/FOUNDATION_003_DEVELOPMENT_ROADMAP.md` and `docs/KOOLERR_MASTER_TRACKER.md`:
   Phase 7 Launch Readiness ✅ · 8 Final Product Validation ✅ · 9 Koolerr Academy ✅ ·
   10 Private Beta 🔄 · **11 Public Launch** · **12 Scale & Optimization**.

2. **Experience Workstream (started 2026-07-25)** — a North-Star-driven UI/UX simplification and
   customer-experience redesign track that reused the labels **Phase 11 → 12 → 13**. This is the
   track actually shipped in recent work: git tag `phase-12.2-complete`, commits "Phase 12.3…",
   and `docs/status.json` entry "Phase 13 Slice A". Its phases:
   - **Phase 11 — UX Navigation / IA** ✅ (5 primary + More + ⌘ Owner nav)
   - **Phase 12 — Language & Dashboard** ✅ (customer language sweep; morning-briefing dashboard;
     conversational campaign creation)
   - **Phase 13 — Experience Redesign** 🔄 (unify/consolidate customer surfaces; Slice A shipped)

The collision: "Phase 11" and "Phase 12" meant two different things depending on which document
you read, and `docs/status.json` was internally inconsistent (its `current` list used Experience
numbering while its `remaining` list used Launch numbering). This is a documentation-consistency
defect, not an architecture change.

## Decision

Keep the two tracks **separate and both intact**. Specifically:

- The **Launch Roadmap keeps its numbering unchanged** — Phase 11 remains _Public Launch_ and
  Phase 12 remains _Scale & Optimization_. Nothing is renumbered.
- The **Experience Workstream is documented as a distinct, parallel track** with its own internal
  phase axis (its Phase 11 / 12 / 13), governed by the North Star constitution. It runs in parallel
  with Private Beta (Launch Phase 10); it is not a stage of the Launch Roadmap.
- **Disambiguation convention:** the bare label "Phase N" is ambiguous across the two tracks. In
  any document where both tracks appear, always qualify: **"Launch Phase 11"** vs
  **"Experience Phase 13"**. When context is a single track, the bare number is fine.
- **`docs/status.json` is the single source of truth for _current status_** (see ADR consequence
  below). `KOOLERR_MASTER_TRACKER.md` remains authoritative for the locked roadmap, locked
  decisions, and the append-only verified history. `FOUNDATION_003` remains the permanent
  strategic roadmap and now documents the Experience Workstream alongside the Launch phases.

## Alternatives considered

- **Renumber Launch Public Launch/Scale to 14/15 and let the Experience track own 11–13.** Rejected:
  permanently rewrites the strategic launch phases in a constitution-tier document for a naming
  convenience.
- **Refold the Experience work into Phase 10.x sub-phases.** Rejected: contradicts already-shipped
  git tags (`phase-12.2-complete`) and commit history, creating a worse inconsistency.

## Consequences

- **Positive:** no git history / tag rewrites; both roadmaps preserved; one authoritative place for
  live status; the numbering collision is resolved by explicit qualification rather than renumbering.
- **Cost:** readers must qualify "Phase N" with the track name when both are in view. This ADR and
  the disambiguation banners in each roadmap document carry that convention.
- **Governance:** the Experience Workstream is bound by the North Star constitution
  (Trust · Simplicity · Confidence · Progress · Results, and _every feature must reduce customer
  effort_). Slices that add complexity without adding customer confidence are not built.
