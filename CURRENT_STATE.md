# CURRENT_STATE.md

> Foreman SoT: observed repository / branch state at SoT pack creation. Evidence-cited.

| Field | Value |
| --- | --- |
| **Base for new implementation branches** | current **`master`** |
| **`master` / `origin/master` tip** | `945f30840680790fcdbced49790a28372e9aab47` (`945f308` — merge of PR #2, SoT pack) |
| **Branch of this refresh slice** | `docs/sot-operational-refresh`, cut from `945f3084…` |
| **Working tree at capture** | clean |
| **Default branch (GitHub)** | `master` (note: `CLAUDE.md` Git Standards say “Branch from `main`” — naming conflict, `DECISIONS.md` C3) |
| **Historical SoT locus** | `feat/phase-5-6-launch-integrity` — the branch the original SoT pack was written against; **no longer the branch new work is cut from** |

---

## Branching workflow (updated at this refresh)

- **Future Claude Code implementation branches are cut from current `master`** — **not** from `feat/phase-5-6-launch-integrity`.
- `master` now contains the nine-file Foreman SoT pack via the **PR #2 merge** at `945f3084…`.
- `feat/phase-5-6-launch-integrity` remains a historical product branch. Its five product commits (YouTube publishing, customer video creation, Steps 5–6 docs, video selection fix — see `MASTER_ROADMAP.md`) are **not** asserted here to be on `master`; the working clone is **shallow (depth 1)**, so ancestry could not be verified in this session. `DECISIONS.md` **C5** stands unresolved.
- The SoT files **not** on this slice's allowlist (`KOOLERR_CONSTITUTION.md`, `MASTER_ROADMAP.md`, `ARCHITECTURE_GUARDRAILS.md`, and the historical tables inside `COMPLETED_WORK.md` / `DECISIONS.md`) still carry `feat/phase-5-6-launch-integrity` in their headers as the SoT-creation locus. That is **preserved deliberately**, not overlooked — realigning them is a Founder-approved follow-up, not this slice.

---

## Open pull requests

| PR | State | Disposition |
| --- | --- | --- |
| **PR #1** | **OPEN** | **Separate product line. Untouched by this slice and not its vehicle.** No agent may push to, rebase, merge, close, or comment on it without explicit Founder instruction. |
| **PR #2** | **MERGED** | Foreman SoT pack (docs-only). Merge SHA `945f30840680790fcdbced49790a28372e9aab47`. Closed the SoT-pack slice — see `COMPLETED_WORK.md`. |

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

---

## Agent toolchain status (declared for Foreman SoT; not inventing product state)

| Capability | Status at this refresh |
| --- | --- |
| Architect Preview MCP | Declared **operational** — **do not call** from agent sessions unless founder explicitly directs |
| Claude Code | **Installed and authenticated** through `claude.ai` (verified). Supersedes the SoT-pack-era “not installed” record. |
| Independent QA | **Still NOT available** |
| Temporary Foreman QA | **Founder-approved substitute**, and **only** for narrowly scoped, non-reserved slices — see `QA_PROTOCOL.md` |

See `AGENT_OPERATING_INSTRUCTIONS.md`.
