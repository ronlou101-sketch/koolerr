# QA_PROTOCOL.md

> Foreman SoT: what testing / quality gates actually exist in-repo. Evidence-based.

| Field | Value |
| --- | --- |
| **Base for new implementation branches** | current **`master`** (tip `945f30840680790fcdbced49790a28372e9aab47`) |
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

**NO Independent QA capability is available** in the current operating environment. This remains true at this refresh.

There is no separate QA agent, QA workflow, or QA gate beyond implementer tests + static checks + founder/CTO review described in `docs/KOOLERR_ENGINEERING_CHARTER.md`.

---

## Temporary Foreman QA (Founder-approved substitute)

Because Independent QA does not exist, the Founder has approved **temporary Foreman QA** as the verification gate — **strictly limited** as follows.

**Eligible slices — ALL must hold:**

- The slice is **narrowly scoped** (a small, explicitly enumerated file allowlist).
- The slice touches **no reserved area**: no `app/`, `domains/`, `shared/`, `supabase/`, `middleware.ts`, Vercel config, `.env*`; no secrets, migrations, RLS/auth, billing, or deploy.
- The slice makes **no architectural change** (an architectural change still requires an ADR and Founder approval).
- The Founder has approved the slice brief before work begins.

**What Foreman QA is:** Foreman reviews the diff against the slice allowlist, confirms no prohibited path was touched, confirms the recorded claims match in-repo evidence, and runs the implementer gates that apply (`npx tsc --noEmit`, `npx vitest run`, `npm run build` for code changes; evidence review only for documentation-only slices).

**What Foreman QA is NOT:**

- It is **not Independent QA**. No document, PR, commit message, or agent report may describe it as Independent QA, or claim Independent QA signed off.
- It does **not** cover reserved areas, architectural changes, or broad/multi-domain slices. Those **wait** for real Independent QA or explicit Founder-granted exception.
- It does **not** replace Founder merge/deploy approval.

**Standing:** temporary. It lapses when Independent QA becomes available. The role overlap with `docs/KOOLERR_ENGINEERING_CHARTER.md` (Founder / CTO / Engineer) remains unresolved — `DECISIONS.md` **C7**.

---

## CI workflows

**Re-verified at SoT creation:** **no `.github` directory** and **no `.github/workflows`** on the branch observed then.

Do not claim GitHub Actions CI exists until it does.

---

## Playwright / E2E

**NO first-party Playwright E2E suite observed.**

- No `playwright.config.*`.
- `@playwright/test` appears only transitively in `package-lock.json` (vitest-related), not as an application E2E harness.

Foundation `FOUNDATION_002` describes an E2E testing philosophy in principle; that is **not** evidence a Playwright suite is wired.

---

## Agent rule

Agents must run implementer tests + typecheck (+ build when CLAUDE.md protocol applies) for code changes. Documentation-only slices (including this SoT operational refresh) do not require test execution beyond evidence review. **Do not claim Independent QA signed off** — and do not present temporary Foreman QA as Independent QA.
