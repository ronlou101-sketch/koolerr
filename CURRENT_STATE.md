# CURRENT_STATE.md

> Foreman SoT: observed repository / branch state at SoT pack creation. Evidence-cited.

| Field | Value |
| --- | --- |
| **Canonical working branch (founder-authorized)** | `feat/phase-5-6-launch-integrity` |
| **HEAD before SoT pack commit** | `b5283625f7e6f78a9382a9a51d4340abdee0f2da` (`b528362 docs: record Step 6 provider verification`) |
| **`origin/master`** | `95dab5f` — feat is **5 commits ahead**, **0 behind** |
| **Working tree at capture** | clean |
| **Default branch (GitHub)** | `master` (note: `CLAUDE.md` Git Standards say “Branch from `main`” — naming conflict) |

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

| Capability | Status at SoT pack |
| --- | --- |
| Architect Preview MCP | Declared **operational** — **do not call** from agent sessions unless founder explicitly directs |
| Claude Code | **Not installed** in this execution environment |
| Independent QA | **Not available** |

See `AGENT_OPERATING_INSTRUCTIONS.md`.
