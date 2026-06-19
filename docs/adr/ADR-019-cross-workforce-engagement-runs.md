# ADR-019: Cross-Workforce Engagement Runs via parentRunId

**Status:** Accepted  
**Date:** 2026-06-18  
**Phase:** 3 Milestone 2  
**Author:** Atlas (CTO Agent) via executeCTOEngagementRun

---

## Context

Phase 3 Milestone 2 introduces the ability for the CTO Workforce to coordinate work across multiple Workforces in a single objective. When Atlas generates a Coordination Brief, it may spawn child runs in other Workforces (Content, SEO, etc.) as follow-through. We need a way to represent this parent-child relationship in the data model without creating a separate orchestration table.

Additionally, GitHub issue creation was introduced as the first live platform integration — Atlas can now emit real GitHub issues from `## GitHub` sections in coordination briefs.

---

## Decision 1: Nullable self-FK on `engagement_runs` for lineage tracking

A nullable `parent_run_id` foreign-key column was added to the `engagement_runs` table:

```sql
ALTER TABLE engagement_runs
  ADD COLUMN IF NOT EXISTS parent_run_id uuid REFERENCES engagement_runs(id);
```

**Alternatives considered:**

- **Separate `orchestration_runs` join table** — a dedicated table with `parent_run_id` and `child_run_id`. Rejected: adds schema complexity for a relationship that is expressible as a single FK. Would require join queries that don't add clarity.
- **`metadata` JSON column with parent reference** — ad-hoc reference embedded in a JSON blob. Rejected: loses referential integrity and is unqueryable with foreign-key constraints.

**Why self-FK:** `EngagementRun` is already the atomic unit of work in the Workforce Engine. A single nullable FK allows full lineage traversal (parent → children) via a single indexed column, preserves referential integrity via the database, and requires no schema migration if the depth of nesting increases.

**Invariants:**

- `parent_run_id` is set only on child runs spawned by a coordinating parent.
- A child run has the same `organization_id` as its parent (cross-org coordination is forbidden).
- The platform does not enforce a maximum depth on the lineage chain; Atlas is expected to spawn only one level of children in Phase 3.

---

## Decision 2: `parentRunId` propagated through `EngagementRunTrigger`

`EngagementRunTrigger` (the input type for `workforceEngineService.triggerEngagementRun`) was extended with an optional `parentRunId` field. The service passes it through to the stored `EngagementRun` entity unchanged.

This keeps the parent-child relationship as a domain concept in the Workforce Engine rather than infrastructure-only. Callers that don't need it simply omit the field.

---

## Decision 3: GitHub issue creation is non-fatal and scoped to `coordination_brief` deliverables

When Atlas produces a `coordination_brief` deliverable, the executor extracts the `## GitHub` section from the markdown output and calls `createGitHubIssue`. If the call fails (missing token, network error, GitHub API error), the failure is logged and the deliverable is stored without the GitHub link. The run never fails due to GitHub.

**Why non-fatal:** GitHub integration is additive in Phase 3. The primary artifact is the `coordination_brief` Deliverable. The GitHub issue is a convenience side-effect. Making it fatal would block Atlas operations when GitHub credentials aren't configured (e.g., local development).

**Scope:** Only `## GitHub` sections in coordination briefs produce real issues. Other platform sections (`## Lovable`, `## Supabase`, etc.) are human-executed from the brief content. Phase 4 will add live integrations for those platforms.

---

## Decision 4: GitHub credentials via environment variables only

`GITHUB_TOKEN`, `GITHUB_REPO_OWNER`, and `GITHUB_REPO_NAME` are read exclusively from `process.env`. No fallback to any credentials store, no prompting, no hardcoded values in code. If `GITHUB_TOKEN` is absent, the integration silently skips issue creation.

This is consistent with FOUNDATION_002 §Secrets and the CLAUDE.md non-negotiable: **Never commit secrets, credentials, or API keys to version control.**

---

## Consequences

**Positive:**

- Coordination briefs now have a live integration path — Atlas actions have real-world effects via GitHub issues.
- Run lineage is fully traceable in the database via a single FK chain.
- The GitHub integration is a template for future platform integrations (Lovable, Supabase, HeyGen, ElevenLabs in Phase 4).

**Negative / Trade-offs:**

- `extractGitHubSection` relies on markdown structure (`## GitHub` heading) in Atlas output. Prompt changes could break this extraction; it should be monitored.
- Self-FK does not enforce maximum depth. A misconfigured orchestration loop could create unbounded chain depth. This is a Phase 4 concern.

---

## Forward Compatibility

- Phase 3 M3: Business Brain memories will gain `workforce_id` scoping. The `parent_run_id` lineage will be used to attribute child-run insights to the parent workforce.
- Phase 4: `createGitHubIssue` will be extended to `updateGitHubIssue` and `closeGitHubIssue`. The same non-fatal pattern applies.
- Phase 4: Lovable, Supabase, HeyGen, ElevenLabs integrations will follow the same pattern as the GitHub integration module (`shared/integrations/<platform>/index.ts`).
