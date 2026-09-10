# ACTIVE_SLICE.md

> Foreman SoT: the **one** active slice for agent work right now.

| Field | Value |
| --- | --- |
| **Branch for this slice** | `docs/sot-micro-reconcile-30-closes` |
| **Base commit (checked out)** | `81fe0f9554a1caa47b73f100d6d1a152cb86e521` (`81fe0f9` — master tip; merge of PR #30) |
| **Branch cut from** | current `master` (see `CURRENT_STATE.md`) |
| **Architect requestId** | `3e826593` |
| **Prior product/docs slices** | Phase 7.3c / 7.5 / 7.6 Founder-merged; C1 Version A docs (PR #21); Phase 8 hermetic E2E #22 + perf #23; Phase 7.9 docs housekeeping #24; AMG ADR-027 draft/Accepted-not-Activated/activation-record #25–#27; Phase 8 hermetic validation evidence #28; SoT tip reconcile #24–#28 (PR #29); stale SoT PR triage disposition (PR #30) |

---

## Active implementation slice

**Name:** SoT micro-reconcile after PR **#30** + Founder closes of stale PRs **#7/#9/#11/#14/#15** (docs-only; Architect **3e826593**).

**Status:** 🔄 closing via this docs-only pass — **no active product slice**; after commit, idle / **awaiting next Founder priority**. Does **not** invent Phase 8 product-phase completion.

**Allowlist ONLY:**

1. `ACTIVE_SLICE.md`
2. `CURRENT_STATE.md`
3. `COMPLETED_WORK.md`
4. `DECISIONS.md`
5. `docs/status.json`

Also edit `docs/governance/stale-sot-pr-triage.md` **only** to record Founder-executed closes without merge (correct stale “not executed / Executed? No / optional close” language).

**Out of scope / forbidden:** `PHASE_7_COMPLETION.md`; AMG ADR/governance/activation-record files (except the triage disposition language correction above); `README.md` / `CLAUDE.md`; `app/`, `domains/`, migrations, secrets, code, tests, CI; any change to PR **#1**; silent resolve/alter of **C2–C7**; push/PR by the implementing agent.

**Facts recorded:**

- Master tip / base for new branches: **`81fe0f9554a1caa47b73f100d6d1a152cb86e521`** (PR **#30** merge)
- **#29** SoT tip reconcile after PRs **#24–#28** (merge `b11f03e…`)
- **#30** stale SoT PR triage disposition record (merge `81fe0f9…`) — `docs/governance/stale-sot-pr-triage.md`
- PRs **#7, #9, #11, #14, #15**: **CLOSED without merge** by Founder (content did **NOT** land; do not imply implemented/merged)
- **AMG:** Accepted-not-Activated / **NOT ACTIVATED** / **parked** — not operationally enabled
- Live-provider validation: outstanding, **Founder-executed**
- **Phase 8:** **next / not complete** (C1 Version A); hermetic evidence still on master
- **PR #1:** still **OPEN** untouched
- **C2–C7:** remain unresolved (verbatim in `DECISIONS.md`)

**Done when:** allowlisted files reflect the facts above; `git diff --name-only` ⊆ allowlist (+ triage only if edited); `docs/status.json` valid JSON; C2–C7 still present unresolved verbatim; commit created (no push).

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
- **Stale SoT PR triage disposition record** — Founder-merged PR **#30** (`81fe0f9…`); Founder subsequently **closed without merge** PRs **#7/#9/#11/#14/#15** (content not landed).

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
- Content from closed-without-merge PRs **#7/#9/#11/#14/#15** (did **not** land on master).
