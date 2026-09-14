# ACTIVE_SLICE.md

> Foreman SoT: the **one** active slice for agent work right now.

| Field                         | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Branch for this slice**     | `cursor/academy-day-1-onboarding-lesson-24fc`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Base commit (checked out)** | `26caa47086407bda562d853c108a69fe4cc3105d` (`26caa47` — master tip; merge of PR #48). Verified against `origin/master`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Branch cut from**           | current `master` (see `CURRENT_STATE.md`). **Not** based on PR **#42**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Architect requestId**       | Founder-cited lock `ec643580` (from `e354905b`). Founder-approved acceptance standard `fe5f0ca1`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Prior product/docs slices** | Phase 7.3c / 7.5 / 7.6 Founder-merged; C1 Version A docs (PR #21); Phase 8 hermetic E2E #22 + perf #23; Phase 7.9 docs housekeeping #24; AMG ADR-027 draft/Accepted-not-Activated/activation-record #25–#27; Phase 8 hermetic validation evidence #28; SoT tip reconcile #24–#28 (PR #29); stale SoT PR triage #30; Independent QA Gate #2 definition-only #32; AMG operational-readiness checklist definition only #33; SoT tip reconcile #29–#33 (PR #34); SoT tip reconcile #34 (PR #35); Academy Catalog Search Foundation docs/spec (PR #36); Phase 9 hermetic catalog search library (PR #37); Phase 9 Academy catalog-search UI (PR #38); Phase 9 hermetic catalog coverage — one Campaign Architect course (PR #39); Phase 9 marketer onboarding path includes campaign-architect (PR #40); Phase 9 hermetic Billing catalog course (PR #41); Lean Phase 9 Foreman ops (PR #43); Phase 9 operator onboarding path includes billing (PR #44); Phase 9 founder onboarding path includes billing (PR #45); Phase 9 founder onboarding path includes campaign-architect (PR #46); Phase 9 scope-lock / gap-deferral record (PR #47); Phase 9 hermetic catalog coverage for all 15 lessons (PR #48) |

---

## Active implementation slice

**Name:** Phase 9 distinct Day-1 Onboarding Academy lesson — Architect lock
**ec643580** / Founder-approved acceptance **fe5f0ca1**. Adds exactly one
onboarding-specific lesson under the existing `getting-started` course.

**Status:** **active**. Append one distinct Onboarding lesson in
`getting-started` / `foundations` after the existing lessons. Teach the Day-1
`/onboarding` product flow (first-hour setup / Business Profile wizard as
onboarding), not Brain memory theory. `build-your-brain` does **not** satisfy
Onboarding and is **unchanged**. **Not** Phase 8 complete. **Not** Phase 9
complete. Do **not** change `ONBOARDING_PATHS` membership.

**Allowlist ONLY (Architect ec643580 / fe5f0ca1):**

1. `app/(platform)/academy/_lib/catalog.ts`
2. `app/(platform)/academy/_lib/catalog-coverage.test.ts`
3. `app/(platform)/academy/_lib/search.test.ts`
4. `ACTIVE_SLICE.md`
5. `CURRENT_STATE.md`
6. `COMPLETED_WORK.md`
7. `docs/status.json`

**Out of scope / forbidden:** any file outside the 7-path allowlist;
`search.ts`; `onboarding-path-coverage.test.ts`; rewriting
`build-your-brain`, `what-is-koolerr`, `how-memory-works`, `launch-a-run`,
`review-deliverables`, or any Campaigns / Deliverables / Billing / Campaign
Architect lesson; `videoUrl` / HeyGen; path-membership changes; Phase 8 /
Zone A / live-provider; AMG; auth / RLS / schema / secrets / production; any
change to PR **#1**; rebase / replay / replace / close / comment / merge of
PR **#31** or PR **#42**; silent resolve/alter of **C2–C7**; claiming Phase 9
complete; merge to master.

**Facts recorded:**

- Master tip / base for new branches: **`26caa47086407bda562d853c108a69fe4cc3105d`** (PR **#48** merge)
- This slice is a **bounded Phase 9 Onboarding-lesson slice** against Architect
  **ec643580** / **fe5f0ca1** on master **26caa47**. It does **not** mark
  Phase 9 complete.
- New lesson: onboarding-specific id / title / summary (searchable for
  onboarding-intent queries such as `"onboarding"` via title/summary); five
  populated teaching blocks; **no** `videoUrl`; optional resource link to
  `/onboarding`; independently distinct from `build-your-brain`
- Catalog counts after this slice: getting-started lessons **3**; catalog-wide
  **16**; video inventory **5** with `videoUrl` / **11** without; three
  onboarding paths founder / marketer / operator with current `courseIds`
  **unchanged**
- **PR #48** landed the hermetic 15-lesson catalog-coverage verification on master
- **PR #47** landed the O14 scope-lock / gap-deferral record on master
- **PR #42** remains **OPEN**, **superseded** as a Phase 9 completion
  dependency — not based on, not merged, not rebased, not commented, not
  replaced
- Phase 8 remains **DEFERRED/HELD** (Founder 2026-09-12). Live-provider requirement remains
  **unresolved / not closed**. Hermetic evidence on master (PRs **#21**, **#22**, **#23**,
  **#28**) is **preserved**. Phase 8 is **NOT complete**.
- Phase 9 is **NOT complete** — bounded Onboarding-lesson slice; not full
  Academy; not released
- **AMG:** Accepted-not-Activated / **NOT ACTIVATED** / **parked** — not operationally enabled; owner
  designation **TBD** (Founder held TBD 2026-09-11)
- Gate #2 **definition-only / not operational**; owner **TBD**
- Temporary Foreman QA ≠ Independent QA; Independent QA still not operationally available
- **PR #1:** still **OPEN** untouched
- **PR #31:** OPEN, disposition **unchanged**
- **C2–C7:** remain unresolved (verbatim in `DECISIONS.md`)

**Done when:** allowlisted files reflect the facts above; `git diff --name-only` ⊆ allowlist;
`catalog-coverage.test.ts` and `search.test.ts` pass hermetically; an
onboarding-intent query returns the new lesson via title/summary;
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
- **Phase 9 scope-lock / gap-deferral record (O14)** — Founder-merged PR **#47** (`ad775a7…`). Docs-only design-lock; Phase 9 still not complete.
- **Phase 9 hermetic catalog coverage for all 15 lessons** — Founder-merged PR **#48** (`26caa47…`). Verification only of the then-current O14 baseline; Phase 9 still not complete.

---

## Explicitly NOT claimed complete

- Launch Phase **8** product outcomes — **DEFERRED/HELD**; **not complete / not closed** (live-provider unresolved; hermetic evidence preserved).
- Launch Phase **9** product outcomes — this slice is **one Onboarding lesson**; Phase 9 is **not complete**. Existing Academy catalog is **not** Phase 9 complete.
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
