# COMPLETED_WORK.md

> Foreman SoT: completed work **as claimed by sources**. Does not invent completion. Conflicts preserved.

| Field                                    | Value                                                                                                     |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Base for new implementation branches** | current **`master`** (tip `276dfd6b83ae8fb14812b7b8cd18af486f9d01c7`)                                     |
| **Historical SoT locus**                 | `feat/phase-5-6-launch-integrity` (HEAD at SoT pack creation: `b5283625f7e6f78a9382a9a51d4340abdee0f2da`) |

---

## Mobile navigation keyboard focus containment — ✅ COMPLETE (product slice)

**Evidence:** PR **#4**, branch `fix/mobile-nav-focus-trap`, **merged** into `master` at merge SHA
**`7a55a4e3399a08267c9d476e7a56278e9d568f1c`** (`7a55a4e`). Slice commits: `f164843`
(`fix(platform): contain keyboard focus in mobile nav drawer`) and `062455a`
(`docs(platform): move MobileNav JSDoc onto the component`).

Files delivered on `master`:

- `app/(platform)/_components/mobile-nav.tsx`
- `app/(platform)/_components/mobile-nav-focus.ts`
- `app/(platform)/_components/mobile-nav.test.ts`

Verification evidence at merge time:

- **Vitest 955 / 955 passing.**
- **Architect Option B approved**, plus a separate Architect **evidence-sufficiency** approval.
- **Manual keyboard verification: PASS.**
- **No new dependencies** introduced.

**Scope of this claim:** the three files above only. This closes the named slice. It completes **no**
launch phase, milestone, or gate, asserts no broader accessibility outcome, and resolves **no**
conflict in `DECISIONS.md` (**C1** Founder-resolved Version A; **C2–C7 remain open**). Foreman QA is **not** Independent QA; Independent
QA did not sign off, because it does not exist (`QA_PROTOCOL.md`).

---

## Phase 7 deferred follow-ons — ✅ SHIPPED (Founder-merged evidence)

| Milestone                                                   | Evidence                      | Status                                                                                                                                      |
| ----------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **7.3c** Dogfooding service tests + org-scope + `NOT_FOUND` | PRs **#16**, **#17**, **#18** | ✅ Founder-merged                                                                                                                           |
| **7.5** Stripe webhook-secret SSOT + prod startup assert    | PR **#19** (merge `3906e25…`) | ✅ Founder-merged                                                                                                                           |
| **7.6** Layout auth dedupe                                  | PR **#20** (merge `d26a9be…`) | ✅ Founder-merged                                                                                                                           |
| **7.9** Documentation & Housekeeping                        | PR **#24** (merge `85ef083…`) | ✅ Founder-merged (docs-only; follows existing 7.9 record; no broader phase closure claim; `infrastructure/**/provision.ts` still deferred) |

---

## PRs #25–#28 — verified historical / merged facts (not Phase 8 product completion)

| PR      | Merge      | Record                                                                                                           |
| ------- | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| **#25** | `f1daf6f…` | AMG draft ADR-027 + governance                                                                                   |
| **#26** | `b17e625…` | ADR-027 **Accepted — not Activated**                                                                             |
| **#27** | `c685e95…` | AMG activation record **NOT ACTIVATED**                                                                          |
| **#28** | `4dad95f…` | Phase 8 hermetic validation evidence; hermetic journey+perf **PASS** at recorded revision; **NOT** live-provider |

**AMG:** Accepted-not-Activated / **NOT ACTIVATED** / **parked** — not operationally enabled.

Also previously on tip `4dad95f…` (not Phase 7/8 product completion): **C1 Version A** docs bind (PR **#21**); Phase 8 hermetic E2E (PR **#22**) + perf baseline (PR **#23**) as earlier validation evidence; live-provider validation remains outstanding (**Founder-executed**).

**Independent QA** remains absent / not operationally available. PR **#1** remains **OPEN** and untouched.

---

## PRs #29–#33 — verified historical / merged facts (docs/governance only; not Phase 8 product completion)

| PR      | Merge      | Record                                                                                                            |
| ------- | ---------- | ----------------------------------------------------------------------------------------------------------------- |
| **#29** | `b11f03e…` | docs(sot): reconcile SoT tip after PRs #24–#28                                                                    |
| **#30** | `81fe0f9…` | docs(governance): stale SoT PR triage disposition record                                                          |
| **#32** | `aa9c106…` | Independent QA Gate #2 definition-only pack — Gate #2 **definition-only / not operational**; owner **TBD**        |
| **#33** | `505e041…` | AMG operational-readiness checklist (definition only) — AMG remains **NOT ACTIVATED** / **parked**; owner **TBD** |

Closed **without merge** (content did not land; #30 triage + Founder action; verified `gh pr view`): **#7, #9, #11, #14, #15**.

**PR #31** remains **OPEN** — overlapping/stale vs tip `505e041…` (predates #32/#33); disposition **unchanged** (not decided here).

Master tip at that reconcile was **`505e041…`**. **AMG** still **parked / NOT ACTIVATED**. Gate #2 still definition-only / not operational; owner **TBD** (Founder held TBD 2026-09-11). Temporary Foreman QA ≠ Independent QA. Phase 8 remains **next / not complete** (C1 Version A). Live-provider validation outstanding (**Founder-executed**).

---

## PR #34 — verified historical / merged fact (docs/SoT tip only; not Phase 8 product completion)

| PR      | Merge      | Record                                                                                                                |
| ------- | ---------- | --------------------------------------------------------------------------------------------------------------------- |
| **#34** | `a12a097…` | docs(sot): reconcile SoT tip after PRs #29–#33 — docs-only tip/history; closed SoT lag still recording tip `505e041…` |

Master tip at that reconcile was **`a12a097…`**. **PR #31** remains **OPEN** — overlapping/stale vs tip `a12a097…` (predates #32/#33/#34); disposition **unchanged**. **AMG** still **parked / NOT ACTIVATED**. Gate #2 still definition-only / not operational; owner **TBD**. Temporary Foreman QA ≠ Independent QA. Phase 8 remained **next / not complete** (C1 Version A) at that reconcile. Live-provider validation outstanding (**Founder-executed**). **PR #1** remains **OPEN** untouched. **C2–C7** unresolved.

---

## PR #35 — verified historical / merged fact (docs/SoT tip only; not Phase 8 product completion)

| PR      | Merge      | Record                                                                                         |
| ------- | ---------- | ---------------------------------------------------------------------------------------------- |
| **#35** | `67b9ba5…` | docs(sot): reconcile SoT tip after PR #34 — docs-only tip/history; closed SoT-tip-reconcile-34 |

Verified `origin/master` tip at this slice start: **`67b9ba54f87eace313f03b9a53db2712dc9d384b`**.

---

## Founder Phase 8 DEFERRED/HELD (2026-09-12) — recorded; Phase 8 not complete

Founder (2026-09-12): **STOP** Phase 8 live-provider testing. No new credentials, no provider
calls, no Zone A. Phase 8 is **DEFERRED/HELD**. Hermetic evidence on master (PRs **#21**,
**#22**, **#23**, **#28**) is **preserved**. Live-provider requirement remains **unresolved /
not closed**. Phase 8 is **NOT complete**.

This is a Founder operating record, not a Phase 8 completion and not a Phase 8 closure of the
live-provider requirement.

---

## PR #36 — verified historical / merged fact (docs/spec only; not Phase 9 product completion)

| PR      | Merge      | Record                                                                                                     |
| ------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| **#36** | `40880f3…` | docs(academy): Academy Catalog Search Foundation (Hermetic) spec — spec-only; not a runtime implementation |

Verified `origin/master` tip at this slice start: **`40880f30174b6a30ca56d2a13b66cb6b806294cf`**.

---

## PR #37 — verified historical / merged fact (library only; not Phase 9 product completion)

| PR      | Merge      | Record                                                                                           |
| ------- | ---------- | ------------------------------------------------------------------------------------------------ |
| **#37** | `114f129…` | feat(academy): Phase 9 hermetic catalog search library — `search.ts` + hermetic `search.test.ts` |

Verified `origin/master` tip at this slice start: **`114f129eea0f5ab1caa4655dc2820204ba0318e8`**.

Library only. **No UI** in that PR. Phase 9 is **not complete**. Phase 8 remains
**DEFERRED/HELD**; live-provider **unresolved / not closed**.

---

## PR #38 — verified historical / merged fact (UI only; not Phase 9 product completion)

| PR      | Merge      | Record                                                                                          |
| ------- | ---------- | ----------------------------------------------------------------------------------------------- |
| **#38** | `b160cc6…` | feat(academy): Phase 9 hermetic catalog-search UI — `/academy` control calling `searchCatalog()` |

Verified `origin/master` tip at this slice start: **`b160cc6f3b000640fa57ec65b0393816540c6487`**.

UI on the existing `/academy` page only. Phase 9 is **not complete**. Phase 8 remains
**DEFERRED/HELD**; live-provider **unresolved / not closed**.

---

## PR #39 — verified historical / merged fact (catalog course only; not Phase 9 product completion)

| PR      | Merge      | Record                                                                                                      |
| ------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| **#39** | `276dfd6…` | feat(academy): add Campaign Architect catalog course — one static 5-lesson course + `catalog-coverage.test.ts` |

Verified `origin/master` tip at this slice start: **`276dfd6b83ae8fb14812b7b8cd18af486f9d01c7`**.

Course + hermetic coverage tests. `ONBOARDING_PATHS` left unchanged in that PR. Phase 9 is
**not complete**. Phase 8 remains **DEFERRED/HELD**; live-provider **unresolved / not closed**.

---

## Phase 9 marketer onboarding path includes campaign-architect — IN PR / OPENED (Architect c3883718)

Append existing course id `campaign-architect` to the marketer `ONBOARDING_PATHS` entry
only (exactly once, append-only). Founder and operator path membership and order
unchanged. Hermetic `onboarding-path-coverage.test.ts`. No course lesson content, course
metadata, UI, search, progress, `videoUrl`, or provider edits.

**Completed-in-PR only — not merged.** Phase 9 is **not complete**. Existing
`app/(platform)/academy` catalog is **not** Phase 9 complete. Phase 8 remains
**DEFERRED/HELD**; live-provider **unresolved / not closed**.

**PR #31** remains **OPEN** — disposition **unchanged**. **AMG** still **parked / NOT
ACTIVATED**. Gate #2 still definition-only / not operational; owner **TBD**. Temporary Foreman
QA ≠ Independent QA. **PR #1** remains **OPEN** untouched. **C2–C7** unresolved.

---

## SoT operational refresh slice — ✅ COMPLETE (agent-ops work, not product work)

**Evidence:** PR **#3** (`docs: SoT operational refresh for master-based Claude workflow`), branch
`docs/sot-operational-refresh`, **merged** into `master` at SHA **`2ea64c9…`**. Slice commit
`684c19a`.

- Delivered: documentation-only updates recording the master-based Claude Code workflow, verified
  Claude Code availability, and the temporary Foreman QA substitute (`DECISIONS.md` O1–O6).
- Slice closed: `ACTIVE_SLICE.md` no longer describes this refresh as active.

**This closes an operating-documentation slice only.** It completes **no** product phase, milestone,
or launch gate, and resolves **no** conflict in `DECISIONS.md` (**C1** Founder-resolved Version A; **C2–C7 remain open**).

---

## Foreman SoT pack slice — ✅ COMPLETE (agent-ops work, not product work)

**Evidence:** PR **#2** (`docs: Foreman canonical SoT pack (docs-only)`), **merged** into `master` at SHA **`945f30840680790fcdbced49790a28372e9aab47`** (`945f308`).

- Delivered: the nine root Foreman SoT markdown files, documentation-only.
- Outcome: the SoT pack now lives on `master`; subsequent Claude Code implementation branches are cut from `master` (`DECISIONS.md` O2).
- Slice closed: superseded by the SoT operational refresh slice above.

**This closes an operating-documentation slice only.** It completes **no** product phase, milestone, or launch gate, and it does **not** resolve any conflict in `DECISIONS.md` (**C1** Founder-resolved Version A separately via PR **#21**; **C2–C7 remain open**).

---

## Phase 7 — Launch Readiness (aligned across sources)

**Evidence:** `PHASE_7_COMPLETION.md`, `README.md`, `CLAUDE.md`, `FOUNDATION_003`, Tracker, `docs/status.json`.

- Status: Complete; tagged `phase-7-complete`.
- Test count cited in original Phase 7 report: 756 → **833** (+77) for the core required milestones.
- Core milestones completed (7.1, 7.2, 7.3a, 7.3b, 7.4, 7.7, 7.8) per `PHASE_7_COMPLETION.md`.
- Previously deferred follow-ons now Founder-merged:
  - **7.3c** dogfooding service tests + org-scope + `NOT_FOUND` — PRs **#16**, **#17**, **#18**
  - **7.5** Stripe webhook-secret SSOT + prod startup assert — PR **#19** (merge `3906e25…`)
  - **7.6** layout auth dedupe — PR **#20** (merge `d26a9be…`)
  - **7.9** documentation & housekeeping — ✅ Founder-merged PR **#24** (merge `85ef083…`); does not touch `infrastructure/**/provision.ts` (still deferred)
- Independent QA remains absent (`QA_PROTOCOL.md`); temporary Foreman QA is not Independent QA.

---

## Launch Phases 8–9 — C1 Version A + Founder 2026-09-12 sequencing override (product outcomes not claimed complete here)

| Source                                                                                                | Phase 8                                                            | Phase 9                                                                                     |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `README.md`, `CLAUDE.md` (Founder-resolved **C1 Version A**, PR **#21**; Founder override 2026-09-12) | **DEFERRED/HELD** / not complete / not closed                      | **Next** — marketer onboarding path includes campaign-architect in PR (Architect **c3883718**); not complete |
| `FOUNDATION_003`, Tracker, `status.json` current[10]                                                  | ✅ `phase-8-complete` (historical/parallel claim; **non-binding**) | ✅ `phase-9-complete` (historical/parallel claim; **non-binding**)                          |

**C1** is Founder-resolved **Version A**, sequencing amended 2026-09-12 (Phase 8 **DEFERRED/HELD**; Phase 9 next) — see `DECISIONS.md`. Do **not** invent Phase 8/9 product-phase completion. Tracker / `FOUNDATION_003` Phase 8–10 complete claims remain **non-binding**. Master tip `276dfd6…` includes Phase 8 hermetic E2E (**PR #22**), perf baseline (**PR #23**), hermetic validation evidence (**PR #28**, journey+perf PASS; **NOT** live-provider), the Phase 9 search **spec** (**PR #36**), hermetic search **library** (**PR #37**), catalog-search **UI** (**PR #38**), and Campaign Architect **course** (**PR #39**) — hermetic evidence is **preserved** and ≠ Phase 8 final product validation complete. This PR appends **campaign-architect** to the marketer onboarding path only. Live-provider validation **unresolved / not closed**. **AMG** parked / **NOT ACTIVATED** (PRs **#25–#27**, readiness checklist **#33** definition only). Gate #2 definition-only / not operational (PR **#32**); owner **TBD**.

---

## Phase 5–6 product history (branch naming context)

From `docs/status.json` current entries (summaries):

- **Phase 5 — Core V1 Experiences** — Milestone 5.5 Operational Readiness cited complete; “Phase 5 complete.”
- **Phase 6 — Launch Integrity** — Milestones 6.1–6.6 cited complete; Stripe webhook-secret hardening deferred.

---

## Experience Workstream Phase 13 (Tracker / status.json)

- Slice A — Unified Review queue ✅ (founder-approved / production claims in status.json).
- Slice B — Review primary nav + badge ✅.
- Slice C — Pipeline → New campaign modal ✅.

Plan: `docs/PHASE_13_EXPERIENCE_WORKSTREAM.md`. History: `docs/history/PHASE_13_SLICE_A_COMPLETION.md`.

---

## Campaign Rendering (ADR-025) — code-complete claim with honesty caveat

Tracker / status.json: CR-1…CR-6c2 described as code-complete and pushed; honesty notes that runtime production verification of the full render loop may still be outstanding in older Tracker prose (“Next: M2 — prove it in production”). Later `status.json` entries claim Step 5 production video proof and Step 6 provider verification founder-accepted on this branch — **preserve both layers**; do not collapse into a single “done” without founder confirmation of which proof closes which gate.

---

## Feat-branch commits ahead of master (completed on branch, not merged)

See `MASTER_ROADMAP.md`. Includes YouTube publishing resilience, customer video creation experience, Step 5/6 docs, video selection visibility fix.

---

## `docs/status.json` completed[] (high-level labels)

Includes (non-exhaustive; full list in file): Platform Foundation; AI Content / SEO Workforces; Public Marketing Website; Brand & Visual Identity; Tower Control v1; AI Workforce Foundation and departments; end-to-end AI Workforce Integration; Customer Onboarding Pipeline; Live Provider Integrations (OpenAI, Manus, Anthropic, HeyGen, Higgsfield, ElevenLabs); … (46 completed entries observed at SoT creation).
