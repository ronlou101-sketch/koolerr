# ADR-025 — Campaign Rendering Architecture

- Status: Accepted
- Date: 2026-07-31
- Author: AI implementing engineer (Claude), under CTO direction
- CTO Review: Approved
- Founder Approval: Approved
- Supersedes / Superseded by: none — references **ADR-024 (Brand Ambassador)**, which remains
  authoritative for the identity model.

> Governed by the Koolerr Engineering Charter (v1.0.0). This ADR is **Accepted**
> (Draft → CTO Review → Founder Approval → Accepted). Per Charter §7.2 an Accepted ADR is binding;
> dependent implementation still proceeds only through the Charter's approved-plan and gate
> requirements.
>
> This ADR defines **only the enduring architecture** — what it is, why it exists, the boundaries and
> contracts it establishes, and the invariants future engineers must preserve. It intentionally
> prescribes **no** implementation sequencing, ordering, or execution strategy, and remains valid
> regardless of the order in which the architecture is realized.

## Context

A completed customer campaign currently produces **no real media** — only a single text
`type:'report'` deliverable — which is a Private Beta blocker (BUILD/GROW/SCALE advertise AI
spokesperson videos). The CTO Read-Only Investigation (2026-07-31) established, by code inspection:

1. `infrastructure/ai-workforce/pipeline.ts` (`runAIWorkforcePipeline`) ends by persisting one
   `type:'report'` deliverable (the text `DeliveryPackage`) and **invokes no media adapter**.
2. Real render capability exists but only as **standalone, manually-triggered endpoints**
   (`app/api/video/heygen/generate`, `app/api/image/higgsfield/generate`) that call the Model Gateway
   and store real `video`/`image` deliverables — but pass only `prompt` + `provider`.
3. The **Model Gateway contract carries no brand identity**: `NormalizedModelRequest =
{ prompt, model?, maxTokens?, systemContext? }`, and `gateway.ts` forwards only those fields to
   adapters. HeyGen reads a **single global** `HEYGEN_AVATAR_ID`/`HEYGEN_VOICE_ID` from env.
4. Nothing consumes the **Brand Ambassador** (ADR-024) — `resolveBrandAmbassador` exists but is
   unreferenced by the gateway, routes, or pipeline.
5. The `report` deliverable **renders blank**: the detail page's `GenericContent` reads
   `body`/`contentBrief`/`draft`, which `DeliveryPackage` does not contain.
6. The `spokesperson_video` entitlement (5/30/100/0) is **defined but never enforced**.
7. **Serverless timeout risk:** render routes and the pipeline are capped at `maxDuration = 300s`,
   while the HeyGen adapter polls up to 600s.

ADR-024 governs the Brand Ambassador **identity** (standalone, Business-Brain-owned, provider-agnostic,
`spokesperson_video`). It does **not** govern the gateway contract, render orchestration, or the
deliverable lifecycle. Those are architectural and outlive the initiative, so they require this ADR.

## Decision

Wire the **existing** render capability into the campaign flow, branded by the Brand Ambassador,
**additively** and **provider-agnostically**, reusing the Model Gateway, adapters, the Deliverables
domain, and the Brand Ambassador identity (ADR-024). The architecture is defined by the following
boundaries, contracts, and invariants.

### 1. Gateway identity injection

- The Model Gateway request contract (`GatewayRequest`, `NormalizedModelRequest`) and the
  `IModelProviderAdapter` interface gain an **optional, backward-compatible** brand-identity payload
  (resolved provider references — e.g. avatar id, voice id — plus reference image URLs and a
  deterministic seed). Absent the payload, behavior is unchanged (existing text calls unaffected).
- Adapters consume only the fields relevant to them and **fall back to env defaults** when a field is
  absent (preserving current behavior and the "no ambassador → global default" safety path).
- The mapping from the provider-agnostic identity to concrete provider parameters is resolved **at the
  gateway boundary**, so no provider-specific type crosses out of the gateway module.

### 2. Render orchestration

- Campaign completion produces **real deliverables** (video scripts and image prompts) from the
  existing Creative / Video Production briefs; a **render step** renders a **bounded** set of those
  deliverables through the branded gateway path.
- Render logic currently duplicated inside the two API routes is **centralized** into the Creative /
  Video Production department services; the routes and the pipeline both call the same path (one
  authoritative implementation — Charter Principle 2/5). No new rendering subsystem is created.
- Rendering is **decoupled from the synchronous pipeline** (see §5); orchestration is idempotent and
  resumable, and only a bounded number of assets render per campaign.

### 3. Provider abstraction boundaries

- Charter Principle 7 is reaffirmed: **no provider-specific code outside the Model Gateway.** The
  pipeline, department services, and Business Brain see only normalized types and the
  provider-agnostic identity; adapters translate. The Business Brain stores the identity and provider
  references but imports no provider SDK (consistent with ADR-024).

### 4. Entitlement enforcement

- **Spokesperson video renders are gated by `billingService.checkEntitlement('spokesperson_video')`**
  (BUILD 5 / GROW 30 / SCALE 100 / unpaid 0) **before** the render is dispatched; an over-limit request
  is rejected with a clear, non-spending error. Successful renders call `recordUsageEvent` (metering),
  matching the existing engagement_run/model_invocation pattern.
- **Boundary:** this ADR gates only spokesperson **video** renders via `spokesperson_video`. It does
  **not** define an image-render entitlement — no such governance decision exists, and this ADR does
  not invent one. Image renders remain bounded by the media-generation bound (§2) and existing usage
  entitlements unless a separate entitlement is established by governance.

### 5. Timeout / async strategy

- **No multi-asset synchronous rendering.** Each asset is an **independent, idempotent, resumable
  render job** that must complete within a single function invocation (`maxDuration`). A provider poll
  that would exceed the function limit marks the job failed and eligible for retry — never a partial
  or fabricated result.
- Render jobs are **driven asynchronously** and do not block campaign completion; job state is
  **durably tracked** (keyed to the engagement run / source deliverable) so progress survives request
  boundaries. Bounded concurrency respects provider and cost limits.
- **Invariant:** any render-drive mechanism must preserve the properties above (asynchronous,
  per-asset, idempotent, resumable, durably tracked, within the function `maxDuration`). The
  `maxDuration = 300s` cap is a hard architectural constraint on any per-invocation render; a render
  that cannot complete within it must be modeled as a **failed, retryable job** rather than run
  synchronously. This ADR fixes these invariants; it does not select a mechanism.

### 6. Deliverable lifecycle

- Reuse the existing `deliverables` store and types (no new store — Charter Principle 2/3). Campaign
  completion writes `video_script` and image-prompt deliverables; renders write `video`/`image`
  deliverables carrying the hosted asset URL (`content.videoUrl` / `content.imageUrl`) and links to
  their source (`scriptDeliverableId` / `creativeId`) and `engagementRunId`.
- Rendered deliverables flow through the existing status lifecycle
  (`draft → pending_review → approved → published`) and surface in the Deliverables page and the
  unified Review queue. The campaign **summary/report** deliverable is retained
  but its renderer is corrected so it is no longer blank.
- Assets are referenced by **provider-hosted URLs**. Whether copies are persisted to durable object
  storage to guard against provider URL expiry is a separate architectural concern **outside the scope
  of this ADR**.

### 7. Integration with the Brand Ambassador (ADR-024)

- Every render resolves the organization's ambassador via `resolveBrandAmbassador(orgId)` and injects
  its identity into the gateway request (§1), so all campaign media is **consistent and branded** with
  the org's single spokesperson (Charter Principle 3 — single source of truth). If no ambassador is
  found, the render falls back to the platform env default and logs. No new identity storage is
  introduced.

### 8. Composed architecture (data and decision flow)

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

## Alternatives Considered

- **Render synchronously inside the pipeline.** Rejected — exceeds the serverless `maxDuration` for
  multi-asset video and is a big-bang implementation (Charter §5.2).
- **Pass provider IDs from the domain/pipeline directly to adapters, bypassing the gateway.** Rejected
  — violates Provider Independence (Principle 7) and the gateway's "no provider type leaves this
  module" boundary.
- **Store per-provider identity in the domain / Business Brain coupling.** Rejected — ADR-024 keeps the
  identity provider-agnostic; providers are consumers, not owners.
- **Build a new rendering subsystem/domain.** Rejected — the Model Gateway + adapters + Deliverables
  already provide the capability; extend, don't rebuild (Principle 4/5).
- **Fold this into ADR-024.** Rejected — ADR-024 is the identity model and is immutable once Accepted;
  the rendering architecture is a distinct decision recorded separately.

## Consequences

- **Positive:** completed campaigns produce real, branded media by reusing existing infrastructure;
  provider-agnostic and vendor-swappable; entitlement-bounded spend; one consistent spokesperson per
  org; no new store or subsystem.
- **Costs / risks:** the gateway contract change ripples to adapters and callers (contained by keeping
  new fields optional/back-compat); the serverless timeout constrains rendering to async, per-asset,
  resumable jobs; provider-hosted URL longevity may require durable persistence (see §6); branded video
  depends on **curated per-ambassador provider references** — absent them, renders fall back to the
  platform default identity; provider env keys must be present in production. _(Provider render latency,
  URL longevity, and env-key presence are unverified at ADR time and are carried as assumptions/risks.)_

## Supersession

None. This ADR references ADR-024 (Brand Ambassador identity), which remains authoritative for the
identity model. If a future decision changes this rendering architecture, a new ADR will supersede
this one per Charter §7.4 (ADRs are immutable historical records).
