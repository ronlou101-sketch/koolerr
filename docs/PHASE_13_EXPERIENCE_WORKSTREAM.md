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

| Slice | Title                                          | Status                                         | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----- | ---------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A** | Unified Review queue                           | ✅ **Complete** (founder-approved 2026-07-29)  | Merged proposed Digital-Employee actions (ApprovalRequests → TrustEngine) and deliverables-awaiting-review into one `/approvals` "Review" surface; one focus item + "Up next"; humanized copy; send-back reason chips. Commit `9e56709`. Preview approved; Production pending. See `docs/history/PHASE_13_SLICE_A_COMPLETION.md`.                                                                                                                                                                                     |
| **B** | Review as a primary destination + live badge   | 🔄 **Implemented — awaiting Preview approval** | Promoted Review from "More" into the primary nav bar (`Home · Campaigns · Deliverables · Review(badge) · Learn`) with a live pending-count badge (pending ApprovalRequests + deliverables `pending_review`) on the desktop bar and mobile drawer, hidden at 0. Count computed by a single reusable `app/(platform)/_lib/review-queue.ts#getPendingReviewCount()` fetched in the platform layout. Surface-only; no backend change. tsc + 849 tests + build clean. Awaiting founder Preview approval before Production. |
| **C** | Pipeline → "New campaign" modal                | ⬜ Planned                                     | Fold `/pipeline` behind a "New campaign" modal launched from Campaigns; route preserved.                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **D** | Creative → "Generate image" modal              | ⬜ Planned                                     | Fold `/creative` behind a "Generate image" modal inside Deliverables; route preserved.                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **E** | Onboarding 6 → 3 steps + surface consolidation | ⬜ Planned                                     | Reduce onboarding to the minimum decisions; consolidate Billing+Usage, Audit+Consent, Contact+Support.                                                                                                                                                                                                                                                                                                                                                                                                                |

> Slices C–E are the current candidate backlog (derived from the locked UX audit + nav spec).
> Order and scope of C onward are not locked; each is re-confirmed with the founder before it starts.

## Current status

**Slice A complete and approved. Slice B implemented (B1 nav promotion + B2 live badge), awaiting
founder Preview approval before Production.** Next candidate after Slice B is Slice C (Pipeline modal),
re-confirmed with the founder before it starts.

_Live status of record: `docs/status.json`._
