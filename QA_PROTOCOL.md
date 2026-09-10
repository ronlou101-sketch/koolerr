# QA_PROTOCOL.md

> Foreman SoT: what testing / quality gates actually exist in-repo. Evidence-based.

| Field | Value |
| --- | --- |
| **Canonical working branch** | `feat/phase-5-6-launch-integrity` |
| **Sources** | `package.json`, `README.md` Available Scripts, `CLAUDE.md` Commit Protocol, `PHASE_7_COMPLETION.md`, `.husky/`, re-verified filesystem |

---

## Implementer testing (not Independent QA)

| Command | Role |
| --- | --- |
| `npm run test` / `npx vitest run` | **Implementer unit/service tests** (Vitest). CLAUDE.md Commit Protocol requires green vitest before commit. |
| `npm run test:watch` | Vitest watch mode |

`PHASE_7_COMPLETION.md` records suite size **833 passed / 52 files** at Phase 7 completion (historical checkpoint; current count may differ on branch — re-run to measure).

Known limitation from Phase 7 report: Vitest runs in **`node` environment** — **no DOM test environment**; interactive UI verified via typecheck + production build, not unit-rendered.

---

## Static checks

| Command | Role |
| --- | --- |
| `npm run lint` | ESLint (`next lint`) |
| `npm run typecheck` / `npx tsc --noEmit` | TypeScript |
| `npm run format` / `npm run format:check` | Prettier |
| `npm run build` | Production build (CLAUDE.md Commit Protocol step) |
| Husky + lint-staged | Git hooks (`package.json` `prepare`: `husky \|\| true`; `.husky/pre-commit` present) |

---

## Independent QA

**NO Independent QA capability is available** in the current operating environment.

There is no separate QA agent, QA workflow, or QA gate beyond implementer tests + static checks + founder/CTO review described in `docs/KOOLERR_ENGINEERING_CHARTER.md`.

---

## CI workflows

**Re-verified at SoT creation:** **no `.github` directory** and **no `.github/workflows`** on this branch.

Do not claim GitHub Actions CI exists until it does.

---

## Playwright / E2E

**NO first-party Playwright E2E suite observed.**

- No `playwright.config.*`.
- `@playwright/test` appears only transitively in `package-lock.json` (vitest-related), not as an application E2E harness.

Foundation `FOUNDATION_002` describes an E2E testing philosophy in principle; that is **not** evidence a Playwright suite is wired.

---

## Agent rule

Agents must run implementer tests + typecheck (+ build when CLAUDE.md protocol applies) for code changes. This documentation-only SoT PR does not require test execution beyond evidence review. **Do not claim Independent QA signed off.**
