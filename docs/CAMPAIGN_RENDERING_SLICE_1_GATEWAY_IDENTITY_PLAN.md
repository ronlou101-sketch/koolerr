# Campaign Rendering — Slice CR-1: Gateway Brand-Identity Contract (slice plan)

> **Document type:** Slice plan (Charter §5.3; authority hierarchy position 6 — below ADRs and the
> implementation plan, above prompts).
> **Status:** Draft — awaiting Founder approval. **This document does not authorize implementation.**
> **Governing ADR:** [`docs/adr/ADR-025-campaign-rendering.md`](adr/ADR-025-campaign-rendering.md)
> §1 (Gateway identity injection), §3 (Provider abstraction boundaries).
> **Parent plan:** [`docs/CAMPAIGN_RENDERING_IMPLEMENTATION_PLAN.md`](CAMPAIGN_RENDERING_IMPLEMENTATION_PLAN.md)
> — **Workstream A**; sequencing §9 (foundational, lands before consumers).
> **Identity model:** [`docs/adr/ADR-024-brand-ambassador.md`](adr/ADR-024-brand-ambassador.md) (Accepted).

> **Numbering disambiguation.** This is the **first slice of the Campaign Rendering body of work**
> (initiative "Brand Identity + Rendering", tracker §4b "Slice 2 — Campaign Rendering"). To avoid
> collision with the initiative's Slice 1–4 numbering and the Experience Workstream's Slice A–E, the
> Campaign Rendering slices are labelled **CR-1, CR-2, …**. This document is **CR-1**. It is **not**
> "Brand Identity Slice 1" (that is the completed Brand Ambassador Foundation).

---

## 1. Objective

Extend the Model Gateway contract so an AI invocation can **optionally** carry a provider-agnostic
**brand-identity payload**, and have the render adapters consume it — falling back to today's env
defaults when it is absent. This lands the foundational, backward-compatible contract that later
slices (render orchestration, ambassador integration) depend on, **without** wiring any production
caller to it yet.

This realizes ADR-025 §1 and reaffirms §3: the mapping from the provider-agnostic identity to concrete
provider parameters happens **inside** the Model Gateway module (in the adapters), so no
provider-specific type crosses the module boundary.

## 2. Business rationale

Campaign media must be brandable per organization, but the gateway request contract currently carries
**no brand identity** (`NormalizedModelRequest = { prompt, model?, maxTokens?, systemContext? }`), and
HeyGen reads a single global `HEYGEN_AVATAR_ID`/`HEYGEN_VOICE_ID` from env. Every downstream slice that
renders branded media needs a way to pass identity through the gateway. Establishing that contract
first — additively and with behavior unchanged when the payload is absent — de-risks the rest of the
Campaign Rendering work and keeps each subsequent slice small (Charter §5.2).

## 3. Scope (in scope)

Derived strictly from ADR-025 §1 and Implementation Plan Workstream A.

1. **Contract extension (additive, optional).** Add an **optional** provider-agnostic brand-identity
   field to `NormalizedModelRequest` and `GatewayRequest` in `shared/model-gateway/types.ts`. The
   payload shape is provider-agnostic and carries, per ADR-025 §1:
   - resolved provider references (e.g. avatar id, voice id),
   - reference image URL(s),
   - a deterministic seed.
2. **Gateway forwarding.** `shared/model-gateway/gateway.ts` forwards the optional identity from
   `GatewayRequest` into `NormalizedModelRequest` when present. The gateway performs **no
   provider-specific handling** — Trust Engine enforcement, provider dispatch, usage-event emission,
   and audit logging are unchanged.
3. **Adapter consumption + env fallback (inside the module).** The **HeyGen** and **Higgsfield**
   adapters consume only the fields relevant to them from the identity payload when present, and
   **fall back to the existing env defaults** when a field is absent — preserving the current
   "no ambassador → global default" behavior. The provider-agnostic → concrete-provider mapping is
   confined to the adapters (inside the gateway module).
4. **Tests.** Unit tests proving: absent payload → request is forwarded and adapters behave exactly as
   today; present payload → each adapter maps the relevant fields to its provider call; missing
   individual field → env fallback; and that no provider-specific type is exported from the module.

## 4. Out of scope (explicit)

These belong to later Campaign Rendering slices or other ADRs and **must not** appear in CR-1:

- **Resolving the Brand Ambassador** (`resolveBrandAmbassador`) or wiring any production caller
  (pipeline or the standalone render routes) to pass the identity — Workstream F / B, a later slice.
  _CR-1 lands the contract only; no production invocation passes the payload yet (see Risks §8)._
- **Render orchestration**, async job model, emitting `video`/`image` deliverables, or centralizing
  the duplicated route render logic — Workstream B / §5, later slices.
- **Entitlement gating** (`spokesperson_video`) or usage metering changes — Workstream D, later slice.
- **Report-renderer fix** — Workstream E, later slice.
- **Any new store, table, migration, domain, or rendering subsystem** — prohibited by ADR-025.
- **Any change to the Brand Ambassador identity model** — ADR-024 is immutable and authoritative.
- **Provider SDK imports outside the gateway module**, or any provider-specific type in the payload
  shape — prohibited by ADR-025 §3 / Charter Principle 7.

## 5. Dependencies

- **Brand Identity Slice 1 — Brand Ambassador Foundation** (ADR-024): complete on branch (`f801175`,
  migration 022), Preview READY. CR-1 does **not** call `resolveBrandAmbassador`, so it is not
  strictly blocked by the merge; however, the identity payload shape must remain compatible with the
  provider-agnostic `visual_identity` model that Slice 1 established (ADR-024). No schema dependency.
- Existing Model Gateway module (`shared/model-gateway/*`), including the HeyGen and Higgsfield
  adapters and `gateway.test.ts` — reused and extended, not replaced.
- No new dependency on billing, the pipeline, or any domain in this slice.

## 6. Architectural invariants (must be preserved)

From ADR-025 and the Implementation Plan §5. Violating any one fails Charter §6 (item 2):

1. The new identity field is **optional and backward-compatible**; every existing text call (Anthropic,
   OpenAI, Manus, ElevenLabs, and current HeyGen/Higgsfield calls) behaves **identically** when the
   payload is absent (ADR-025 §1).
2. **No provider-specific type or import leaves the Model Gateway module.** The payload shape is
   provider-agnostic; the concrete-provider mapping lives only in the adapters (ADR-025 §3; Charter
   Principle 7; `types.ts` module contract lines 24–26).
3. **Single source of truth / no duplication:** one contract, extended in place — no parallel request
   type, no second gateway path (Charter Principles 2/3).
4. Trust Engine enforcement, provider dispatch order, usage-event emission, and audit logging in
   `gateway.ts` are **unchanged** (ADR-025 §3; the gateway's enforcement order is fixed).
5. The Business Brain remains provider-agnostic and imports no provider SDK (ADR-024; ADR-025 §7) —
   untouched by this slice.
6. All change is **additive and reversible** (Charter Principle 9).

## 7. Acceptance criteria

CR-1 is complete when all of the following hold (each independently verifiable):

- **AC1 — Contract:** `NormalizedModelRequest` and `GatewayRequest` expose an optional
  provider-agnostic brand-identity field carrying resolved provider references, reference image
  URL(s), and a deterministic seed. No existing field is renamed or removed.
- **AC2 — Backward compatibility:** with no identity payload, `gateway.invoke` produces byte-identical
  provider requests and responses to current behavior; all pre-existing gateway/adapter tests pass
  unchanged.
- **AC3 — Forwarding:** when a `GatewayRequest` carries the identity, `gateway.ts` forwards it into
  the `NormalizedModelRequest` handed to the adapter, with no provider-specific handling in the
  gateway core.
- **AC4 — HeyGen consumption + fallback:** the HeyGen adapter uses the payload's avatar/voice
  references when present and falls back to `HEYGEN_AVATAR_ID`/`HEYGEN_VOICE_ID` when absent.
- **AC5 — Higgsfield consumption + fallback:** the Higgsfield adapter uses the payload's reference
  image URL(s) / seed when present and falls back to current defaults when absent.
- **AC6 — Boundary integrity:** no provider-specific type or import is exported from
  `shared/model-gateway`; verified by inspection and by the module's public surface (`index.ts`).
- **AC7 — Tests:** new unit tests cover AC2–AC6; the full suite and TypeScript pass.

## 8. Risks

- **No live production consumer in CR-1 (dead-code appearance).** By design, no pipeline or route
  passes the payload yet, so the new mapping code runs only under tests until Workstream B/F lands.
  _Mitigation:_ the new code paths are exercised by unit tests (reachable and verified, satisfying the
  intent of Charter §6 item 4), and the approved Implementation Plan §9 explicitly sequences this
  contract first. The very next slice wires a real consumer. **Flagged for CTO/Founder awareness.**
- **Contract ripple to adapters/callers** (ADR-025 §Consequences). _Mitigation:_ the field is
  optional; no caller signature changes; existing callers compile and behave unchanged.
- **Payload shape drift from the ADR-024 identity model.** _Mitigation:_ the shape mirrors the
  provider-agnostic `visual_identity` fields; it stores resolved references only, not provider types.
- **Unverified at planning time** (Charter Principles 15/16): actual HeyGen/Higgsfield request shapes
  for avatar/voice/reference-image parameters are known only from prior code inspection; they will be
  confirmed against the adapters during implementation, not assumed.

## 9. Rollback strategy

- The change is **purely additive** (an optional field plus adapter fallbacks). Rollback is reverting
  the single commit; because no production caller sets the field and adapters fall back to env
  defaults, reverting restores exact prior behavior with **no data or schema impact** (no migration is
  introduced by this slice).
- No feature flag is required: absence of the payload is itself the "off" state.

## 10. Validation plan

Evidence gathered in Charter §6.9 Evidence-Hierarchy order (highest available first):

1. **Automated tests** — new unit tests for AC2–AC6 (backward-compat, forwarding, per-adapter
   consumption + fallback, boundary integrity); full `npx vitest run` green.
2. **Static analysis** — `npx tsc --noEmit` clean; confirm no provider-specific export from
   `shared/model-gateway/index.ts`.
3. **Production build** — `npm run build` succeeds.
4. **Code inspection** — confirm `gateway.ts` enforcement order (Trust → dispatch → usage → audit) is
   unchanged and the identity mapping is confined to adapters.
5. **Preview deployment** — deploy to Preview; confirm existing (non-branded) invocations still
   succeed. _(No runtime branded-render verification is possible in CR-1 because no caller passes the
   payload; branded end-to-end verification arrives with the consumer slice — stated honestly, not
   claimed here.)_

## 11. ADR impact

- **None.** CR-1 implements the architecture ADR-025 already fixed; it introduces **no new
  architectural decision** and requires **no** ADR change. ADR-024 and ADR-025 are untouched.

## 12. Documentation impact

On completion (a later, separate step — not part of this draft): update
`docs/CAMPAIGN_RENDERING_IMPLEMENTATION_PLAN.md` status/sequencing notes, the tracker
(`docs/KOOLERR_MASTER_TRACKER.md` §4b), and `docs/status.json` (`activeTasks`), per the Charter
Definition of Done item 7 and the CLAUDE.md Tracker Workflow. No documentation is committed by this
draft.

## 13. Estimated completion conditions

CR-1 is done when: AC1–AC7 pass; TypeScript, the full test suite, and the production build are clean;
the new behavior is test-covered; Preview deploys and existing invocations are unaffected; and the
CTO certifies the Definition of Done (Charter §6). Only then, and only with Founder approval, may the
next Campaign Rendering slice begin (Charter §5.4).

## 14. Governance & next step

Per Charter §4.1 step 7 and §4.2, **implementation may not begin until the Founder approves this slice
plan.** This document is a draft for review; it changes no source code, no ADRs, and no other
documentation, and it does not begin the milestone. Subsequent slice plans (render orchestration,
entitlement gating, deliverable lifecycle + report fix, ambassador integration) are **not** drafted
here and will be produced one at a time, after CR-1 is formally accepted.
