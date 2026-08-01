# Campaign Rendering — Implementation Plan (architecture level)

> **Document type:** Implementation plan (Charter §4.1 step 4; authority hierarchy position 6 —
> below ADRs, above slice plans and prompts).
> **Status:** Approved for documentation (CTO approved). Documentation-only artifact.
> **Governing ADR:** [`docs/adr/ADR-025-campaign-rendering.md`](adr/ADR-025-campaign-rendering.md)
> (Accepted). References [`docs/adr/ADR-024-brand-ambassador.md`](adr/ADR-024-brand-ambassador.md)
> (Accepted), which remains authoritative for the Brand Ambassador identity model.
> **Initiative:** Brand Identity + Rendering · **Slice 2 — Campaign Rendering** (see
> `docs/KOOLERR_MASTER_TRACKER.md` §4b and `docs/PHASE_13_EXPERIENCE_WORKSTREAM.md`).

> **Standing of this document.** This plan records the **architecture-level** implementation
> approach for Campaign Rendering. It introduces **no** new architectural decisions — every
> boundary, contract, and invariant it references is fixed by ADR-025. Per Charter §7.2 an Accepted
> ADR is binding, but dependent implementation still proceeds only through the Charter's approved-plan
> and mandatory gates (§4.2). **This document is not a slice plan and does not authorize
> implementation.** Slice decomposition (Charter §5.3) and Founder approval (§4.1 step 7) are
> required before any code is written.

---

## 1. Objective

Wire the **existing** render capability (Model Gateway + HeyGen/Higgsfield adapters + Deliverables
domain) into the campaign flow so that a completed customer campaign produces **real, branded media**
instead of a single blank text report — **additively**, **provider-agnostically**, and branded by
the organization's Brand Ambassador (ADR-024).

This closes the Private Beta blocker identified by the CTO Read-Only Investigation (2026-07-31) and
recorded in ADR-025 §Context: BUILD/GROW/SCALE advertise AI spokesperson videos, yet the pipeline
today persists only one `type:'report'` deliverable and invokes no media adapter.

## 2. Business rationale

Completed campaigns must deliver the spokesperson videos and images the plans advertise. The
capability already exists on the platform; the gap is integration, branding, entitlement gating, and
a corrected report renderer — not new subsystems. Reuse over rebuild (Charter Principles 4–5) keeps
the change small, reversible, and vendor-independent.

## 3. Scope (architecture level, from ADR-025)

This plan covers exactly the architecture ADR-025 defines, organized into the workstreams below.
It does **not** restate the ADR; it maps the ADR's boundaries onto an implementation approach so the
work can later be decomposed into slices. Each workstream traces to the numbered section of ADR-025
it realizes.

### Workstream A — Gateway identity injection (ADR-025 §1)

- Extend the Model Gateway request contract (`GatewayRequest`, `NormalizedModelRequest`) and the
  `IModelProviderAdapter` interface with an **optional, backward-compatible** brand-identity payload
  (resolved provider references, reference image URLs, deterministic seed).
- Absent the payload, behavior is unchanged — existing text calls are unaffected.
- The provider-agnostic → concrete-provider mapping is resolved **at the gateway boundary**; no
  provider-specific type crosses out of the gateway module. Adapters consume only the fields relevant
  to them and fall back to env defaults when a field is absent.

### Workstream B — Render orchestration & consolidation (ADR-025 §2, §5)

- Campaign completion emits **real deliverables** (video scripts, image prompts) from the existing
  Creative / Video Production briefs.
- The render logic currently **duplicated** inside the two standalone API routes is **centralized**
  into the Creative / Video Production department services (one authoritative implementation — Charter
  Principles 2/5). Routes and pipeline call the same path. No new rendering subsystem.
- Rendering is **decoupled from the synchronous pipeline**: each asset is an independent, idempotent,
  resumable render job, driven asynchronously, durably tracked (keyed to engagement run / source
  deliverable), with bounded concurrency and a bounded number of assets per campaign.

### Workstream C — Provider abstraction boundaries (ADR-025 §3)

- Reaffirm Charter Principle 7: **no provider-specific code outside the Model Gateway.** Pipeline,
  department services, and Business Brain see only normalized types and the provider-agnostic
  identity; adapters translate. The Business Brain stores identity and provider references but imports
  no provider SDK (consistent with ADR-024).

### Workstream D — Entitlement enforcement (ADR-025 §4)

- Gate spokesperson **video** renders on `billingService.checkEntitlement('spokesperson_video')`
  (BUILD 5 / GROW 30 / SCALE 100 / unpaid 0) **before** dispatch; over-limit requests are rejected
  with a clear, non-spending error. Successful renders call `recordUsageEvent` (metering), matching
  the existing engagement_run / model_invocation pattern.
- **Boundary (ADR-025 §4):** this plan gates only spokesperson **video** via `spokesperson_video`.
  It does **not** define an image-render entitlement; none exists in governance and this plan does not
  invent one. Image renders remain bounded by the media-generation bound (Workstream B) and existing
  usage entitlements.

### Workstream E — Deliverable lifecycle & report-renderer fix (ADR-025 §6)

- Reuse the existing `deliverables` store and types (no new store). Campaign completion writes
  `video_script` and image-prompt deliverables; renders write `video`/`image` deliverables carrying
  the hosted asset URL (`content.videoUrl` / `content.imageUrl`) and links to source
  (`scriptDeliverableId` / `creativeId`) and `engagementRunId`.
- Rendered deliverables flow through the existing status lifecycle
  (`draft → pending_review → approved → published`) and surface in the Deliverables page and the
  unified Review queue.
- The retained campaign **summary/report** deliverable's renderer is **corrected** so it is no longer
  blank (it currently reads `body`/`contentBrief`/`draft`, which `DeliveryPackage` does not contain).

### Workstream F — Brand Ambassador integration (ADR-025 §7)

- Every render resolves the org's ambassador via `resolveBrandAmbassador(orgId)` and injects its
  identity into the gateway request (Workstream A), so all campaign media is consistent and branded
  with the org's single spokesperson. If no ambassador is found, the render falls back to the platform
  env default and logs. No new identity storage is introduced.

## 4. Out of scope (architecture level)

- **No new rendering subsystem or domain** — extend Model Gateway + adapters + Deliverables (ADR-025
  §2, Alternatives).
- **No image-render entitlement** — not established by governance (ADR-025 §4).
- **No durable object-storage persistence of rendered assets** — provider-hosted-URL longevity is an
  explicitly separate architectural concern outside ADR-025's scope (ADR-025 §6). If pursued, it
  requires its own ADR.
- **No synchronous multi-asset rendering** — prohibited by the `maxDuration` invariant (ADR-025 §5).
- **No changes to the Brand Ambassador identity model** — ADR-024 is immutable and authoritative.
- **No selection of a specific async render-drive mechanism at the ADR level** — ADR-025 §5 fixes the
  invariants but not the mechanism; the mechanism is an implementation decision to be made within
  those invariants during slice planning, and must preserve them.

## 5. Architectural invariants to preserve (from ADR-025)

Any implementation must preserve all of the following; violating any one fails Charter §6
(Definition of Done, item 2 — architectural integrity):

1. New gateway/adapter identity fields are **optional and backward-compatible**; existing text calls
   are unaffected (§1).
2. **No provider-specific type leaves the Model Gateway module** (§3; Charter Principle 7).
3. One authoritative render path — no duplicated render logic, no new store, no new subsystem (§2, §6;
   Charter Principles 2/3/5).
4. Every render is **asynchronous, per-asset, idempotent, resumable, durably tracked, and completes
   within `maxDuration = 300s`**; a render that cannot complete within the cap is modeled as a
   **failed, retryable job** — never partial, never fabricated, never synchronous (§5).
5. Spokesperson **video** renders are **entitlement-gated before dispatch** and metered on success
   (§4).
6. The Business Brain remains the single, provider-agnostic source of truth for identity and stores
   **no** provider SDK dependency (§3, §7; ADR-024).
7. All change is **additive and reversible**; the existing report deliverable is retained (its
   renderer corrected, not removed) (§6; Charter Principle 9).

## 6. Dependencies

- **Brand Identity Slice 1 — Brand Ambassador Foundation** (ADR-024): complete on branch (`f801175`,
  migration 022), Preview READY, awaiting merge. Provides `resolveBrandAmbassador`, the
  provider-agnostic `visual_identity` memory, and the `spokesperson_video` entitlement that this work
  consumes. Slice 2 depends on Slice 1 being merged (Charter §5.4 — dependencies before dependents).
- Existing Model Gateway, HeyGen/Higgsfield adapters, Trust Engine, usage metering, Deliverables
  domain, and the AI Workforce pipeline — all reused, not replaced.

## 7. Risks (from ADR-025 §Consequences — carried as assumptions/risks)

- The gateway contract change ripples to adapters and callers — contained by keeping new fields
  optional / backward-compatible.
- Serverless `maxDuration` constrains rendering to async, per-asset, resumable jobs (see invariant 4).
- Provider-hosted URL longevity may later require durable persistence (out of scope here; separate
  ADR if pursued).
- Branded video depends on **curated per-ambassador provider references**; absent them, renders fall
  back to the platform default identity.
- Provider env keys must be present in production.
- **Unverified at planning time** (Charter Principle 15/16, honest engineering): provider render
  latency, hosted-URL longevity, and production env-key presence. These are assumptions to be
  validated during implementation/validation, not facts.

## 8. Composed data & decision flow (reference — ADR-025 §8)

```
Campaign completes
  → pipeline emits real deliverables from Creative/Video Production briefs:
        video_script(s) + image prompt(s)
  → render orchestration enqueues a BOUNDED set of idempotent render jobs
        (video jobs gated by spokesperson_video entitlement)
  → per-asset render job (async, ≤ maxDuration):
        identity = resolveBrandAmbassador(org)            # ADR-024
        response = ModelGateway.invoke({ provider, prompt, brandIdentity })
                     # Trust Engine + usage metering intact; provider isolated
        adapter renders (HeyGen / Higgsfield), returns hosted URL
        store type:'video' | 'image' deliverable (content.*Url, linked to source + run)
        recordUsageEvent(spokesperson_video)  # video
  → deliverables appear in Deliverables + Review queue
  → campaign summary/report deliverable renders correctly (renderer fixed)
```

## 9. Sequencing considerations (architecture level — not a slice plan)

The following are **ordering constraints** implied by the architecture, provided to inform later
slice decomposition. They are **not** slices, and they do not carry slice-level scope, acceptance
criteria, rollback, or estimates (Charter §5.3), which are produced only in an approved slice plan.

- The **gateway identity contract (Workstream A)** is foundational: render orchestration (B) and
  ambassador integration (F) depend on it. Its backward-compatible shape must land before consumers
  rely on it.
- **Consolidation of the duplicated render logic (Workstream B)** into the department services should
  precede or accompany wiring rendering into the pipeline, to avoid creating a second render path
  (Charter Principle 2).
- **Entitlement gating (Workstream D)** must be in place before video renders are dispatched from the
  campaign flow.
- The **report-renderer fix (Workstream E)** is independent of the render path and can be sequenced
  separately; it is additive and low-risk.
- Every unit of work must remain independently reviewable, testable, and — whenever practical —
  deployable (Charter §5.2); big-bang implementation is prohibited.

## 10. Definition of Done (reference)

Implementation of any slice under this plan is bound by the Charter §6 Definition of Done in full —
notably: functional correctness with no unintended behavior change; architectural integrity (all
invariants in §5 above preserved; no duplicate systems; provider logic isolated); TypeScript clean,
all tests pass, production build succeeds, new behavior covered by tests; additive data changes only;
Trust Engine and consent boundaries preserved; documentation, roadmap, and `docs/status.json`
synchronized; and honest reporting under the Evidence Hierarchy.

## 11. Governance & next step

Per Charter §4.1–§4.2 and §5.4, the mandatory next step is **slice decomposition followed by Founder
approval before implementation begins**. This document does not authorize implementation and does not
begin a milestone. It is the architecture-level record from which slice plans will be drafted **once
the Founder approves proceeding**.

- ADR: `docs/adr/ADR-025-campaign-rendering.md` (Accepted) — authoritative architecture.
- Related identity ADR: `docs/adr/ADR-024-brand-ambassador.md` (Accepted).
- Tracker: `docs/KOOLERR_MASTER_TRACKER.md` §4b — Brand Identity + Rendering, Slice 2.
