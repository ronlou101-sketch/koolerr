# CURRENT_STATE.md

> Foreman SoT: observed repository / branch state. Evidence-cited. Last reconciled after the PR #8 merge.

| Field | Value |
| --- | --- |
| **Base for new implementation branches** | current **`master`**, tip `aead9eebb3d814a27d189130c94c918f704a5d09` |
| **`master` / `origin/master` tip** | `aead9eebb3d814a27d189130c94c918f704a5d09` (`aead9ee` — merge of PR #8, AccountMenu keyboard accessibility) |
| **Prior recorded tips** | `b2f9327c61a6af567e78e1b4fb0fdca3acda2e64` (merge of PR #6, NavDropdown) → `ef9502c` (merge of PR #5, SoT post-PR-#4 reconcile) → `7a55a4e3399a08267c9d476e7a56278e9d568f1c` (merge of PR #4, mobile-nav focus containment) → `2ea64c9` (merge of PR #3, SoT operational refresh) → `945f30840680790fcdbced49790a28372e9aab47` (`945f308`, merge of PR #2, SoT pack) |
| **Branch of this reconcile** | `docs/sot-post-pr8-reconcile`, cut from `aead9ee…` |
| **Working tree at capture** | clean |
| **Default branch (GitHub)** | `master` (note: `CLAUDE.md` Git Standards say “Branch from `main`” — naming conflict, `DECISIONS.md` C3) |
| **Historical SoT locus** | `feat/phase-5-6-launch-integrity` — the branch the original SoT pack was written against; **no longer the branch new work is cut from** |

---

## Branching workflow

- **Future Claude Code implementation branches are cut from current `master`** (tip `aead9eebb3d814a27d189130c94c918f704a5d09`) — **not** from `feat/phase-5-6-launch-integrity`.
- `master` contains the nine-file Foreman SoT pack via the **PR #2 merge** at `945f3084…`, its operational refresh via the **PR #3 merge** at `2ea64c9…`, the mobile-nav focus-containment slice via the **PR #4 merge** at `7a55a4e…`, the post-PR-#4 SoT reconcile via the **PR #5 merge** at `ef9502c…`, the desktop NavDropdown keyboard slice via the **PR #6 merge** at `b2f9327…`, and the AccountMenu keyboard slice via the **PR #8 merge** at `aead9ee…`.
- `feat/phase-5-6-launch-integrity` remains a historical product branch. Its five product commits (YouTube publishing, customer video creation, Steps 5–6 docs, video selection fix — see `MASTER_ROADMAP.md`) are **not** asserted here to be on `master`; the working clone is **shallow (depth 1)**, so ancestry could not be verified in this session. `DECISIONS.md` **C5** stands unresolved.
- The SoT files **not** on this reconcile's allowlist (`KOOLERR_CONSTITUTION.md`, `MASTER_ROADMAP.md`, `ARCHITECTURE_GUARDRAILS.md`, `AGENT_OPERATING_INSTRUCTIONS.md`, `QA_PROTOCOL.md`, and the historical tables inside `COMPLETED_WORK.md` / `DECISIONS.md`) still carry earlier SHAs and `feat/phase-5-6-launch-integrity` as the SoT-creation locus. That is **preserved deliberately**, not overlooked — realigning them is a Founder-approved follow-up, not this reconcile.

---

## Pull requests

| PR | State | Disposition |
| --- | --- | --- |
| **PR #1** | **OPEN** | **Separate product line. Untouched by this reconcile and not its vehicle.** No agent may push to, rebase, merge, close, or comment on it without explicit Founder instruction (`DECISIONS.md` O5). |
| **PR #2** | **MERGED** | Foreman SoT pack (docs-only). Merge SHA `945f30840680790fcdbced49790a28372e9aab47`. Closed the SoT-pack slice — see `COMPLETED_WORK.md`. |
| **PR #3** | **MERGED** | SoT operational refresh (docs-only), from `docs/sot-operational-refresh`. Merge SHA `2ea64c9…`. Closed the refresh slice — see `COMPLETED_WORK.md`. |
| **PR #4** | **MERGED** | Mobile navigation keyboard focus containment, from `fix/mobile-nav-focus-trap`. Merge SHA `7a55a4e3399a08267c9d476e7a56278e9d568f1c`. Closed the mobile-nav product slice — see `COMPLETED_WORK.md`. |
| **PR #5** | **MERGED** | SoT post-PR-#4 reconcile (docs-only), from `docs/sot-post-pr4-reconcile`. Merge SHA `ef9502c…`. Recorded the PR #4 merge in the four allowlisted SoT files. |
| **PR #6** | **MERGED** | Desktop NavDropdown keyboard accessibility, from `fix/nav-dropdown-keyboard-a11y`. Merge SHA `b2f9327c61a6af567e78e1b4fb0fdca3acda2e64`. Closed the NavDropdown product slice — see `COMPLETED_WORK.md`, `DECISIONS.md` O9. |
| **PR #7** | **OPEN — superseded** | SoT post-PR-#6 reconcile (docs-only). It was cut before the PR #8 merge and is **stale versus the current `master` tip** `aead9ee…`; the reconcile on `docs/sot-post-pr8-reconcile` supersedes it by covering PR #6 **and** PR #8 together. **Left OPEN deliberately** — closing, merging, rebasing, or commenting on it is a Founder action, not an agent action. Founder should close or discard it in favour of this branch. |
| **PR #8** | **MERGED** | AccountMenu keyboard accessibility, from `fix/account-menu-keyboard-a11y`. Merge SHA `aead9eebb3d814a27d189130c94c918f704a5d09`. Closed the AccountMenu product slice — see `COMPLETED_WORK.md`, `DECISIONS.md` O10. |

---

## What “live status” sources claim

| Source | Claim about current focus |
| --- | --- |
| `docs/status.json` | Machine-readable SoT for `/tracker` per `CLAUDE.md` Tracker Workflow and Tracker preamble. Shape on this branch is `{ completed, current, remaining }` (broader than the minimal 3-field schema described in `CLAUDE.md`). `current[0]` = Step 6 provider verification ✅ founder-accepted (2026-09-04). Also retains older “CURRENT” strings (YouTube publishing, Campaign Rendering CR-*, Phase 13, Phase 7 milestones, etc.). |
| `docs/KOOLERR_MASTER_TRACKER.md` §5 | Launch Phase 10 Private Beta in progress; Experience Phase 13 A/B/C complete; Campaign Rendering CR-1…CR-6c2 code-complete; next called out as production proof / M2 in places. |
| `README.md` / `CLAUDE.md` | Phase 7 complete; **Phase 8 next**. |

**Unresolved conflict:** see `MASTER_ROADMAP.md` / `DECISIONS.md`.

---

## Stack (from README.md)

Next.js 15 App Router · TypeScript 5 · Tailwind + shadcn/ui · Supabase (Postgres + RLS) · Anthropic Claude · Stripe · ESLint · Prettier · Husky + lint-staged · Vitest (`npm run test`).

Deploy target documented in README + ADR-022: **Vercel + Supabase**.

---

## CI / QA observation (re-verified at SoT creation)

- **No `.github/` directory** and **no `.github/workflows`** on this branch.
- **No Playwright project config** (`playwright.config.*` absent). `@playwright/test` appears only as a **transitive** dependency in `package-lock.json` (vitest browser-related), not as an app E2E suite.
- Husky present (`.husky/pre-commit`); `package.json` `prepare`: `husky || true`; lint-staged configured.
- **Vitest suite size at the PR #8 merge: 987 / 987 passing** (as reported at merge; not re-run in
  this documentation-only reconcile). Earlier recorded checkpoints: 955/955 at PR #4, 833 at Phase 7.
- PR #8 verification included a **real-component browser check (PASS)** in addition to Vitest.
  `QA_PROTOCOL.md` still carries the Phase-7-era note that Vitest runs in a `node` environment with
  no DOM test environment; that file is outside this reconcile's allowlist and is **not** realigned
  here. Realigning it is a Founder-approved follow-up.

---

## Agent toolchain status (declared for Foreman SoT; not inventing product state)

| Capability | Status at this refresh |
| --- | --- |
| Architect Preview MCP | Declared **operational** — **do not call** from agent sessions unless founder explicitly directs |
| Claude Code | **Installed and authenticated** through `claude.ai` (verified). Supersedes the SoT-pack-era “not installed” record. |
| Independent QA | **Still NOT available** |
| Temporary Foreman QA | **Founder-approved substitute**, and **only** for narrowly scoped, non-reserved slices — see `QA_PROTOCOL.md` |

See `AGENT_OPERATING_INSTRUCTIONS.md`.
