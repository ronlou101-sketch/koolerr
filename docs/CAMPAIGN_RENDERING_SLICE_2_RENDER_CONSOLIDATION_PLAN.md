# Campaign Rendering — Slice CR-2: Render Path Consolidation (slice plan)

> **Document type:** Slice plan (Charter §5.3; authority hierarchy position 6 — below ADRs and the
> implementation plan, above prompts).
> **Status:** Draft — awaiting Founder approval. **This document does not authorize implementation.**
> **Governing ADR:** [`docs/adr/ADR-025-campaign-rendering.md`](adr/ADR-025-campaign-rendering.md)
> §2 (Render orchestration — "render logic currently duplicated inside the two API routes is
> centralized into the Creative / Video Production department services"), §3 (Provider boundaries).
> **Parent plan:** [`docs/CAMPAIGN_RENDERING_IMPLEMENTATION_PLAN.md`](CAMPAIGN_RENDERING_IMPLEMENTATION_PLAN.md)
> — **Workstream B (consolidation)**; sequencing §9 ("Consolidation … should precede or accompany
> wiring rendering into the pipeline, to avoid creating a second render path").
> **Builds on:** Slice CR-1 — Gateway Brand-Identity Contract (`780373b`, Accepted).

> **Numbering.** This is **CR-2**, the second slice of the Campaign Rendering body of work
> (initiative "Brand Identity + Rendering", tracker §4b "Slice 2 — Campaign Rendering"). CR-labels
> (CR-1, CR-2, …) are distinct from the initiative's Slice 1–4 and the Experience Workstream's
> Slice A–E.

---

## 1. Objective

Eliminate the **duplicated render sequence** that currently lives in the two standalone render routes
(`app/api/video/heygen/generate/route.ts`, `app/api/image/higgsfield/generate/route.ts`) by extracting
it into **one authoritative render path** owned by the Creative / Video Production department services
(`domains/ai-workforce/creative`, `domains/ai-workforce/video-production`). The two routes become thin
HTTP controllers that call the shared service path.

This is a **behavior-preserving refactor** (Charter Principle 2 "One problem, one system" / Principle 3
"Single source of truth"). It creates the single place that later slices change — CR-3 (Brand
Ambassador injection) and the eventual pipeline wiring — instead of duplicating those changes across
two routes (ADR-025 §2; Implementation Plan §9).

## 2. Business rationale

ADR-025 §2 requires render logic to be centralized so there is exactly one render implementation the
routes **and** (later) the pipeline call. Today the render sequence — find the Content Marketing
workforce → trigger an engagement run → register a trust rule → invoke the Model Gateway → update run
status → store the `video`/`image` deliverable — is copied in both routes. Adding branding (CR-3),
entitlement gating (later), and pipeline rendering on top of two divergent copies would multiply cost
and risk. Consolidating first makes every subsequent Campaign Rendering slice a single-site change.

## 3. Scope (in scope)

Derived strictly from ADR-025 §2 (consolidation clause) and Implementation Plan Workstream B.

1. **Extract the shared render sequence** into the department services:
   - Video (HeyGen) render → a method on `videoProductionDepartment` (e.g. `renderSpokespersonVideo`).
   - Image (Higgsfield) render → a method on `creativeDepartment` (e.g. `renderImage`).
     Each method encapsulates: resolve the Content Marketing workforce, trigger the engagement run,
     register the trust rule, invoke the Model Gateway (provider-specific `provider` value only),
     update run status on success/failure, and store the typed deliverable — returning a `Result` with
     `{ assetUrl, deliverableId, engagementRunId }` (matching the existing `Result` pattern, ADR-004).
2. **Factor out genuinely shared sub-logic** (engagement-run trigger + trust-rule registration + run
   status update + deliverable store) into **one** internal helper reused by both department methods,
   so consolidation does not re-duplicate across the two departments (Charter Principle 2).
3. **Reduce the two routes to thin controllers**: authentication, request-body validation, the
   video-specific source resolution (fetch the `video_script` deliverable and extract `script`), call
   the department service, and map the `Result` to the existing HTTP responses (identical status codes
   and JSON shapes).
4. **Tests:** unit tests over the new department render methods / shared helper (success, gateway
   failure → run marked failed, store failure → warn-and-return path); the existing route tests
   (`route.test.ts` for both) must continue to pass **unchanged**, proving behavior preservation.

## 4. Out of scope (explicit)

These belong to later slices or other ADRs and **must not** appear in CR-2:

- **Brand Ambassador resolution or identity injection** (`resolveBrandAmbassador`, populating
  CR-1's `brandIdentity`) — Workstream F, **CR-3**. CR-2's centralized methods take **no**
  `brandIdentity` parameter; that parameter is added in CR-3 so CR-2 stays a pure, behavior-preserving
  refactor with no unused surface.
- **Wiring rendering into the campaign pipeline**, the async/idempotent/resumable render-job model, or
  emitting `video_script`/image-prompt deliverables from the pipeline — ADR-025 §2/§5, later slices.
- **Entitlement gating** (`spokesperson_video`) and any usage-metering change — Workstream D, later.
- **Report-renderer fix** — Workstream E, later.
- **Any change to the Model Gateway contract or adapters** (CR-1 is complete and frozen for CR-2).
- **Any new store, table, migration, domain, provider, or rendering subsystem.**
- **Any change to HTTP contracts** of the two routes (status codes, request/response JSON) — CR-2 is
  behavior-preserving; the route tests must pass unchanged.

## 5. Dependencies

- **CR-1 — Gateway Brand-Identity Contract** (`780373b`, Accepted): no direct code dependency in CR-2
  (CR-2 does not pass `brandIdentity`), but CR-2 shapes the centralized path so CR-3 can add it in one
  place.
- **Brand Identity Slice 1 — Brand Ambassador Foundation** (`f801175`): not required by CR-2 (no
  ambassador resolution here); it becomes a dependency at CR-3.
- Existing domains and their public interfaces — reused, not modified: `workforceEngineService`
  (trigger/update runs), `deliverablesService` (store/get deliverables), `modelGateway`, `trustEngine`,
  `env.platform.tenantId()`. `domains/ai-workforce` already depends on `workforce-engine` and
  `deliverables` via their public interfaces in `pipeline.ts` — CR-2 follows that established pattern
  (no new cross-domain coupling type).

## 6. Architectural invariants (must be preserved)

From ADR-025 and the Charter. Violating any one fails Charter §6 (item 2):

1. **One authoritative render path** — after CR-2 there is a single render implementation; the routes
   contain no copy of it (ADR-025 §2; Charter Principles 2/3). This is the slice's core deliverable.
2. **Behavior preserved** — identical HTTP status codes, response JSON, engagement-run lifecycle,
   trust-rule registration, and stored-deliverable shape; the existing route tests pass unchanged
   (Charter Principle 6 — extend/refactor without changing behavior).
3. **No provider-specific code outside the Model Gateway** — the department services select a `provider`
   value and call `modelGateway.invoke`; they import **no** provider SDK (ADR-025 §3; Charter
   Principle 7).
4. **Domain boundaries respected** — the department services use only the **public interfaces** of
   `workforce-engine` and `deliverables`; no reaching into another domain's internals (Charter
   Principle 7).
5. **Reuse the existing `deliverables` store and types** — no new store, no schema change (ADR-025 §6).
6. **Additive/reversible** — the refactor is revertible in one commit with no data or schema impact
   (Charter Principle 9).

## 7. Acceptance criteria

CR-2 is complete when all of the following hold (each independently verifiable):

- **AC1 — Single path:** the HeyGen and Higgsfield render sequences exist **only** in the department
  services (+ the shared internal helper); neither route contains the trigger-run / trust-rule /
  gateway-invoke / store sequence anymore.
- **AC2 — Thin controllers:** each route only authenticates, validates input, resolves the
  video-specific source (video route), calls the department service, and maps the `Result` to HTTP.
- **AC3 — Behavior preserved:** both routes return the same status codes and JSON as before for
  success, not-found, validation, gateway-failure, and store-failure cases; the existing
  `route.test.ts` suites pass **without modification**.
- **AC4 — No duplication across departments:** the shared engagement-run/trust-rule/store logic is
  implemented once and reused by both department methods.
- **AC5 — Boundary integrity:** the department services import no provider SDK and access other domains
  only through their public interfaces.
- **AC6 — Tests + gates:** new service/helper unit tests cover success and both failure paths; `tsc`,
  the full test suite, and the production build pass.

## 8. Risks

- **Refactor regression (subtle behavior drift).** _Mitigation:_ the existing route tests are the
  behavior contract and must pass unchanged (AC3); new service tests add coverage at the new seam.
- **Over-abstraction.** Two providers with differing source/deliverable shapes could invite a leaky
  generic. _Mitigation:_ keep the shared helper to the genuinely identical sub-logic (run + trust +
  store); keep provider/source/deliverable specifics in the respective department method (Charter
  Principle 11 — simplicity over cleverness).
- **Trust-rule registration side effect.** Both routes register a `TrustRule` per request; CR-2 moves
  this verbatim into the service and does **not** change it (any improvement is out of scope).
- **Unverified at planning time** (Charter Principles 15/16): exact current department-service method
  signatures will be confirmed against the code during implementation; this plan does not assume them.

## 9. Rollback strategy

- CR-2 is a single-commit, behavior-preserving refactor with **no** schema, data, or API-contract
  change. Rollback is reverting the commit; because HTTP behavior is unchanged and no migration is
  introduced, revert restores the prior structure with zero customer impact.
- No feature flag required (no observable behavior change to gate).

## 10. Validation plan

Evidence gathered in Charter §6.9 Evidence-Hierarchy order (highest available first):

1. **Automated tests** — existing route tests pass unchanged (behavior preservation); new
   service/helper unit tests for success + gateway-failure + store-failure; full `npx vitest run` green.
2. **Static analysis** — `npx tsc --noEmit` clean; confirm no provider SDK import in the department
   services and no cross-domain internal access.
3. **Production build** — `npm run build` succeeds.
4. **Code inspection** — confirm the render sequence is absent from both routes and present once in the
   services (AC1/AC4).
5. **Preview deployment** — deploy to Preview; exercise both standalone endpoints and confirm
   unchanged responses (this slice _can_ be runtime-verified because the endpoints already exist and
   their behavior is preserved — unlike CR-1).

## 11. ADR impact

- **None.** CR-2 implements the consolidation ADR-025 §2 already mandated; it introduces **no** new
  architectural decision and requires **no** ADR change. ADR-024 and ADR-025 are untouched.

## 12. Documentation impact

On completion (a later step, at acceptance — not part of this draft): update
`docs/CAMPAIGN_RENDERING_IMPLEMENTATION_PLAN.md` sequencing notes, the tracker
(`docs/KOOLERR_MASTER_TRACKER.md` §4b), and `docs/status.json`, per Charter DoD item 7 and the
CLAUDE.md Tracker Workflow. No documentation is committed by this draft.

## 13. Estimated completion conditions

CR-2 is done when: AC1–AC6 pass; `tsc`, the full test suite, and the production build are clean; the
existing route tests pass unchanged; Preview confirms unchanged endpoint behavior; and the CTO
certifies the Definition of Done (Charter §6). Only then, and only with Founder approval, may CR-3
(Brand Ambassador injection) begin (Charter §5.4).

## 14. Governance & next step

Per Charter §4.1 step 7 and §4.2, **implementation may not begin until the Founder approves this slice
plan.** This document is a draft for review; it changes no source code, no ADRs, and no other
documentation, and it does not begin the slice. Subsequent slices (CR-3 Brand Ambassador injection,
entitlement gating, pipeline render wiring, report-renderer fix) are **not** drafted here and will be
produced one at a time, after CR-2 is formally accepted.
