# CURRENT_STATE.md

> Foreman SoT: observed repository / branch state. Evidence-cited. Last reconciled after the PR #13 merge.

| Field | Value |
| --- | --- |
| **Base for new implementation branches** | current **`master`**, tip `98bbb0ac62fbd9164cdbd9946aaeeddd060b3f2a` |
| **`master` / `origin/master` tip** | `98bbb0ac62fbd9164cdbd9946aaeeddd060b3f2a` (`98bbb0a` — merge of PR #13, global-error raw-message hardening) |
| **Prior recorded tips** | `bf3c06c` (PR #12) → `5f94fa3` (PR #10) → `aead9ee` (PR #8) → `b2f9327` (PR #6) → `ef9502c` (PR #5, SoT post-PR-#4 reconcile) → `7a55a4e3399a08267c9d476e7a56278e9d568f1c` (PR #4) → `2ea64c9` (PR #3) → `945f30840680790fcdbced49790a28372e9aab47` (PR #2, SoT pack) |
| **Branch of this reconcile** | `docs/sot-post-pr13-reconcile`, cut from `98bbb0a…` |
| **Working tree at capture** | clean |
| **Default branch (GitHub)** | `master` (note: `CLAUDE.md` Git Standards say “Branch from `main`” — naming conflict, `DECISIONS.md` C3) |
| **Historical SoT locus** | `feat/phase-5-6-launch-integrity` — the branch the original SoT pack was written against; **no longer the branch new work is cut from** |

---

## Branching workflow

- **Future Claude Code implementation branches are cut from current `master`** (tip `98bbb0ac62fbd9164cdbd9946aaeeddd060b3f2a`) — **not** from `feat/phase-5-6-launch-integrity`.
- `master` contains the nine-file Foreman SoT pack (**PR #2**, `945f3084…`), its operational refresh (**PR #3**, `2ea64c9…`), the mobile-nav focus-containment slice (**PR #4**, `7a55a4e…`), the post-PR-#4 SoT reconcile (**PR #5**, `ef9502c…`), and the accessibility / error-boundary slices merged since: **PR #6** (`b2f9327…`), **PR #8** (`aead9ee…`), **PR #10** (`5f94fa3…`), **PR #12** (`bf3c06c…`), **PR #13** (`98bbb0a…`). Each is recorded in `COMPLETED_WORK.md`.
- `feat/phase-5-6-launch-integrity` remains a historical product branch. Its five product commits (YouTube publishing, customer video creation, Steps 5–6 docs, video selection fix — see `MASTER_ROADMAP.md`) are **not** asserted here to be on `master`; the working clone is **shallow (depth 1)**, so ancestry could not be verified in this session. `DECISIONS.md` **C5** stands unresolved.
- The SoT files **not** on this reconcile's allowlist (`KOOLERR_CONSTITUTION.md`, `MASTER_ROADMAP.md`, `ARCHITECTURE_GUARDRAILS.md`, `AGENT_OPERATING_INSTRUCTIONS.md`, `QA_PROTOCOL.md`, and the historical tables inside `COMPLETED_WORK.md` / `DECISIONS.md`) still carry earlier SHAs (`945f3084…` and earlier) and `feat/phase-5-6-launch-integrity` as the SoT-creation locus. That is **preserved deliberately**, not overlooked — realigning them is a Founder-approved follow-up, not this reconcile.

---

## Pull requests

| PR | State | Disposition |
| --- | --- | --- |
| **PR #1** | **OPEN** | **Separate product line. Untouched by this reconcile and not its vehicle.** No agent may push to, rebase, merge, close, or comment on it without explicit Founder instruction (`DECISIONS.md` O5). |
| **PR #2** | **MERGED** | Foreman SoT pack (docs-only). Merge SHA `945f30840680790fcdbced49790a28372e9aab47`. |
| **PR #3** | **MERGED** | SoT operational refresh (docs-only), from `docs/sot-operational-refresh`. Merge SHA `2ea64c9…`. |
| **PR #4** | **MERGED** | Mobile navigation keyboard focus containment, from `fix/mobile-nav-focus-trap`. Merge SHA `7a55a4e3399a08267c9d476e7a56278e9d568f1c`. |
| **PR #5** | **MERGED** | SoT post-PR-#4 reconcile (docs-only), from `docs/sot-post-pr4-reconcile`. Merge SHA `ef9502c9d64d9f53086e5239fa5f7174e08c5e01`. |
| **PR #6** | **MERGED** | Desktop NavDropdown keyboard navigation, from `fix/nav-dropdown-keyboard-a11y`. Merge SHA `b2f9327c61a6af567e78e1b4fb0fdca3acda2e64`. |
| **PR #7** | **OPEN — superseded** | SoT reconcile PR opened after PR #6 and never merged. Its content is superseded by this post-PR-#13 reconcile. **Record only — do not close, push to, rebase, or comment on it** without explicit Founder instruction. |
| **PR #8** | **MERGED** | AccountMenu keyboard navigation, from `fix/account-menu-keyboard-a11y`. Merge SHA `aead9eebb3d814a27d189130c94c918f704a5d09`. |
| **PR #9** | **OPEN — superseded** | SoT reconcile PR opened after PR #8 and never merged. Superseded by this reconcile. **Record only — do not close or otherwise act on it.** |
| **PR #10** | **MERGED** | Platform empty state + route error boundary accessibility, from `fix/platform-empty-error-a11y`. Merge SHA `5f94fa301fc67296ec1bf632fdf1c4044e565b0d`. |
| **PR #11** | **OPEN — superseded** | SoT reconcile PR opened after PR #10 and never merged. Superseded by this reconcile. **Record only — do not close or otherwise act on it.** |
| **PR #12** | **MERGED** | Root error boundary — no raw `error.message`, from `fix/root-error-no-raw-message`. Merge SHA `bf3c06c7a98c96ea94ba714c5420a190aa33813e`. |
| **PR #13** | **MERGED** | Global error boundary — no raw `error.message`, from `fix/global-error-no-raw-message`. Merge SHA `98bbb0ac62fbd9164cdbd9946aaeeddd060b3f2a`. Closed the global-error slice — see `COMPLETED_WORK.md`, `DECISIONS.md` **O9**. |
| **PR #14** | **OPEN — superseded** | SoT reconcile PR opened after PR #13 and never merged. Superseded by this post-PR-#13 reconcile, which is the current SoT vehicle. **Record only — do not close or otherwise act on it.** |

**On the superseded SoT PRs (#7, #9, #11, #14):** they remain OPEN on GitHub. This reconcile
supersedes their content but takes **no action** on them; disposition is a Founder decision.

---

## What “live status” sources claim

| Source | Claim about current focus |
| --- | --- |
| `docs/status.json` | Machine-readable SoT for `/tracker` per `CLAUDE.md` Tracker Workflow and Tracker preamble. Shape on this branch is `{ completed, current, remaining }` (broader than the minimal 3-field schema described in `CLAUDE.md`). `current[0]` = Step 6 provider verification ✅ founder-accepted (2026-09-04). Also retains older “CURRENT” strings (YouTube publishing, Campaign Rendering CR-*, Phase 13, Phase 7 milestones, etc.). |
| `docs/KOOLERR_MASTER_TRACKER.md` §5 | Launch Phase 10 Private Beta in progress; Experience Phase 13 A/B/C complete; Campaign Rendering CR-1…CR-6c2 code-complete; next called out as production proof / M2 in places. |
| `README.md` / `CLAUDE.md` | Phase 7 complete; **Phase 8 next**. |

**Unresolved conflict:** see `MASTER_ROADMAP.md` / `DECISIONS.md`.

Note: the merged slices #4–#13 are **not** reflected in `docs/status.json`; updating live status is a
Founder-directed action, not part of this documentation-only reconcile.

---

## Stack (from README.md)

Next.js 15 App Router · TypeScript 5 · Tailwind + shadcn/ui · Supabase (Postgres + RLS) · Anthropic Claude · Stripe · ESLint · Prettier · Husky + lint-staged · Vitest (`npm run test`).

Deploy target documented in README + ADR-022: **Vercel + Supabase**.

---

## CI / QA observation (re-verified at SoT creation)

- **No `.github/` directory** and **no `.github/workflows`** on this branch.
- **No Playwright project config** (`playwright.config.*` absent). `@playwright/test` appears only as a **transitive** dependency in `package-lock.json` (vitest browser-related), not as an app E2E suite.
- Husky present (`.husky/pre-commit`); `package.json` `prepare`: `husky || true`; lint-staged configured.
- **Observed at this reconcile:** `node_modules/` is **not installed** in this session's environment, so the Vitest suite could **not** be re-executed here. Test counts recorded in `COMPLETED_WORK.md` are merge-time evidence supplied with each slice, not re-measured in this session.

---

## Agent toolchain status (declared for Foreman SoT; not inventing product state)

| Capability | Status at this refresh |
| --- | --- |
| Architect Preview MCP | Declared **operational** — **do not call** from agent sessions unless founder explicitly directs |
| Claude Code | **Installed and authenticated** through `claude.ai` (verified). Supersedes the SoT-pack-era “not installed” record. |
| Independent QA | **Still NOT available** |
| Temporary Foreman QA | **Founder-approved substitute**, and **only** for narrowly scoped, non-reserved slices — see `QA_PROTOCOL.md` |

See `AGENT_OPERATING_INSTRUCTIONS.md`.
