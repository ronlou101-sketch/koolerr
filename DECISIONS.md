# DECISIONS.md

> Foreman SoT: where decisions live, and **unresolved conflicts** for the founder.

| Field | Value |
| --- | --- |
| **Base for new implementation branches** | current **`master`** (tip `aead9eebb3d814a27d189130c94c918f704a5d09`) |
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
were added at the **post-PR-#4 reconcile**; **O9–O10** were added at the **post-PR-#8 reconcile**.
None of them is a resolution of C1–C7 and none may be read as such.

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

This is a record of a merge, not a phase, gate, or milestone claim, and it resolves nothing in C1–C7.

### O8 — Founder authorized continuing the autonomous development loop

The Founder has authorized agents to **continue the autonomous development loop** (session
directive), rather than halting after each merged slice as O6 described.

Boundaries — all still binding:

- Work stays inside `KOOLERR_CONSTITUTION.md`, `MASTER_ROADMAP.md`, and `ARCHITECTURE_GUARDRAILS.md`.
- Agents **must not** silently resolve, narrow, or reinterpret **C1–C7**. Those remain Founder
  decisions and must be escalated, not decided.
- **Founder-reserved actions still require the Founder** — merge/deploy approval, PR #1 (O5),
  secrets, billing/entitlements, migrations, RLS/auth, destructive operations, architectural changes
  without an ADR, and calling Architect Preview MCP (`AGENT_OPERATING_INSTRUCTIONS.md` hard stops).
- Temporary Foreman QA keeps its narrow standing under `QA_PROTOCOL.md` and is never Independent QA.

O8 authorizes *continuation of the loop*. It does **not** authorize any specific product slice, does
**not** pick a side in the roadmap conflict (**C1**), and does **not** resolve any of C1–C7.

### O9 — PR #6 merged (desktop NavDropdown keyboard accessibility)

PR **#6**, branch `fix/nav-dropdown-keyboard-a11y`, **merged** into `master` at merge SHA
**`b2f9327c61a6af567e78e1b4fb0fdca3acda2e64`**. Delivered
`app/(platform)/_components/nav-dropdown.tsx`, `nav-dropdown-focus.ts`, and `nav-dropdown.test.ts`.
Recorded in `COMPLETED_WORK.md`; the slice is closed in `ACTIVE_SLICE.md`.

This merge landed on `master` **before** any SoT reconcile recorded it — the SoT files sat at their
post-PR-#4 state through both PR #6 and PR #8. It is recorded here from in-repo git evidence at the
post-PR-#8 reconcile, not from a contemporaneous Foreman record.

This is a record of a merge, not a phase, gate, or milestone claim, and it resolves nothing in C1–C7.

### O10 — PR #8 merged (AccountMenu keyboard accessibility)

PR **#8**, branch `fix/account-menu-keyboard-a11y`, **merged** into `master` at merge SHA
**`aead9eebb3d814a27d189130c94c918f704a5d09`**. Delivered
`app/(platform)/_components/account-menu.tsx` and `account-menu.test.ts`, **reusing** the
`nav-dropdown-focus` helpers from O9 rather than reimplementing roving focus. Evidence at merge:
Vitest **987/987**, real-component browser verification **PASS**, Architect escalation
**`9df588c3…`**, **Founder merged**, no new dependencies. Recorded in `COMPLETED_WORK.md`; the slice
is closed in `ACTIVE_SLICE.md`.

This is a record of a merge, not a phase, gate, or milestone claim, and it resolves nothing in C1–C7.
Three navigation surfaces (mobile nav, NavDropdown, AccountMenu) now have keyboard handling; that is
**not** an accessibility audit, a WCAG conformance claim, or a launch gate.

---

## Unresolved SoT conflicts (founder action required)

**C1–C7 below are preserved verbatim and remain UNRESOLVED.** Nothing in the operational records above resolves, narrows, or reinterprets them — in particular the roadmap-narrative conflict **C1** (README/CLAUDE vs Tracker/`status.json`) is untouched. Agents must not pick a side.

### C1 — Launch phase completion narrative

- **A:** `README.md` + `CLAUDE.md` → Phase 7 ✅; **Phase 8 next**.
- **B:** `FOUNDATION_003` + `docs/KOOLERR_MASTER_TRACKER.md` + `docs/status.json` current[10] → Phases **7–9 ✅**; **Phase 10** in progress (milestone-2 tags).

**Ask founder:** Which document is binding for “what is next”? Update the losers so they stop contradicting.

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
