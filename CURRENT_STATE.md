# CURRENT_STATE.md

> Foreman SoT: observed repository / branch state. Evidence-cited. Last reconciled after the PR #12 merge.

| Field | Value |
| --- | --- |
| **Base for new implementation branches** | current **`master`**, tip `bf3c06c7a98c96ea94ba714c5420a190aa33813e` |
| **`master` / `origin/master` tip** | `bf3c06c7a98c96ea94ba714c5420a190aa33813e` (`bf3c06c` — merge of PR #12, root error boundary raw-message removal) |
| **Prior recorded tips** | `5f94fa3` (PR #10) → `aead9ee` (PR #8) → `b2f9327` (PR #6) → `ef9502c` (PR #5, SoT post-PR-#4 reconcile) → `7a55a4e3399a08267c9d476e7a56278e9d568f1c` (PR #4) → `2ea64c9` (PR #3) → `945f30840680790fcdbced49790a28372e9aab47` (PR #2) |
| **Branch of this reconcile** | `docs/sot-post-pr12-reconcile`, cut from `bf3c06c…` |
| **Working tree at capture** | clean |
| **Default branch (GitHub)** | `master` (note: `CLAUDE.md` Git Standards say “Branch from `main`” — naming conflict, `DECISIONS.md` C3) |
| **Historical SoT locus** | `feat/phase-5-6-launch-integrity` — the branch the original SoT pack was written against; **no longer the branch new work is cut from** |

---

## Branching workflow

- **Future Claude Code implementation branches are cut from current `master`** (tip `bf3c06c7a98c96ea94ba714c5420a190aa33813e`) — **not** from `feat/phase-5-6-launch-integrity`.
- `master` contains the nine-file Foreman SoT pack via the **PR #2 merge** at `945f3084…`, its operational refresh via the **PR #3 merge** at `2ea64c9…`, the mobile-nav focus-containment slice via the **PR #4 merge** at `7a55a4e…`, the post-PR-#4 SoT reconcile via the **PR #5 merge** at `ef9502c…`, and four keyboard-a11y / error-boundary slices via the **PR #6** (`b2f9327…`), **PR #8** (`aead9ee…`), **PR #10** (`5f94fa3…`), and **PR #12** (`bf3c06c…`) merges.
- Merge-commit chain verified in this session by `git log --format='%H %s' --parents`: `bf3c06c` → `5f94fa3` → `aead9ee` → `b2f9327` → `ef9502c` → `7a55a4e` → `2ea64c9` → `945f308`. Each merge's first parent is the prior merge, so all eight are on the `master` first-parent line.
- `feat/phase-5-6-launch-integrity` remains a historical product branch. Its five product commits (YouTube publishing, customer video creation, Steps 5–6 docs, video selection fix — see `MASTER_ROADMAP.md`) are **not** asserted here to be on `master`; the working clone is **shallow (depth 1)**, so ancestry could not be verified in this session. `DECISIONS.md` **C5** stands unresolved.
- The SoT files **not** on this reconcile's allowlist (`KOOLERR_CONSTITUTION.md`, `MASTER_ROADMAP.md`, `ARCHITECTURE_GUARDRAILS.md`, `AGENT_OPERATING_INSTRUCTIONS.md`, `QA_PROTOCOL.md`, and the historical tables inside `COMPLETED_WORK.md` / `DECISIONS.md`) still carry earlier SHAs and `feat/phase-5-6-launch-integrity` as the SoT-creation locus. That is **preserved deliberately**, not overlooked — realigning them is a Founder-approved follow-up, not this reconcile. This drift is now several merges deep (`945f3084…` in those files vs `bf3c06c…` actual), so the follow-up is worth scheduling.

---

## Pull requests

| PR | State | Disposition |
| --- | --- | --- |
| **PR #1** | **OPEN** | **Separate product line. Untouched by this reconcile and not its vehicle.** No agent may push to, rebase, merge, close, or comment on it without explicit Founder instruction (`DECISIONS.md` O5). |
| **PR #2** | **MERGED** | Foreman SoT pack (docs-only). Merge SHA `945f30840680790fcdbced49790a28372e9aab47`. Closed the SoT-pack slice — see `COMPLETED_WORK.md`. |
| **PR #3** | **MERGED** | SoT operational refresh (docs-only), from `docs/sot-operational-refresh`. Merge SHA `2ea64c9…`. Closed the refresh slice — see `COMPLETED_WORK.md`. |
| **PR #4** | **MERGED** | Mobile navigation keyboard focus containment, from `fix/mobile-nav-focus-trap`. Merge SHA `7a55a4e3399a08267c9d476e7a56278e9d568f1c`. Closed the mobile-nav product slice — see `COMPLETED_WORK.md`. |
| **PR #5** | **MERGED** | SoT post-PR-#4 reconcile (docs-only), from `docs/sot-post-pr4-reconcile`. Merge SHA `ef9502c…`. Closed that reconcile — see `COMPLETED_WORK.md`. |
| **PR #6** | **MERGED** | Desktop NavDropdown keyboard navigation, from `fix/nav-dropdown-keyboard-a11y`. Merge SHA `b2f9327…` (`DECISIONS.md` O9). |
| **PR #7** | **OPEN — superseded** | Stale SoT reconcile PR, overtaken by later merges and by this post-PR-#12 reconcile. **Recorded only. Not closed, not commented on, not pushed to** — disposition is the Founder's. |
| **PR #8** | **MERGED** | AccountMenu keyboard navigation, from `fix/account-menu-keyboard-a11y`. Merge SHA `aead9ee…` (`DECISIONS.md` O10). |
| **PR #9** | **OPEN — superseded** | Stale SoT reconcile PR, overtaken by later merges and by this post-PR-#12 reconcile. **Recorded only. Not closed, not commented on, not pushed to.** |
| **PR #10** | **MERGED** | Empty state + platform route error boundary a11y, from `fix/platform-empty-error-a11y`. Merge SHA `5f94fa3…` (`DECISIONS.md` O11). |
| **PR #11** | **OPEN — superseded** | Stale SoT reconcile PR, overtaken by later merges and by this post-PR-#12 reconcile. **Recorded only. Not closed, not commented on, not pushed to.** |
| **PR #12** | **MERGED** | Root error boundary — stop exposing raw `error.message`, from `fix/root-error-no-raw-message`. Merge SHA `bf3c06c7a98c96ea94ba714c5420a190aa33813e`. Closed that product slice — see `COMPLETED_WORK.md`. |

**Note on #7 / #9 / #11:** three successive SoT reconcile PRs were opened and never merged while
product PRs #6, #8, and #10 went in ahead of them. Their content is superseded by this reconcile,
which records all four merges in one pass. They remain **OPEN**; closing them is a Founder action.

---

## What “live status” sources claim

| Source | Claim about current focus |
| --- | --- |
| `docs/status.json` | Machine-readable SoT for `/tracker` per `CLAUDE.md` Tracker Workflow and Tracker preamble. Shape on this branch is `{ completed, current, remaining }` (broader than the minimal 3-field schema described in `CLAUDE.md`). `current[0]` = Step 6 provider verification ✅ founder-accepted (2026-09-04). Also retains older “CURRENT” strings (YouTube publishing, Campaign Rendering CR-*, Phase 13, Phase 7 milestones, etc.). Not updated by the merged a11y/error slices (PRs #6–#12) — those were narrow file-scoped fixes, not project-state changes. |
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
- Vitest runs in the **node** environment — still no DOM test environment (`QA_PROTOCOL.md`). This is why the merged a11y/error slices each extract pure helpers (`nav-dropdown-focus.ts`, `error-copy.ts`) to make behaviour testable without rendering.

---

## Agent toolchain status (declared for Foreman SoT; not inventing product state)

| Capability | Status at this refresh |
| --- | --- |
| Architect Preview MCP | Declared **operational** — **do not call** from agent sessions unless founder explicitly directs. Architect review was obtained for PR #12 (approval `d7ad7777…`) under Founder direction. |
| Claude Code | **Installed and authenticated** through `claude.ai` (verified). Supersedes the SoT-pack-era “not installed” record. |
| Independent QA | **Still NOT available** |
| Temporary Foreman QA | **Founder-approved substitute**, and **only** for narrowly scoped, non-reserved slices — see `QA_PROTOCOL.md` |

See `AGENT_OPERATING_INSTRUCTIONS.md`.
