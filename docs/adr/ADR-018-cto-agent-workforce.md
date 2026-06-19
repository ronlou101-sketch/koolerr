# ADR-018 — CTO Agent Workforce Design

**Date:** 2026-06-18
**Status:** Accepted
**Phase:** 3 — Milestone 1

---

## Context

Phase 3 designates the CTO Agent as the flagship feature. The CTO Agent must:

- Understand the full repository, roadmap, ADRs, architecture, and git history
- Generate implementation plans, code reviews, milestone reports, and launch blocker analyses
- Operate through the Trust Engine with no ability to modify production code autonomously
- Accelerate Koolerr V1 launch by producing precise, actionable engineering intelligence

This ADR records the key design decisions made to implement the CTO Agent within the existing platform architecture.

---

## Decision 1 — CTO Agent as a Workforce, not a Platform Service

**Chosen:** The CTO Agent is a standard Koolerr Workforce (`infrastructure/cto-workforce/`) with a single Digital Employee (Atlas), following the identical pattern as Content and SEO Workforces.

**Rejected:** CTO Agent as a special-purpose platform service outside the Workforce model.

**Rationale:** The Workforce pattern is proven to support zero-platform-changes for new Workforce types (established in Phase 1 ADR-010). Making CTO a special case would create a precedent for bypassing the platform model for "important" use cases — exactly the kind of architectural drift the Foundation prohibits. The Workforce pattern also gives the CTO Agent automatic Trust Engine enforcement, Engagement Run tracking, Deliverable storage, and billing integration at zero cost.

---

## Decision 2 — Business Brain as the CTO Agent's Persistent Knowledge Store

**Chosen:** Repository context (Foundation docs, ADRs, CLAUDE.md, git history, roadmap baseline) is seeded into the Business Brain as `knowledge`, `decision`, and `sop` type memories at provisioning time. At Engagement Run time, Atlas loads these memories via `listAllMemories` filtered by `relevanceScope: ['cto_agent']`.

**Rejected:**

- (A) Live file reads at run time — monolithic context, hits token limits, no searchability
- (B) Separate CTO Agent knowledge store — duplicates the Business Brain's purpose

**Rationale:** The Business Brain is the platform's designated persistent memory system. Using it for CTO context keeps all organizational knowledge in one place, makes CTO memories searchable alongside other memories, and anticipates Phase 3 M3 (cross-Workforce Brain attribution) where CTO context and customer memories will be jointly attributed. Option A would frequently exceed Anthropic's context window on large repositories. Option B would introduce an unauthorized new storage primitive without an ADR — a Foundation violation.

**Context tag:** All CTO memories carry `relevanceScope: ['cto_agent', ...]`. The executor filters by this scope to avoid loading unrelated customer memories. Future: `queryMemory` supports scope-based filtering natively; this filter can move server-side in Phase 3 M3.

---

## Decision 3 — Objective-Based Action Dispatch

**Chosen:** The executor detects the run type (plan / review / milestone / blockers) from keyword matching on the objective string, dispatches to one of four Trust-Engine-registered actions, and produces the corresponding Deliverable type.

**Rejected:** Separate API endpoints per action type.

**Rationale:** A single `executeCTOEngagementRun(ctx, workforceId, objective)` interface matches the Content/SEO executor pattern and keeps the API surface minimal. Keyword detection is deterministic and sufficient for Phase 3 M1. A model-based intent classifier could replace keyword detection in Phase 4 with zero API changes.

**Four actions and their Deliverable types:**

| Action                             | Deliverable Type      | Keywords                                           |
| ---------------------------------- | --------------------- | -------------------------------------------------- |
| `cto:generate_implementation_plan` | `implementation_plan` | plan, implement, build, how to                     |
| `cto:review_code_and_architecture` | `code_review`         | review, audit, assess, check, evaluate             |
| `cto:generate_milestone_report`    | `milestone_report`    | milestone, progress, status, readiness, launch, v1 |
| `cto:identify_launch_blockers`     | `blocker_report`      | block, risk, issue, problem, gap, debt             |

---

## Decision 4 — CTO Runs Complete Without Approval Gate

**Chosen:** CTO Engagement Runs transition directly from `running` → `completed` (skipping `awaiting_approval`). Atlas produces plans and reports — outputs that inform decisions but do not execute changes.

**Rejected:** Routing CTO Deliverables through the approval workflow.

**Rationale:** The approval gate is designed for AI-generated content that goes to customers or gets published. Implementation plans and code reviews are internal advisory documents — they are inputs to the founder's decisions, not autonomous actions. Requiring approval for an implementation plan would create friction with no safety benefit, since the plan itself executes nothing. If Phase 4 introduces autonomous code generation, that action will carry `requiresApproval: true` in its Trust Rule.

---

## Decision 5 — Context Seeder is Async and Non-Fatal at Provisioning

**Chosen:** `seedCTOContext()` is called with `.catch()` at sign-up time. If it fails (file not found, git unavailable), provisioning completes and the user can trigger a manual refresh from the CTO page.

**Rationale:** Context seeding reads the filesystem and runs a git command. In production environments these are fast, but failure should never block account creation. The CTO page shows the context memory count and exposes a "Refresh Context" form action so recovery is always one click away.

---

## Consequences

- CTO Workforce is provisioned for every new Organization (same as Content Workforce)
- Four new `DeliverableType` values: `implementation_plan`, `code_review`, `milestone_report`, `blocker_report`
- Atlas operates under `requiresApproval: false` Trust Rules — it is an advisor, not an executor
- Business Brain memories with `relevanceScope: ['cto_agent']` are the CTO Agent's persistent context
- Model used: `claude-sonnet-4-6` (quality over cost — CTO deliverables inform high-stakes decisions)
- Context is re-seedable on demand via the "Refresh Context" form action

---

## Phase 3 Forward Compatibility

- **M2 (Cross-Workforce Runs):** Atlas will become the coordinator in cross-Workforce Engagement Runs using the `parentRunId` pattern planned for Migration 013
- **M3 (Multi-Workforce Intelligence):** CTO memories will carry `workforceId` attribution once Migration 014 lands; `synthesizeInsights()` will surface per-Workforce breakdown for Atlas to read
- **Phase 4:** Atlas can be extended with `requiresApproval: true` actions (code generation, PR creation) as earned autonomy accumulates
