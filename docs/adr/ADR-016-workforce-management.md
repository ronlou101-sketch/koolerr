# ADR-016: Workforce Management — Phase 2 Milestone 5

**Status:** Accepted  
**Date:** 2026-06-18  
**Author:** Founder

---

## Context

FOUNDATION_003 §Phase 2 requires customers to be able to configure their Workforces without engineering intervention:

- Define the goals and priorities of a Workforce
- Adjust the responsibilities of Digital Employees
- Enable or disable specific Digital Employees (status toggle)

Prior to this milestone, Workforces and Digital Employees were registered at platform setup time and were read-only from the customer dashboard. Customers had no self-service path to express business goals or refine what their Digital Employees should be doing.

---

## Decision

### 1. `goals: string[]` on `Workforce`

A `goals` array (free-text strings) is added to the `Workforce` entity in `shared/types/platform.ts`. This satisfies "defining goals and priorities" without introducing a new entity type or a separate table. Goals are set at the Workforce level, not the Digital Employee level, because goals describe what the Workforce is trying to achieve, not how each employee does their job.

Existing Workforces default to `[]` (no goals defined). The DB migration adds `goals text[] NOT NULL DEFAULT '{}'`.

### 2. `updateWorkforce()` and `updateDigitalEmployee()` service methods

Both update methods follow the existing upsert-on-id pattern:

- Load the entity
- Verify tenant isolation (org ownership check)
- Apply only the fields provided (`undefined` fields are skipped via spread)
- Save via `repo.saveWorkforce` / `repo.saveDigitalEmployee` (upsert handles create + update)

This means the update path is not a distinct DB operation from the create path. The repository contract already supports this: `save*` methods upsert by ID.

### 3. URL-param-based edit state in the UI

The `/workforces` page uses `searchParams.edit` (workforce ID) and `searchParams.editEmployee` (employee ID) to track which item is in edit mode. This keeps the page as a server component — no client state, no `useState`, no hydration concerns.

When `searchParams.edit === workforce.id`, the workforce header renders an inline form instead of the read-only view. Submitting the form calls a server action that updates goals/status and redirects back (clearing `searchParams.edit`).

The same pattern applies to Digital Employee responsibilities via `searchParams.editEmployee`.

### 4. No new entity types

Goals are strings because at Phase 2 there is no need to model goal priority, ownership, or measurement. These are intentional simplifications. If goal tracking evolves (e.g., linking goals to Engagement Runs or measuring progress) that will be addressed in a later phase ADR.

---

## Alternatives Considered

**Separate `WorkforceGoal` entity:** Rejected. Adds a table, a repository method, and a domain type for no additional capability in Phase 2. Three similar fields are better than a premature abstraction.

**Client component for inline editing:** Rejected. URL-param edit state achieves the same UX with zero client-side JavaScript. The FOUNDATION preference is server components by default.

**Allowing arbitrary field updates (name, businessFunction):** Deferred. Renaming a Workforce or changing its business function is a significant action that should be gated (change history, audit logging). Phase 2 restricts editable fields to goals and status to minimize blast radius.

---

## Consequences

- Customers can express what they want each Workforce to accomplish, which will feed into Phase 3 AI-powered goal decomposition and task generation.
- The `goals` field on `Workforce` becomes a first-class platform primitive that downstream features (Orchestration Engine, Business Brain synthesizers) can read.
- All existing `registerWorkforce` call sites must now include `goals: []` in the constructed entity (done in `service.ts`).
