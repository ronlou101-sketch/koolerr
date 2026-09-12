# DECISIONS.md

> Foreman SoT: where decisions live, and **unresolved conflicts** for the founder.

| Field | Value |
| --- | --- |
| **Base for new implementation branches** | current **`master`** (tip `67b9ba54f87eace313f03b9a53db2712dc9d384b`) |
| **Historical SoT locus** | `feat/phase-5-6-launch-integrity` (HEAD at SoT pack creation: `b5283625f7e6f78a9382a9a51d4340abdee0f2da`) |

---

## Canonical decision records (do not duplicate here)

1. **Founder decisions:** `Foundation/FOUNDATION_005_FOUNDER_DECISION_LOG.md`  
   Decisions 001–015 (platform identity, Business Brain sharing, workforce-first, trust before autonomy, simplicity, human approval, permanent architecture, modular DDD, AI employees, hiring UX, compounding value, documentation-as-product, Foundation supremacy, AI agents obey Foundation, architecture changes need rationale). All marked **Permanent** in source.
2. **Architecture Decision Records:** `docs/adr/ADR-001` … `ADR-025` (sample titles observed: Result pattern; Trust Engine in gateway; usage-event sink; repository pattern; authentication; content workforce MVP; …; production deployment ADR-022; experience workstream ADR-023; brand ambassador ADR-024; campaign rendering ADR-025).
3. **Engineering operating constitution:** `docs/KOOLERR_ENGINEERING_CHARTER.md` (Founder / CTO / Engineer roles; ADR lifecycle; quality gates).
4. **Charter / Architecture / Principles / Roadmap / Product:** `Foundation/FOUNDATION_000`–`004`.

New architectural decisions still require ADRs per Foundation + Engineering Charter — this SoT pack is not an ADR substitute.

---

## Operational records (Founder-set; not conflicts)

These are recorded operating facts. **O1–O6** were added at the **SoT operational refresh**; **O7–O8**
were added at the **post-PR-#4 reconcile**; **O9** at Phase **7.9** docs housekeeping; **O10** at the SoT tip
reconcile after PRs **#24–#28**; **O11** at the SoT tip reconcile after PRs **#29–#33**; **O12** at the SoT tip
micro-reconcile after PR **#34**; **O13** at the Founder Phase 8 **DEFERRED/HELD** + Phase 9 Academy
Catalog Search Foundation docs slice. None of them is a resolution of **C2–C7** (still open). **C1** was
Founder-resolved Version A separately (PR **#21**); O1–O13 must not be read as resolving C2–C7. C1
sequencing was Founder-amended on 2026-09-12 (Phase 8 **DEFERRED/HELD**; Phase 9 next docs slice) without
resolving C2–C7.

### O1 — SoT pack slice closed

PR **#2** merged; merge SHA **`945f30840680790fcdbced49790a28372e9aab47`**. The nine-file Foreman SoT pack is on `master`. Recorded in `COMPLETED_WORK.md`.

### O2 — Implementation branches are cut from `master`

Future Claude Code implementation branches are cut from **current `master`**, not from `feat/phase-5-6-launch-integrity`. That feat branch is historical. This is a branching-workflow decision only — it does **not** speak to what is or is not merged into `master` (see **C5**, still open).

### O3 — Claude Code available

Claude Code is **installed and authenticated through `claude.ai`** (verified). This supersedes the SoT-pack-era record of “not installed.”

### O4 — Independent QA still unavailable; temporary Foreman QA approved

Independent QA does **not** exist. The Founder has approved **temporary Foreman QA** as a substitute, **only** for narrowly scoped, non-reserved slices, per `QA_PROTOCOL.md`. It is not Independent QA and must never be described as such. Its standing versus Engineering Charter roles remains open under **C7**.

### O5 — PR #1 open and untouched

PR **#1** remains **OPEN**. It is a **separate product line** and is **not** the vehicle for the SoT-pack or SoT-refresh slices. No agent may push to, rebase, merge, close, or comment on it without explicit Founder instruction.

### O6 — Next slice awaits Founder approval

After the SoT operational refresh merges there is no active implementation slice. The next one must be named and approved by the Founder (`ACTIVE_SLICE.md`).

> **Clarified by O8 (not deleted).** O6 remains historically accurate as written at the SoT
> operational refresh. For the purpose of *continuing the loop*, O8 supplies the Founder
> authorization O6 required; slice naming moves to Foreman/Architect within the O8 boundaries.
> Everything else in O6 stands.

### O7 — PR #4 merged (mobile-nav focus containment)

PR **#4**, branch `fix/mobile-nav-focus-trap`, **merged** into `master` at merge SHA
**`7a55a4e3399a08267c9d476e7a56278e9d568f1c`**. Delivered `app/(platform)/_components/mobile-nav.tsx`,
`mobile-nav-focus.ts`, and `mobile-nav.test.ts`. Evidence at merge: Vitest **955/955**, Architect
Option B + evidence-sufficiency approvals, manual keyboard **PASS**, no new dependencies. Recorded in
`COMPLETED_WORK.md`; the slice is closed in `ACTIVE_SLICE.md`.

This is a record of a merge, not a phase, gate, or milestone claim, and it resolves nothing in C2–C7 (**C1** Founder-resolved Version A separately via PR **#21**).

### O8 — Founder authorized continuing the autonomous development loop

The Founder has authorized agents to **continue the autonomous development loop** (session
directive), rather than halting after each merged slice as O6 described.

Boundaries — all still binding:

- Work stays inside `KOOLERR_CONSTITUTION.md`, `MASTER_ROADMAP.md`, and `ARCHITECTURE_GUARDRAILS.md`.
- Agents **must not** silently resolve, narrow, or reinterpret **C2–C7** (still open). **C1** is
  Founder-resolved Version A (see below). Open conflicts must be escalated, not decided.
- **Founder-reserved actions still require the Founder** — merge/deploy approval, PR #1 (O5),
  secrets, billing/entitlements, migrations, RLS/auth, destructive operations, architectural changes
  without an ADR, and calling Architect Preview MCP (`AGENT_OPERATING_INSTRUCTIONS.md` hard stops).
- Temporary Foreman QA keeps its narrow standing under `QA_PROTOCOL.md` and is never Independent QA.

O8 authorizes *continuation of the loop*. It does **not** authorize any specific product slice and
does **not** resolve **C2–C7**. (**C1** was Founder-resolved Version A separately — PR **#21**.)

### O9 — Phase 7.9 docs housekeeping + deferred follow-ons on master

Founder authorized Phase 7.9. Recorded when master tip was **`d40356d7295435cc9d193b18629e7f73dc7da3c6`** (historical; superseded as tip by later merges — see **O10**):

- **7.3c / 7.5 / 7.6** Founder-merged (PRs **#16–#18**, **#19** `3906e25…`, **#20** `d26a9be…`).
- **7.9** closed via docs-only branch `docs/phase-7-9-housekeeping` (later merged as PR **#24**, `85ef083…`).
- **C1 Version A** already on master via PR **#21**; Phase 8 hermetic E2E (**#22**) + perf (**#23**) are validation evidence only — not a product-phase completion claim.
- **PR #1** remains **OPEN** (O5). Independent QA still absent (O4).


### O10 — SoT tip reconcile after PRs #24–#28

Docs-only tip reconcile on branch `docs/sot-tip-reconcile-24-28` (Architect **057c37c8**). Master tip / base for new branches is **`4dad95f0b9ffaefea458ee34386271e573e61b73`** (PR **#28** merge).

Verified historical / merged facts:

- **#24** Phase 7.9 docs housekeeping (merge `85ef083…`) — follows existing 7.9 record; no broader phase closure claim
- **#25** AMG draft ADR-027 + governance (merge `f1daf6f…`)
- **#26** ADR-027 Accepted — not Activated (merge `b17e625…`)
- **#27** AMG activation record **NOT ACTIVATED** (merge `c685e95…`)
- **#28** Phase 8 hermetic validation evidence (merge `4dad95f…`); hermetic journey+perf **PASS** at recorded revision; **NOT** live-provider

**AMG:** Accepted-not-Activated / **NOT ACTIVATED** / **parked** — not operationally enabled. Live-provider validation: outstanding, **Founder-executed**. Phase 8 remains **next / not complete** (C1 Version A). **PR #1** remains **OPEN** (O5). Independent QA still absent (O4).

O10 records tip/history only. It does **not** resolve, narrow, or reinterpret **C2–C7**.


### O11 — SoT tip reconcile after PRs #29–#33

Docs-only tip reconcile on branch `docs/sot-tip-reconcile-29-33` (Architect **91f692eb**). Master tip / base for new branches is **`505e0413a2d6fc0918c0ed6dc97d95650d777353`** (PR **#33** merge).

Verified historical / merged facts (after prior SoT tip `4dad95f…` / PR **#28**):

- **#29** docs(sot): reconcile SoT tip after PRs #24–#28 (merge `b11f03e…`)
- **#30** docs(governance): stale SoT PR triage disposition record (merge `81fe0f9…`)
- **#32** Independent QA Gate #2 definition-only pack (merge `aa9c106…`) — Gate #2 **definition-only / not operational**; owner **TBD**
- **#33** AMG operational-readiness checklist (definition only) (merge `505e041…`) — does **not** activate AMG

Closed **without merge** (content did not land; recorded in #30 triage + Founder action; verified via `gh pr view`): **#7, #9, #11, #14, #15**.

**PR #31** remains **OPEN** — noted as overlapping/stale relative to verified tip `505e041…` (predates #32/#33). **Disposition unchanged** in this record (no close/supersede/merge decision).

**AMG:** Accepted-not-Activated / **NOT ACTIVATED** / **parked** — not operationally enabled. Gate #2 definition-only / not operational; owner designation **TBD** (Founder held TBD on 2026-09-11). Temporary Foreman QA ≠ Independent QA; Independent QA still not operationally available. Live-provider validation: outstanding, **Founder-executed**. Phase 8 remains **next / not complete** (C1 Version A); hermetic E2E/perf/evidence ≠ Phase 8 final product validation complete. **PR #1** remains **OPEN** (O5).

O11 records tip/history only. It does **not** resolve, narrow, or reinterpret **C2–C7**. It does **not** activate AMG, appoint an owner, or dispose PR **#31**.


### O12 — SoT tip micro-reconcile after PR #34 (this slice)

Docs-only tip micro-reconcile on branch `docs/sot-tip-reconcile-34` (Architect **411cc55a**). Master tip / base for new branches is **`a12a097d6d04761cbbf273e6bf6f27100ecad9d7`** (PR **#34** merge).

Verified historical / merged fact (after prior SoT tip `505e041…` / PR **#33**):

- **#34** docs(sot): reconcile SoT tip after PRs #29–#33 (merge `a12a097…`) — docs-only tip/history; closes SoT lag that still recorded tip `505e041…`

**PR #31** remains **OPEN** — noted as overlapping/stale relative to verified tip `a12a097…` (predates #32/#33/#34). **Disposition unchanged** in this record (no close/supersede/merge decision).

**AMG:** Accepted-not-Activated / **NOT ACTIVATED** / **parked** — not operationally enabled. Gate #2 definition-only / not operational; owner designation **TBD** (Founder held TBD on 2026-09-11). Temporary Foreman QA ≠ Independent QA; Independent QA still not operationally available. Live-provider validation: outstanding, **Founder-executed**. Phase 8 remains **next / not complete** (C1 Version A); hermetic E2E/perf/evidence ≠ Phase 8 final product validation complete. **PR #1** remains **OPEN** (O5).

O12 records tip/history only. It does **not** resolve, narrow, or reinterpret **C2–C7**. It does **not** activate AMG, appoint an owner, or dispose PR **#31**.


### O13 — Founder Phase 8 DEFERRED/HELD + Academy Catalog Search Foundation (this slice)

Founder (2026-09-12): **STOP** Phase 8 live-provider testing. No new credentials, no provider calls, no
Zone A. Phase 8 is **DEFERRED/HELD**. Hermetic evidence on master (PRs **#21**, **#22**, **#23**,
**#28**) is **preserved**. The live-provider requirement remains **unresolved / not closed**. Phase 8
is **NOT complete**.

Founder then approved this Phase 9 **docs** slice.

Architect **7126fa69** named the slice: **Academy Catalog Search Foundation (Hermetic)**. Simple
keyword matching only. Advanced filters/facets deferred.

Architect **32681030** approved this exact 8-path allowlist (`authorized_scope: docs`):
`docs/academy/phase-9-catalog-search-foundation.md` (new); `README.md`; `CLAUDE.md`;
`DECISIONS.md`; `CURRENT_STATE.md`; `ACTIVE_SLICE.md`; `COMPLETED_WORK.md`; `docs/status.json`.

Existing `app/(platform)/academy` catalog is **NOT** Phase 9 complete. Phase 9 is **NOT complete /
not implemented / not released**.

Master tip / base for new branches is **`67b9ba54f87eace313f03b9a53db2712dc9d384b`** (PR **#35**
merge of `docs/sot-tip-reconcile-34`). Verified against `origin/master` at slice start.

**AMG** remains **parked / NOT ACTIVATED**. Gate #2 **definition-only**; owner **TBD**. **PR #1**
remains **OPEN** untouched. **PR #31** remains **OPEN**, disposition **unchanged**.

O13 records the Founder deferral and this docs slice. It does **not** resolve, narrow, or
reinterpret **C2–C7**. It does **not** activate AMG, appoint an owner, or dispose PR **#31**.

---

## Founder-resolved conflicts

### C1 — Launch phase completion narrative — ✅ Founder-resolved **Version A**

**Resolved by Founder** (evidence: PR **#21**, merge `c72181f…` — already reflected in `README.md` / `CLAUDE.md`).

- **Binding (Version A):** `README.md` + `CLAUDE.md` → Phase 7 ✅; originally **Phase 8 — Final Product Validation** is next (not complete).
- **Founder override (2026-09-12, sequencing only):** Phase 8 is **DEFERRED/HELD** (live-provider unresolved / not closed; hermetic evidence on master via PRs **#21**, **#22**, **#23**, **#28** is preserved; Phase 8 is **not complete**). The approved next slice is **Phase 9 Academy Catalog Search Foundation (Hermetic)** — docs/spec only (Architect **7126fa69** / **32681030**). Phase 9 is **not complete / not implemented / not released**. Existing `app/(platform)/academy` catalog is **not** Phase 9 complete.
- **Non-binding for “what is next”:** `FOUNDATION_003` + `docs/KOOLERR_MASTER_TRACKER.md` + `docs/status.json` Phase 8–10 complete/in-progress claims remain historical/parallel evidence; do not treat them as next-step authority under Version A. Tracker / `FOUNDATION_003` Phase 8–10 complete claims remain **non-binding**.
- Agents follow Version A plus this Founder sequencing override for forward roadmap narrative. This does **not** invent Phase 8/9 product-phase completion.

Original options preserved for audit:

- **A:** `README.md` + `CLAUDE.md` → Phase 7 ✅; **Phase 8 next**.
- **B:** `FOUNDATION_003` + `docs/KOOLERR_MASTER_TRACKER.md` + `docs/status.json` current[10] → Phases **7–9 ✅**; **Phase 10** in progress (milestone-2 tags).

---

## Unresolved SoT conflicts (founder action required)

**C2–C7 below are preserved verbatim and remain UNRESOLVED.** Nothing in the operational records above resolves, narrows, or reinterprets them. Agents must not pick a side on C2–C7. (**C1** is Founder-resolved Version A above.)

### C2 — `status.json` schema vs contents

- `CLAUDE.md` documents minimal schema `{ currentFocus, activeTasks, blockers }`.
- On-branch `docs/status.json` uses `{ completed, current, remaining }` with long prose arrays.

**Ask founder:** Migrate schema, update CLAUDE.md, or accept dual formats with an explicit mapping.

### C3 — Default git branch naming

- GitHub default branch: **`master`**.
- `CLAUDE.md` Git Standards: “Branch from **`main`**. Never commit directly to `main`.”

**Ask founder:** Align CLAUDE.md to `master` or rename default branch.

### C4 — NORTH_STAR.md referenced but missing at root

- `docs/KOOLERR_ENGINEERING_CHARTER.md` lists `NORTH_STAR.md` above Foundation.
- **No `NORTH_STAR.md`** observed at repository root at SoT creation.

**Ask founder:** Add the file, point to another path, or amend Engineering Charter.

### C5 — Branch vs master SHAs (verified at SoT creation)

- `origin/master` ≈ `95dab5fb…` (`95dab5f`).
- Feat HEAD before SoT commit ≈ `b5283625f7e6…` (`b528362`), **5 commits ahead**.
- Do not treat master tip as containing Steps 4–6 / video publishing commits until merged.

### C6 — Tracker honesty vs later Step 5/6 production claims

- Older Tracker prose: Campaign Rendering loop “not yet runtime-verified” / next = production prove.
- Newer `status.json`: Step 5 production video proof + Step 6 provider verification founder-accepted.

**Ask founder:** Which gate closes Campaign Rendering / Launch Integrity “proven in production”?

### C7 — Foreman operating chain vs Engineering Charter roles

- Engineering Charter defines **Founder / CTO / Engineer**.
- This SoT pack declares operating chain **FOUNDER → FOREMAN → ARCHITECT → CLAUDE CODE → INDEPENDENT QA → KOOLERR V1** (see `AGENT_OPERATING_INSTRUCTIONS.md`).

**Ask founder:** Formalize Foreman/Architect/Independent QA in Engineering Charter or keep as agent-ops overlay.
