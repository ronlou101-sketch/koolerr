# ADR-006: Content Workforce MVP — Architecture Decisions

**Status:** Accepted  
**Phase:** 13 — Content Workforce MVP  
**Date:** 2026-06-18

---

## Context

Phase 13 delivers the first end-to-end Engagement Run: a Content Workforce (Content Strategist, Copywriter, Editor) receives an objective, produces a blog post via the Model Gateway, stores it as a Deliverable, and presents it to the customer for approval or rejection.

Several architectural decisions were made to achieve this milestone within the Phase 1 constraints.

---

## Decisions

### 1. Cross-domain execution lives in `infrastructure/`

**Decision:** The engagement run executor (`infrastructure/content-workforce/executor.ts`) is the only place that imports from multiple domains (workforce-engine, business-brain, deliverables) within a single file.

**Rationale:** The Foundation prohibits domains from importing each other directly (`§3 — Domain Boundaries`). The `infrastructure/` layer is explicitly designated as the composition root, where cross-cutting concerns that require multiple domains are permitted. This follows the same pattern established by `infrastructure/auth/provision.ts` in Phase 12.

**Alternative rejected:** Extending the workforce-engine service to directly call deliverables and business-brain services. This would violate domain boundaries and turn workforce-engine into a god object.

---

### 2. Trust rules are re-registered on every executor invocation

**Decision:** `registerContentTrustRules()` is called at the start of every `executeContentEngagementRun()` call, in addition to being called during account provisioning.

**Rationale:** The Trust Engine is an in-memory singleton (Phase 1 stub). Its state does not survive process restarts. Without re-registration, any run after a server restart would fail with "No trust rule registered" — the Trust Engine's default-deny behaviour.

The `registerContentTrustRules()` function uses `rulesFor()` to skip already-registered actions (idempotent), so calling it on every run is safe and adds negligible overhead.

**Path to production:** The Phase 2 Trust Engine implementation will persist rules to Supabase and load them at bootstrap from the DB. At that point, the re-registration call in the executor can be removed.

---

### 3. Anthropic adapter registered conditionally at bootstrap

**Decision:** `bootstrapPlatform()` registers the Anthropic adapter only when `ANTHROPIC_API_KEY` is present. Missing key produces a warning, not an error.

**Rationale:** The server must start cleanly in environments where the API key is not yet configured (CI, local dev without AI, review environments). The warning is sufficient for operators to diagnose "why isn't my run working." A missing key that is required at runtime (when the gateway is invoked) will throw a clear error from the Model Gateway itself.

---

### 4. Content Workforce provisioned per-organization during account creation

**Decision:** `provisionContentWorkforce()` is called from `provisionPlatformAccount()`. Every new Organization gets a Content Workforce with 3 named Digital Employees (Alex/Strategist, Jordan/Copywriter, Sam/Editor) automatically.

**Rationale:** Trust Engine rules must be scoped to specific `DigitalEmployeeId` values, which are generated at creation time. Since the Trust Engine (Phase 1) is in-memory, rules must be registered against entity IDs that are stored in the DB. Creating the Workforce during provisioning ties entity creation to ID capture and rule registration in one transactional sequence.

**Alternative rejected:** Creating the Content Workforce lazily on first run. This would require idempotency logic on every run trigger and would complicate the executor significantly.

---

### 5. `systemContext` added to `GatewayRequest`

**Decision:** An optional `systemContext?: string` field was added to `GatewayRequest` and threaded through to `NormalizedModelRequest`.

**Rationale:** The Content Workforce needs to give each Digital Employee a distinct role persona (e.g., "You are the Content Strategist") and inject Business Brain context as a system prompt, separate from the user turn. Concatenating system context into the user prompt works but pollutes the conversation structure.

This is a backward-compatible additive change — no existing callers are affected.

---

### 6. `listEngagementRuns` added to the Workforce Engine service

**Decision:** `listEngagementRuns(organizationId)` was added to `IWorkforceEngineService`, `IWorkforceEngineRepository`, and both repository implementations.

**Rationale:** The runs UI page requires listing runs per organization. This is a natural read operation for the workforce-engine domain (which owns `EngagementRun`). The addition follows the exact same pattern as the existing `listWorkforces` and `listDigitalEmployees` operations.

---

### 7. Engagement Run execution is synchronous (HTTP blocking)

**Decision:** The `POST /api/runs` route blocks until the entire 3-step workflow completes and returns the deliverable ID to the client.

**Rationale:** For a Phase 1 MVP with a single customer, synchronous execution is the simplest approach. A content run with 3 Haiku invocations completes in approximately 15–45 seconds. This is acceptable for a demo where the customer is watching the UI.

**Path to production:** Phase 2 will introduce async run execution with polling or webhooks. The executor is already structured as a standalone async function, so wrapping it in a queue worker requires no changes to the executor itself.

---

## Known Limitations

- **Trust rules lost on server restart:** Mitigated by re-registration in the executor. Full fix requires persisting rules to Supabase (Phase 2).
- **Single workforce type:** Only a Content Workforce (blog posts) is implemented. Additional workforce templates are Phase 2 scope.
- **No deliverable history on the run record:** `EngagementRun.deliverableIds` is populated as an empty array and never updated. The UI navigates directly to the deliverable ID returned by the API. Full linkage requires a `linkDeliverableToRun` operation (Phase 2).
- **`GatewayRequest.model` hardcodes Haiku:** Model selection is hardcoded to `claude-haiku-4-5-20251001` in the executor. Phase 2 will allow per-workforce model configuration via Business Brain or Trust Rule metadata.
