# ACTIVE_SLICE.md

> Foreman SoT: the **one** active slice for agent work right now.

| Field | Value |
| --- | --- |
| **Branch for this slice** | `docs/sot-tip-reconcile-29-33` |
| **Base commit (checked out)** | `505e0413a2d6fc0918c0ed6dc97d95650d777353` (`505e041` — master tip; merge of PR #33) |
| **Branch cut from** | current `master` (see `CURRENT_STATE.md`) |
| **Architect requestId** | `91f692eb` |
| **Prior product/docs slices** | Phase 7.3c / 7.5 / 7.6 Founder-merged; C1 Version A docs (PR #21); Phase 8 hermetic E2E #22 + perf #23; Phase 7.9 docs housekeeping #24; AMG ADR-027 draft/Accepted-not-Activated/activation-record #25–#27; Phase 8 hermetic validation evidence #28; SoT tip reconcile #24–#28 (PR #29); stale SoT PR triage #30; Independent QA Gate #2 definition-only #32; AMG operational-readiness checklist definition only #33 |

---

## Active implementation slice

**Name:** SoT tip reconcile after PRs **#29–#33** (docs-only; Architect **91f692eb**).

**Status:** 🔄 closing via this docs-only pass — **no active product slice**; after commit, idle / **awaiting next Founder priority**. Does **not** invent Phase 8 product-phase completion.

**Allowlist ONLY:**

1. `ACTIVE_SLICE.md`
2. `CURRENT_STATE.md`
3. `COMPLETED_WORK.md`
4. `DECISIONS.md`
5. `docs/status.json`

**Out of scope / forbidden:** `PHASE_7_COMPLETION.md`; AMG ADR/governance/activation-record/operational-readiness files; Gate #2 definition pack edits; AMG **activation**; Gate #2 / Independent QA **owner appointment**; `README.md` / `CLAUDE.md`; `app/`, `domains/`, migrations, secrets, code, tests, CI; any change to PR **#1**; close/rebase/comment/merge/supersede disposition of PR **#31**; silent resolve/alter of **C2–C7**.

**Facts recorded:**

- Master tip / base for new branches: **`505e0413a2d6fc0918c0ed6dc97d95650d777353`** (PR **#33** merge)
- **#29** docs(sot): reconcile SoT tip after PRs #24–#28 (merge `b11f03e…`)
- **#30** docs(governance): stale SoT PR triage disposition record (merge `81fe0f9…`)
- **#32** Independent QA Gate #2 definition-only pack (merge `aa9c106…`) — Gate #2 **definition-only / not operational**; owner **TBD**
- **#33** AMG operational-readiness checklist (definition only) (merge `505e041…`) — does **not** activate AMG
- Closed **without merge** (content did not land; #30 triage + Founder action): **#7, #9, #11, #14, #15**
- **PR #31** OPEN — noted overlapping/stale vs tip `505e041…` (predates #32/#33); **disposition unchanged**
- **AMG:** Accepted-not-Activated / **NOT ACTIVATED** / **parked** — not operationally enabled; owner designation **TBD** (Founder held TBD 2026-09-11)
- Temporary Foreman QA ≠ Independent QA; Independent QA still not operationally available
- Live-provider validation: outstanding, **Founder-executed**
- **Phase 8:** **next / not complete** (C1 Version A); hermetic E2E/perf/evidence ≠ Phase 8 final product validation complete
- **PR #1:** still **OPEN** untouched
- **C2–C7:** remain unresolved (verbatim in `DECISIONS.md`)

**Done when:** allowlisted files reflect the facts above; `git diff --name-only` ⊆ allowlist; `docs/status.json` valid JSON; C2–C7 still present unresolved verbatim; commit + push + PR created (**not** merged).

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
- **SoT tip reconcile after PRs #24–#28** — Founder-merged PR **#29** (`b11f03e…`).
- **Stale SoT PR triage disposition** — Founder-merged PR **#30** (`81fe0f9…`); Founder closed #7/#9/#11/#14/#15 without merge.
- **Independent QA Gate #2 definition-only pack** — Founder-merged PR **#32** (`aa9c106…`; definition-only — not operational; owner TBD).
- **AMG operational-readiness checklist (definition only)** — Founder-merged PR **#33** (`505e041…`; AMG still **NOT ACTIVATED**).

---

## Explicitly NOT claimed complete

- Launch Phase **8 / 9 / 10 product outcomes** as complete (C1 Version A says Phase 8 is **next** / not complete; Tracker/`status.json` parallel claims are non-binding for “what is next”).
- Live-provider validation (outstanding; **Founder-executed**).
- **AMG** operational enablement / activation (Accepted-not-Activated / **parked** / **NOT ACTIVATED**).
- Independent QA Gate #2 operational availability or owner designation (definition-only; owner **TBD**).
- Campaign Rendering production M2 / full runtime proof (**C6** still open).
- **Independent QA pass** — Independent QA does not exist operationally; temporary Foreman QA is not Independent QA.
- Auth-adjacent `infrastructure/**/provision.ts` comment refresh (explicitly deferred from 7.9 allowlist).
- Any resolution of **C2–C7**.
- PR **#1** (remains **OPEN**, untouched — `DECISIONS.md` O5).
- PR **#31** disposition (noted overlapping/stale only; no close/supersede/merge).
