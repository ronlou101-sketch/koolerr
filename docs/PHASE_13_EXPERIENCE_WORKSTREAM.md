# Phase 13 — Experience Redesign (Experience Workstream)

> **Track:** Experience Workstream (parallel to the Launch Roadmap — see
> `docs/adr/ADR-023-experience-workstream.md`). This is **Experience Phase 13**, distinct from
> **Launch Phase 11 (Public Launch)** and **Launch Phase 12 (Scale)**.
>
> **Governing constitution:** the Koolerr North Star. Every slice must increase at least one of
> **Trust · Simplicity · Confidence · Progress · Results** and must **reduce customer effort**.
> Every screen must answer, in order: (1) What is my employee doing? (2) Does my employee need
> anything from me? (3) What happens next? If a change adds complexity without adding customer
> confidence, it is not built.

## Objective

Collapse the platform's fragmented customer surfaces into a single, calm, one-decision-at-a-time
experience — so the customer spends less time managing marketing and more time running their
business. Phase 13 is display/surface consolidation over the **unchanged** backend engine
(Census / Strategy / Workforce orchestration, Trust Engine, Business Brain all untouched).

## Scope discipline (hard guardrails)

- No backend / auth / Supabase / permissions / AI / business-logic / schema changes.
- Preserve 100% of functionality; never reduce discoverability; never remove owner/admin capability.
- Home dashboard remains **FROZEN** (bug fixes only) unless a slice explicitly re-opens it with
  founder approval.
- One customer app: the founder is a customer plus the "⌘ Owner" menu — no separate founder app.

## Slices

| Slice | Title                                          | Status                                                                            | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----- | ---------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A** | Unified Review queue                           | ✅ **Complete** (founder-approved 2026-07-29)                                     | Merged proposed Digital-Employee actions (ApprovalRequests → TrustEngine) and deliverables-awaiting-review into one `/approvals` "Review" surface; one focus item + "Up next"; humanized copy; send-back reason chips. Commit `9e56709`. Deployed to production 2026-07-29 (shipped with Slice B). See `docs/history/PHASE_13_SLICE_A_COMPLETION.md`.                                                                                                                                                                                                                                                                                                                                                             |
| **B** | Review as a primary destination + live badge   | ✅ **Complete** — deployed to production 2026-07-29                               | Promoted Review from "More" into the primary nav bar (`Home · Campaigns · Deliverables · Review(badge) · Learn`) with a live pending-count badge (pending ApprovalRequests + deliverables `pending_review`) on the desktop bar and mobile drawer, hidden at 0. Count computed by a single reusable `app/(platform)/_lib/review-queue.ts#getPendingReviewCount()` fetched in the platform layout. Surface-only; no backend change. Commit `d6bb92a`. tsc + 849 tests + build clean. Live at koolerr.vercel.app (`dpl_3iWXh78…`, READY).                                                                                                                                                                            |
| **C** | Pipeline → "New campaign" modal                | ✅ **Complete** — in production 2026-07-30                                        | Campaigns (`/runs`) is the single entry point for creating a campaign: a "New campaign" button opens a modal hosting the shared `CampaignCreator` (extracted from the old `/pipeline` page — same `POST /api/pipeline/run` engine). Creation UX refined to feel like assigning work to an AI employee: one-tap guided goal selection (free text only for "Something else…"), softer optional focus field, "Create campaign" button. Pipeline removed from everyday nav (`MORE_NAV`); `/pipeline` route preserved as a thin wrapper. Surface-only; no engine/API/schema change; Home untouched. Commits `fc47ee0` + `442db98`. tsc + 849 tests + build clean. Live at koolerr.vercel.app (`dpl_5bASrnEJ…`, READY). |
| **D** | Creative → "Generate image" modal              | ⏸ **DEFERRED** — parked while the Brand Identity + Rendering initiative is active | Fold `/creative` behind a "Generate image" modal inside Deliverables; route preserved.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **E** | Onboarding 6 → 3 steps + surface consolidation | ⏸ **DEFERRED** — parked while the initiative below is active                      | Reduce onboarding to the minimum decisions; consolidate Billing+Usage, Audit+Consent, Contact+Support.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

> Slices C–E were the earlier candidate backlog (derived from the locked UX audit + nav spec). **D and
> E are now DEFERRED** in favor of the Brand Identity + Rendering initiative below.

## Brand Identity + Rendering initiative (Slice 1–4)

Surfaced from the **2026-07-30 architectural review** (Private Beta blocker: completed campaigns produced
only a blank text report — no real media — and there was no persistent per-customer visual identity, only
a single global HeyGen avatar). This initiative supersedes the priority of Experience Slices D/E.
Governed by the North Star and **`docs/adr/ADR-024-brand-ambassador.md`**.

> **Numbering disambiguation:** this initiative uses **Slice 1–4** (Arabic numerals), which are
> **distinct** from the Experience Workstream's **Slice A–E** (letters) above. "Slice 1" is NOT Experience
> "Slice A". Qualify as "Brand Identity Slice 1" vs "Experience Slice A" when both are in view.

| Slice | Title                       | Status                                                                                                                                                                                                                                                                                                                                                                              |
| ----- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | Brand Ambassador Foundation | ✅ **Complete on branch** (`f801175`, migration 022 applied) — awaiting merge. Additive; provider-agnostic `visual_identity` in the Business Brain; standalone first-class Digital Employee, NOT enrolled in the Workforce Engine; `spokesperson_video` entitlement 5/30/100/0; curated Library + deterministic default. tsc + 859 tests + build clean; Preview READY. See ADR-024. |
| **2** | Campaign Rendering          | ⬜ Planned (not started) — wire the existing HeyGen/Higgsfield render path into the campaign pipeline, branded by the ambassador; emit real image/video deliverables; fix the report renderer.                                                                                                                                                                                      |
| **3** | GROW team management        | ⬜ Planned — choose ambassador from Library, choose voice, upload logo/brand colors/reference images.                                                                                                                                                                                                                                                                               |
| **4** | SCALE custom spokesperson   | ⬜ Planned — upload likeness → private avatar + voice clone; multi-ambassador groundwork.                                                                                                                                                                                                                                                                                           |

> Additive only; no destructive migrations; ghost `campaign_*` tables untouched (cleanup post-Beta). The
> Brand Ambassador identity lives only in the Business Brain — never coupled to a render provider.

## Current status

**Experience Workstream:** Slices A, B, C complete and live in production; **Slices D and E DEFERRED.**

**Brand Identity + Rendering initiative:** **Slice 1 — Brand Ambassador Foundation — is complete on
branch** (`f801175`; migration 022 applied and confirmed; Preview READY; awaiting merge). **Next: Slice 2
— Campaign Rendering** (not started; requires founder approval before it begins).

_Live status of record: `docs/status.json`._
