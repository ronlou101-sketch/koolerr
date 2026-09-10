# ACTIVE_SLICE.md

> Foreman SoT: the **one** active slice for agent work right now.

| Field | Value |
| --- | --- |
| **Branch for this reconcile** | `docs/sot-post-pr8-reconcile` |
| **Base commit (checked out)** | `aead9eebb3d814a27d189130c94c918f704a5d09` (`aead9ee` — merge of PR #8) |
| **Branch cut from** | current `master` (see `CURRENT_STATE.md`) |
| **Prior slice** | AccountMenu keyboard accessibility — **closed complete** (PR #8, see `COMPLETED_WORK.md`) |

---

## Active implementation slice

**There is currently NO active implementation slice.**

The AccountMenu keyboard-accessibility slice is closed complete (PR #8 merged at
`aead9eebb3d814a27d189130c94c918f704a5d09`), as is the desktop NavDropdown slice before it
(PR #6 merged at `b2f9327c61a6af567e78e1b4fb0fdca3acda2e64`). No successor product slice has
been named.

The next implementation slice will be **named by Foreman/Architect** under the autonomous
development loop authorized by the Founder (`DECISIONS.md` **O8**), within the boundaries of the
Constitution, Roadmap, Architecture Guardrails, and Founder-reserved actions.

Agents must **not** infer, propose-and-start, or self-authorize the next product slice from
`MASTER_ROADMAP.md`, `docs/status.json`, or the Tracker — the roadmap narrative itself is an
unresolved conflict (`DECISIONS.md` **C1**). Founder-reserved actions still require the Founder.

---

## Current work (documentation only)

**Name:** SoT post-PR-#8 reconcile — record the merged desktop NavDropdown slice (PR #6) and the
merged AccountMenu slice (PR #8), and move the SoT files off the post-PR-#4 state they still carry.

**Scope:** `ACTIVE_SLICE.md`, `CURRENT_STATE.md`, `COMPLETED_WORK.md`, `DECISIONS.md` (operational
records only).

**Out of scope / forbidden:** the other five SoT files; `app/`, `domains/`, `shared/`, `supabase/`,
`middleware.ts`, package files, Vercel config, `.env*`, secrets, migrations, RLS/auth, billing,
deploy; any change to PR #1; resolving `DECISIONS.md` **C1–C7**; commit / push / merge by the
implementing agent.

**Done when:** the four allowlisted files reflect the facts above, `git diff --name-only` shows
nothing outside the allowlist plus `CLAUDE_SLICE_REPORT.md`, and C1–C7 remain present and unresolved.

---

## Closed prior slices

- **SoT pack** — closed complete, PR #2 merged at `945f3084…` (`COMPLETED_WORK.md`, `DECISIONS.md` O1).
- **SoT operational refresh** — closed complete, PR #3 merged at `2ea64c9…` (`COMPLETED_WORK.md`).
  This file previously described that refresh as the active slice; that text was stale and is now
  superseded.
- **Mobile navigation keyboard focus containment** — closed complete, PR #4 merged at
  `7a55a4e3399a08267c9d476e7a56278e9d568f1c` (`COMPLETED_WORK.md`, `DECISIONS.md` O7).
- **SoT post-PR-#4 reconcile** — closed complete, PR #5 merged at
  `ef9502c…` (documentation-only). This file's post-PR-#4 header text came from that reconcile and
  is now superseded.
- **Desktop NavDropdown keyboard accessibility** — closed complete, PR #6 merged at
  `b2f9327c61a6af567e78e1b4fb0fdca3acda2e64` (`COMPLETED_WORK.md`, `DECISIONS.md` O9).
- **AccountMenu keyboard accessibility** — closed complete, PR #8 merged at
  `aead9eebb3d814a27d189130c94c918f704a5d09` (`COMPLETED_WORK.md`, `DECISIONS.md` O10).

---

## Explicitly NOT claimed complete

Do **not** mark as complete solely because of the merged mobile-nav, NavDropdown, or AccountMenu
slices, or this documentation change:

- Launch Phase 8 / 9 / 10 product outcomes (sources conflict — see `MASTER_ROADMAP.md`, `DECISIONS.md` C1).
- Campaign Rendering production M2 / full runtime proof (C6).
- **Independent QA pass** — Independent QA does not exist; temporary Foreman QA is not Independent QA.
- Any broader accessibility, migration, billing, auth, or provider outcome beyond the specific
  mobile-nav, NavDropdown, and AccountMenu files named in `COMPLETED_WORK.md`. Three navigation
  surfaces now have keyboard handling; that is **not** a platform-wide accessibility claim and no
  accessibility audit, WCAG conformance level, or launch gate is asserted.

Product “current” strings in `docs/status.json` (Steps 4–6, CR-\*, Phase 13, etc.) remain
**historical / parallel evidence** until the Founder re-points live status.
