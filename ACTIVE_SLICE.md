# ACTIVE_SLICE.md

> Foreman SoT: the **one** active slice for agent work right now.

| Field | Value |
| --- | --- |
| **Branch for this slice** | `docs/sot-tip-reconcile-24-28` |
| **Base commit (checked out)** | `4dad95f0b9ffaefea458ee34386271e573e61b73` (`4dad95f` — master tip; merge of PR #28) |
| **Branch cut from** | current `master` (see `CURRENT_STATE.md`) |
| **Architect requestId** | `057c37c8` |
| **Prior product/docs slices** | Phase 7.3c / 7.5 / 7.6 Founder-merged; C1 Version A docs (PR #21); Phase 8 hermetic E2E #22 + perf #23; Phase 7.9 docs housekeeping #24; AMG ADR-027 draft/Accepted-not-Activated/activation-record #25–#27; Phase 8 hermetic validation evidence #28 |

---

## Active implementation slice

**Name:** SoT tip reconcile after PRs **#24–#28** (docs-only; Architect **057c37c8**).

**Status:** 🔄 closing via this docs-only pass — **no active product slice**; after commit, idle / **awaiting next Founder priority**. Does **not** invent Phase 8 product-phase completion.

**Allowlist ONLY:**

1. `ACTIVE_SLICE.md`
2. `CURRENT_STATE.md`
3. `COMPLETED_WORK.md`
4. `DECISIONS.md`
5. `docs/status.json`

**Out of scope / forbidden:** `PHASE_7_COMPLETION.md`; AMG ADR/governance/activation-record files; `README.md` / `CLAUDE.md`; `app/`, `domains/`, migrations, secrets, code, tests, CI; any change to PR **#1**; silent resolve/alter of **C2–C7**; push/PR by the implementing agent.

**Facts recorded:**

- Master tip / base for new branches: **`4dad95f0b9ffaefea458ee34386271e573e61b73`** (PR **#28** merge)
- **#24** Phase 7.9 docs housekeeping (merge `85ef083…`) — follows existing 7.9 record; no broader phase closure claim
- **#25** AMG draft ADR-027 + governance (merge `f1daf6f…`)
- **#26** ADR-027 Accepted — not Activated (merge `b17e625…`)
- **#27** AMG activation record **NOT ACTIVATED** (merge `c685e95…`)
- **#28** Phase 8 hermetic validation evidence (merge `4dad95f…`); hermetic journey+perf **PASS** at recorded revision; **NOT** live-provider
- **AMG:** Accepted-not-Activated / **NOT ACTIVATED** / **parked** — not operationally enabled
- Live-provider validation: outstanding, **Founder-executed**
- **Phase 8:** **next / not complete** (C1 Version A)
- **PR #1:** still **OPEN** untouched
- **C2–C7:** remain unresolved (verbatim in `DECISIONS.md`)

**Done when:** allowlisted files reflect the facts above; `git diff --name-only` ⊆ allowlist; `docs/status.json` valid JSON; C2–C7 still present unresolved verbatim; commit created (no push).

---

## Closed prior slices

- **SoT pack** — closed complete, PR #2 merged at `945f3084…` (`COMPLETED_WORK.md`, `DECISIONS.md` O1).
- **SoT operational refresh** — closed complete, PR #3 merged at `2ea64c9…` (`COMPLETED_WORK.md`).
- **Mobile navigation keyboard focus containment** — closed complete, PR #4 merged at `7a55a4e…` (`COMPLETED_WORK.md`, `DECISIONS.md` O7).
- **SoT post-PR-#4 reconcile** — closed complete, PR #5 merged at `ef9502c…`.
- **Phase 7.3c / 7.5 / 7.6** — Founder-merged (PRs **#16–#20**); see `COMPLETED_WORK.md`.
- **C1 Version A docs bind** — Founder-merged PR **#21** (`c72181f…`).
- **Phase 7.9 docs housekeeping** — Founder-merged PR **#24** (`85ef083…`).
- **AMG ADR-027 draft / Accepted-not-Activated / activation record** — Founder-merged PRs **#25–#27** (AMG remains **parked** / **NOT ACTIVATED**).
- **Phase 8 hermetic validation evidence** — Founder-merged PR **#28** (`4dad95f…`; hermetic only — not live-provider).

---

## Explicitly NOT claimed complete

- Launch Phase **8 / 9 / 10 product outcomes** as complete (C1 Version A says Phase 8 is **next** / not complete; Tracker/`status.json` parallel claims are non-binding for “what is next”).
- Live-provider validation (outstanding; **Founder-executed**).
- **AMG** operational enablement (Accepted-not-Activated / **parked**).
- Campaign Rendering production M2 / full runtime proof (**C6** still open).
- **Independent QA pass** — Independent QA does not exist; temporary Foreman QA is not Independent QA.
- Auth-adjacent `infrastructure/**/provision.ts` comment refresh (explicitly deferred from 7.9 allowlist).
- Any resolution of **C2–C7**.
- PR **#1** (remains **OPEN**, untouched — `DECISIONS.md` O5).
