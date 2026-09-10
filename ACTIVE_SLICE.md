# ACTIVE_SLICE.md

> Foreman SoT: the **one** active slice for agent work right now.

| Field | Value |
| --- | --- |
| **Branch for this slice** | `docs/phase-7-9-housekeeping` |
| **Base commit (checked out)** | `d40356d7295435cc9d193b18629e7f73dc7da3c6` (`d40356d` — master tip; merge of PR #23) |
| **Branch cut from** | current `master` (see `CURRENT_STATE.md`) |
| **Architect requestId** | `5dd5c0d5-7df4-4922-80fa-d52ad15a9ef1` |
| **Prior product/docs slices** | Phase 7.3c / 7.5 / 7.6 Founder-merged; C1 Version A docs (PR #21); Phase 8 hermetic E2E #22 + perf #23 on master |

---

## Active implementation slice

**Name:** Phase **7.9** — Documentation & Housekeeping (Founder-authorized; Architect-approved).

**Status:** 🔄 closing via this docs-only pass — records shipped deferred Phase 7 follow-ons and Founder-resolved **C1 Version A**; does **not** invent Phase 8/9 product-phase completion.

**Allowlist ONLY:**

1. `PHASE_7_COMPLETION.md`
2. `COMPLETED_WORK.md`
3. `docs/status.json`
4. `DECISIONS.md`
5. `ACTIVE_SLICE.md`
6. `CURRENT_STATE.md`

**Out of scope / forbidden:** `infrastructure/**/provision.ts` (still deferred); `README.md` / `CLAUDE.md` (already C1-aligned in PR #21 — prefer not to touch); `app/`, `domains/`, migrations, secrets, code; any change to PR **#1**; silent resolve/alter of **C2–C7**; push/PR by the implementing agent.

**Facts recorded:**

- **7.3c** — PRs **#16**, **#17**, **#18** (Founder-merged)
- **7.5** — PR **#19** (merge `3906e25…`)
- **7.6** — PR **#20** (merge `d26a9be…`)
- **7.9** — this slice
- **C1** — Founder-resolved Version A (Phase 8 next) — PR **#21**; **C2–C7** remain unresolved verbatim
- Master tip / Phase 8 validation evidence: hermetic E2E **#22** + perf **#23** (not product-phase completion)

**Done when:** allowlisted files reflect the facts above; `git diff --name-only` ⊆ allowlist; `docs/status.json` valid JSON; C1 marked Founder-resolved Version A; C2–C7 still present unresolved; commit created (no push).

---

## Closed prior slices

- **SoT pack** — closed complete, PR #2 merged at `945f3084…` (`COMPLETED_WORK.md`, `DECISIONS.md` O1).
- **SoT operational refresh** — closed complete, PR #3 merged at `2ea64c9…` (`COMPLETED_WORK.md`).
- **Mobile navigation keyboard focus containment** — closed complete, PR #4 merged at `7a55a4e…` (`COMPLETED_WORK.md`, `DECISIONS.md` O7).
- **SoT post-PR-#4 reconcile** — closed complete, PR #5 merged at `ef9502c…`.
- **Phase 7.3c / 7.5 / 7.6** — Founder-merged (PRs **#16–#20**); see `COMPLETED_WORK.md`.
- **C1 Version A docs bind** — Founder-merged PR **#21** (`c72181f…`).

---

## Explicitly NOT claimed complete

- Launch Phase **8 / 9 / 10 product outcomes** as complete (C1 Version A says Phase 8 is **next** / not complete; Tracker/`status.json` parallel claims are non-binding for “what is next”).
- Campaign Rendering production M2 / full runtime proof (**C6** still open).
- **Independent QA pass** — Independent QA does not exist; temporary Foreman QA is not Independent QA.
- Auth-adjacent `infrastructure/**/provision.ts` comment refresh (explicitly deferred from this 7.9 allowlist).
- Any resolution of **C2–C7**.
- PR **#1** (remains **OPEN**, untouched — `DECISIONS.md` O5).
