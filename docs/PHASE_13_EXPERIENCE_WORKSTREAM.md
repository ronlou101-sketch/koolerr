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

| Slice | Title                                          | Status                                              | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----- | ---------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A** | Unified Review queue                           | ✅ **Complete** (founder-approved 2026-07-29)       | Merged proposed Digital-Employee actions (ApprovalRequests → TrustEngine) and deliverables-awaiting-review into one `/approvals` "Review" surface; one focus item + "Up next"; humanized copy; send-back reason chips. Commit `9e56709`. Deployed to production 2026-07-29 (shipped with Slice B). See `docs/history/PHASE_13_SLICE_A_COMPLETION.md`.                                                                                                                                                                                                                                                                                                                                                             |
| **B** | Review as a primary destination + live badge   | ✅ **Complete** — deployed to production 2026-07-29 | Promoted Review from "More" into the primary nav bar (`Home · Campaigns · Deliverables · Review(badge) · Learn`) with a live pending-count badge (pending ApprovalRequests + deliverables `pending_review`) on the desktop bar and mobile drawer, hidden at 0. Count computed by a single reusable `app/(platform)/_lib/review-queue.ts#getPendingReviewCount()` fetched in the platform layout. Surface-only; no backend change. Commit `d6bb92a`. tsc + 849 tests + build clean. Live at koolerr.vercel.app (`dpl_3iWXh78…`, READY).                                                                                                                                                                            |
| **C** | Pipeline → "New campaign" modal                | ✅ **Complete** — in production 2026-07-30          | Campaigns (`/runs`) is the single entry point for creating a campaign: a "New campaign" button opens a modal hosting the shared `CampaignCreator` (extracted from the old `/pipeline` page — same `POST /api/pipeline/run` engine). Creation UX refined to feel like assigning work to an AI employee: one-tap guided goal selection (free text only for "Something else…"), softer optional focus field, "Create campaign" button. Pipeline removed from everyday nav (`MORE_NAV`); `/pipeline` route preserved as a thin wrapper. Surface-only; no engine/API/schema change; Home untouched. Commits `fc47ee0` + `442db98`. tsc + 849 tests + build clean. Live at koolerr.vercel.app (`dpl_5bASrnEJ…`, READY). |
| **D** | Creative → "Generate image" modal              | ⬜ Planned                                          | Fold `/creative` behind a "Generate image" modal inside Deliverables; route preserved.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **E** | Onboarding 6 → 3 steps + surface consolidation | ⬜ Planned                                          | Reduce onboarding to the minimum decisions; consolidate Billing+Usage, Audit+Consent, Contact+Support.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

> Slices C–E are the current candidate backlog (derived from the locked UX audit + nav spec).
> Order and scope of C onward are not locked; each is re-confirmed with the founder before it starts.

## Current status

**Slices A, B, and C are complete and live in production** (Slices A & B deployed 2026-07-29; Slice C
— Pipeline → "New campaign" modal + guided-goal creation UX — deployed 2026-07-30, koolerr.vercel.app).
Next candidate is **Slice D — Creative → "Generate image" modal** (not started; re-confirmed with the
founder before it starts).

_Live status of record: `docs/status.json`._
