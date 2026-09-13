# ACTIVE_SLICE.md

> Foreman SoT: the **one** active slice for agent work right now.

| Field                         | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Branch for this slice**     | `cursor/phase-9-scope-lock-docs-10bc`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Base commit (checked out)** | `437658f59b1d2eb0942c08ca84625717ce8de1d6` (`437658f` — master tip; merge of PR #46). Verified against `origin/master`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Branch cut from**           | current `master` (see `CURRENT_STATE.md`). **Not** based on PR **#42**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Architect requestId**       | Founder-cited lock `6a6aaba6`. Confirming consult `f7d38a3f` (APPROVED; `authorized_scope: docs`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Prior product/docs slices** | Phase 7.3c / 7.5 / 7.6 Founder-merged; C1 Version A docs (PR #21); Phase 8 hermetic E2E #22 + perf #23; Phase 7.9 docs housekeeping #24; AMG ADR-027 draft/Accepted-not-Activated/activation-record #25–#27; Phase 8 hermetic validation evidence #28; SoT tip reconcile #24–#28 (PR #29); stale SoT PR triage #30; Independent QA Gate #2 definition-only #32; AMG operational-readiness checklist definition only #33; SoT tip reconcile #29–#33 (PR #34); SoT tip reconcile #34 (PR #35); Academy Catalog Search Foundation docs/spec (PR #36); Phase 9 hermetic catalog search library (PR #37); Phase 9 Academy catalog-search UI (PR #38); Phase 9 hermetic catalog coverage — one Campaign Architect course (PR #39); Phase 9 marketer onboarding path includes campaign-architect (PR #40); Phase 9 hermetic Billing catalog course (PR #41); Lean Phase 9 Foreman ops (PR #43); Phase 9 operator onboarding path includes billing (PR #44); Phase 9 founder onboarding path includes billing (PR #45); Phase 9 founder onboarding path includes campaign-architect (PR #46) |

---

## Active implementation slice

**Name:** Phase 9 scope-lock and gap/deferral record (docs only) — Architect lock
**6a6aaba6** / confirming consult **f7d38a3f**. Recorded as **O14** (2026-09-13).

**Status:** **active** — this **docs-only scope-lock** is the **one** active
slice. Dated design-lock / matrix-review record. **Not** Phase 8 complete.
**Not** Phase 9 complete. **No authorized product implementation.**

**Allowlist ONLY (Architect f7d38a3f; `authorized_scope: docs`):**

1. `DECISIONS.md`
2. `ACTIVE_SLICE.md`
3. `CURRENT_STATE.md`
4. `COMPLETED_WORK.md`
5. `docs/status.json`

**Out of scope / forbidden:** any file outside the 5-path allowlist; product
implementation; app / tests / config / search / lessons / paths; video
generation / HeyGen; i18n / multilingual; Phase 8 / Zone A / live-provider;
AMG; auth / RLS / schema / secrets / production; any change to PR **#1**;
rebase / replay / replace / close / comment / merge of PR **#31** or PR
**#42**; silent resolve/alter of **C2–C7**; merge to master.

**Facts recorded:**

- Master tip / base for new branches: **`437658f59b1d2eb0942c08ca84625717ce8de1d6`** (PR **#46** merge)
- **Accepted major-feature baseline:** in-platform Academy search; 15 lessons
  with five teaching blocks each; three learning paths (founder, marketer,
  operator)
- **Video inventory only:** 5 of 15 lessons currently have videos — **not** a
  commitment to generate more
- **Reserved:** additional HeyGen / video generation under Phase 8 **DEFERRED/HELD**
- **Deferred:** multilingual support; continual-expansion-as-a-program (catalog
  model remains append-only)
- **PR #42 / Publishing:** **superseded** as a Phase 9 completion dependency;
  not required to complete Phase 9; do **not** rebase / replay / replace it;
  this slice is **not** based on it
- Tracker / `README.md` / `FOUNDATION_003` Phase 9 complete claims remain
  **non-authoritative**
- This lock does **not** mark Phase 9 complete
- Phase 8 remains **DEFERRED/HELD** (Founder 2026-09-12). Live-provider requirement remains
  **unresolved / not closed**. Hermetic evidence on master (PRs **#21**, **#22**, **#23**,
  **#28**) is **preserved**. Phase 8 is **NOT complete**.
- **AMG:** Accepted-not-Activated / **NOT ACTIVATED** / **parked** — not operationally enabled; owner
  designation **TBD** (Founder held TBD 2026-09-11)
- Gate #2 **definition-only / not operational**; owner **TBD**
- Temporary Foreman QA ≠ Independent QA; Independent QA still not operationally available
- **PR #1:** still **OPEN** untouched
- **PR #31:** OPEN, disposition **unchanged**
- **C2–C7:** remain unresolved (verbatim in `DECISIONS.md`)

**Done when:** allowlisted files reflect the facts above; `git diff --name-only` ⊆ allowlist;
decision text includes the accepted baseline, reserved video, deferred
multilingual / expansion, superseded PR **#42**, and no Phase 9 complete claim;
`docs/status.json` valid JSON; C2–C7 still present unresolved; commit + push +
PR created (**not** merged).

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
- **SoT tip reconcile after PRs #29–#33** — Founder-merged PR **#34** (`a12a097…`).
- **SoT tip reconcile after PR #34** — Founder-merged PR **#35** (`67b9ba5…`).
- **Academy Catalog Search Foundation (Hermetic) docs/spec** — Founder-merged PR **#36** (`40880f3…`). Spec-only; not a runtime implementation; Phase 9 still not complete.
- **Phase 9 hermetic catalog search library** — Founder-merged PR **#37** (`114f129…`). Library + tests only; no UI in that PR; Phase 9 still not complete.
- **Phase 9 Academy catalog-search UI** — Founder-merged PR **#38** (`b160cc6…`). Hermetic `/academy` search control; Phase 9 still not complete.
- **Phase 9 hermetic catalog coverage — one Campaign Architect course** — Founder-merged PR **#39** (`276dfd6…`). Course + coverage tests; `ONBOARDING_PATHS` left unchanged in that PR; Phase 9 still not complete.
- **Phase 9 marketer onboarding path includes campaign-architect** — Founder-merged PR **#40** (`29bb21c…`). Marketer-path append only; founder/operator unchanged; Phase 9 still not complete.
- **Phase 9 hermetic Billing catalog course** — Founder-merged PR **#41** (`61291eb…`). One static 5-lesson Billing course + coverage tests; `ONBOARDING_PATHS` left unchanged in that PR; Phase 9 still not complete.
- **Lean Phase 9 Foreman execution mode** — Founder-merged PR **#43** (`5697b24…`). Docs-only ops append; does not mark Phase 9 complete.
- **Phase 9 operator onboarding path includes billing** — Founder-merged PR **#44** (`4d2e2fc…`). Operator-path append only; founder/marketer unchanged; Phase 9 still not complete.
- **Phase 9 founder onboarding path includes billing** — Founder-merged PR **#45** (`ebe2581…`). Founder-path append only; marketer/operator unchanged; Phase 9 still not complete.
- **Phase 9 founder onboarding path includes campaign-architect** — Founder-merged PR **#46** (`437658f…`). Founder-path append only; marketer/operator unchanged; Phase 9 still not complete.

---

## Explicitly NOT claimed complete

- Launch Phase **8** product outcomes — **DEFERRED/HELD**; **not complete / not closed** (live-provider unresolved; hermetic evidence preserved).
- Launch Phase **9** product outcomes — this slice is a **docs-only scope-lock**; Phase 9 is **not complete**. Existing Academy catalog is **not** Phase 9 complete. This lock does **not** authorize product implementation.
- Launch Phase **10** product outcomes as complete (Tracker/`status.json` parallel claims are non-binding for “what is next”).
- Live-provider validation (**unresolved / not closed**; Founder stopped Phase 8 live-provider testing 2026-09-12).
- **AMG** operational enablement / activation (Accepted-not-Activated / **parked** / **NOT ACTIVATED**).
- Independent QA Gate #2 operational availability or owner designation (definition-only; owner **TBD**).
- Campaign Rendering production M2 / full runtime proof (**C6** still open).
- **Independent QA pass** — Independent QA does not exist operationally; temporary Foreman QA is not Independent QA.
- Auth-adjacent `infrastructure/**/provision.ts` comment refresh (explicitly deferred from 7.9 allowlist).
- Any resolution of **C2–C7**.
- PR **#1** (remains **OPEN**, untouched — `DECISIONS.md` O5).
- PR **#31** disposition (noted overlapping/stale only; no close/supersede/merge).
- PR **#42** / Publishing (OPEN; **superseded** as a Phase 9 completion dependency only — no rebase/replay/replace/close/comment/merge of the PR).
