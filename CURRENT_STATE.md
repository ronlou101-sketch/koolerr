# CURRENT_STATE.md

> Foreman SoT: observed repository / branch state. Evidence-cited. Last reconciled for SoT tip after PRs **#29–#33** on master tip `505e041…`.

| Field | Value |
| --- | --- |
| **Base for new implementation branches** | current **`master`**, tip `505e0413a2d6fc0918c0ed6dc97d95650d777353` |
| **`master` / `origin/master` tip** | `505e0413a2d6fc0918c0ed6dc97d95650d777353` (`505e041` — merge of PR #33, AMG operational-readiness checklist definition only) |
| **Prior recorded tips** | `aa9c106` (PR #32 Independent QA Gate #2 definition-only) → `81fe0f9` (PR #30 stale SoT PR triage) → `b11f03e` (PR #29 SoT tip reconcile #24–#28) → `4dad95f` (PR #28 hermetic validation evidence) → `c685e95` (PR #27 AMG activation record NOT ACTIVATED) → `b17e625` (PR #26 ADR-027 Accepted — not Activated) → `f1daf6f` (PR #25 AMG draft ADR-027) → `85ef083` (PR #24 Phase 7.9 docs) → `d40356d` (PR #23 perf baseline) → `d0bddfa` (PR #22 hermetic E2E) → `c72181f` (PR #21 C1 Version A) → `d26a9be` (PR #20 / 7.6) → `3906e25` (PR #19 / 7.5) → `f837a19` / `24a18b8` / `259bd95` (PRs #18–#16 / 7.3c) → `7a55a4e` (PR #4) → `2ea64c9` (PR #3) → `945f308` (PR #2) |
| **Branch of this reconcile** | `docs/sot-tip-reconcile-29-33`, cut from `505e041…` |
| **Working tree at capture** | clean at slice start; docs-only edits on allowlist |
| **Default branch (GitHub)** | `master` (note: `CLAUDE.md` Git Standards say “Branch from `main`” — naming conflict, `DECISIONS.md` **C3**, still open) |
| **Historical SoT locus** | `feat/phase-5-6-launch-integrity` — **no longer** the branch new work is cut from |

---

## Branching workflow

- **Future Claude Code implementation branches are cut from current `master`** (tip `505e041…`) — **not** from `feat/phase-5-6-launch-integrity`.
- `master` now includes: Foreman SoT pack (PR #2), SoT refresh (PR #3), mobile-nav focus (PR #4), post-PR-#4 reconcile (PR #5), Phase **7.3c** (PRs #16–#18), Phase **7.5** (PR #19), Phase **7.6** (PR #20), **C1 Version A** docs (PR #21), Phase 8 hermetic E2E (PR #22), Phase 8 perf baseline (PR #23), Phase **7.9** docs housekeeping (PR #24), AMG draft ADR-027 + governance (PR #25), ADR-027 Accepted — not Activated (PR #26), AMG activation record **NOT ACTIVATED** (PR #27), Phase 8 hermetic validation evidence (PR #28), SoT tip reconcile after #24–#28 (PR #29), stale SoT PR triage disposition (PR #30), Independent QA Gate #2 definition-only pack (PR #32), AMG operational-readiness checklist definition only (PR #33).
- This branch completes the SoT tip reconcile after PRs **#29–#33** only (docs allowlist).
- `DECISIONS.md` **C5** (feat-branch vs master SHAs at SoT creation) stands unresolved as written.

---

## Pull requests

| PR | State | Disposition |
| --- | --- | --- |
| **PR #1** | **OPEN** | **Separate product line. Untouched.** No agent may push to, rebase, merge, close, or comment on it without explicit Founder instruction (`DECISIONS.md` O5). |
| **PR #2** | **MERGED** | Foreman SoT pack (docs-only). Merge SHA `945f308…`. |
| **PR #3** | **MERGED** | SoT operational refresh. Merge SHA `2ea64c9…`. |
| **PR #4** | **MERGED** | Mobile-nav focus containment. Merge SHA `7a55a4e…`. |
| **PR #5** | **MERGED** | SoT post-PR-#4 reconcile. Merge SHA `ef9502c…`. |
| **PRs #7, #9, #11, #14, #15** | **CLOSED** (without merge) | Stale SoT reconciles; content did **not** land. Triage disposition recorded in PR **#30** (`docs/governance/stale-sot-pr-triage.md`); Founder closed without merge (verified `gh pr view`). |
| **PRs #16–#18** | **MERGED** | Phase **7.3c** dogfooding tests + org-scope + `NOT_FOUND`. Merges `259bd95…`, `24a18b8…`, `f837a19…`. |
| **PR #19** | **MERGED** | Phase **7.5** Stripe webhook-secret SSOT + prod startup assert. Merge `3906e25…`. |
| **PR #20** | **MERGED** | Phase **7.6** layout auth dedupe. Merge `d26a9be…`. |
| **PR #21** | **MERGED** | Docs: Founder-resolved **C1 Version A** (Phase 8 next). Merge `c72181f…`. |
| **PR #22** | **MERGED** | Phase 8 hermetic dogfooding Campaign Architect journey E2E (validation evidence). Merge `d0bddfa…`. |
| **PR #23** | **MERGED** | Phase 8 Campaign Architect perf baseline (validation evidence). Merge `d40356d…`. |
| **PR #24** | **MERGED** | Phase **7.9** docs housekeeping. Merge `85ef083…`. Follows existing 7.9 record; no broader phase closure claim. |
| **PR #25** | **MERGED** | AMG draft ADR-027 + governance. Merge `f1daf6f…`. |
| **PR #26** | **MERGED** | ADR-027 **Accepted — not Activated**. Merge `b17e625…`. |
| **PR #27** | **MERGED** | AMG activation record **NOT ACTIVATED**. Merge `c685e95…`. AMG **parked** — not operationally enabled. |
| **PR #28** | **MERGED** | Phase 8 hermetic validation evidence. Merge `4dad95f…`. Hermetic journey+perf **PASS** at recorded revision; **NOT** live-provider. |
| **PR #29** | **MERGED** | docs(sot): reconcile SoT tip after PRs #24–#28. Merge `b11f03e…`. |
| **PR #30** | **MERGED** | docs(governance): stale SoT PR triage disposition record. Merge `81fe0f9…`. |
| **PR #31** | **OPEN** | SoT micro-reconcile after #30 + stale closes. **Noted** as overlapping/stale vs verified master tip `505e041…` (predates #32/#33). **Disposition unchanged** — no close/supersede/merge decision in this SoT. |
| **PR #32** | **MERGED** | Independent QA Gate #2 definition-only pack. Merge `aa9c106…`. Gate #2 **definition-only / not operational**; owner **TBD**. |
| **PR #33** | **MERGED** | AMG operational-readiness checklist (definition only). Merge `505e041…`. AMG remains **parked / NOT ACTIVATED**; owner **TBD**. |

---

## What “live status” sources claim

| Source | Claim about current focus |
| --- | --- |
| `README.md` / `CLAUDE.md` | **Binding under Founder-resolved C1 Version A (PR #21):** Phase 7 complete; **Phase 8 next** (not complete). |
| `docs/status.json` | Machine-readable tracker; shape `{ completed, current, remaining }`. Tip reconciled to `505e041…` / PRs #29–#33. Still retains older parallel “CURRENT” / Phase 8–10 complete strings — non-binding for “what is next” under C1 Version A. |
| `docs/KOOLERR_MASTER_TRACKER.md` §5 | Historical/parallel Phase 10 / Experience / Campaign Rendering claims — not next-step authority under C1 Version A. |

**C1** Founder-resolved Version A — see `DECISIONS.md`. **C2–C7** remain unresolved.

**AMG:** Accepted-not-Activated / **NOT ACTIVATED** / **parked** (PRs **#25–#27**, readiness checklist **#33**). Gate #2 **definition-only / not operational** (PR **#32**); owner **TBD** (Founder held designation TBD on 2026-09-11). Live-provider validation: outstanding, **Founder-executed**.

---

## Stack (from README.md)

Next.js 15 App Router · TypeScript 5 · Tailwind + shadcn/ui · Supabase (Postgres + RLS) · Anthropic Claude · Stripe · ESLint · Prettier · Husky + lint-staged · Vitest (`npm run test`).

Deploy target documented in README + ADR-022: **Vercel + Supabase**.

---

## CI / QA observation

- Husky present (`.husky/pre-commit`); lint-staged configured.
- Phase 8 hermetic E2E + perf baseline landed on master via PRs **#22** / **#23**; hermetic validation evidence recorded via PR **#28** (validation evidence only — not a claim that Phase 8 product validation is complete; **NOT** live-provider).
- Live-provider validation remains outstanding and **Founder-executed**.
- **Independent QA** still **NOT** available / not operationally available; Gate #2 is **definition-only** (PR **#32**); temporary Foreman QA remains the Founder-approved substitute for narrowly scoped non-reserved slices (`QA_PROTOCOL.md`). Temporary Foreman QA ≠ Independent QA.

---

## Agent toolchain status (declared for Foreman SoT; not inventing product state)

| Capability | Status at this refresh |
| --- | --- |
| Architect Preview MCP | Declared **operational** — **do not call** from agent sessions unless founder explicitly directs |
| Claude Code | **Installed and authenticated** through `claude.ai` (verified). |
| Independent QA | **Still NOT available** / not operationally available (Gate #2 definition-only; owner **TBD**) |
| Temporary Foreman QA | **Founder-approved substitute**, and **only** for narrowly scoped, non-reserved slices — see `QA_PROTOCOL.md`; **≠** Independent QA |
| AMG (Auto-Merge Governance) | **Parked** — Accepted-not-Activated / **NOT ACTIVATED** (PRs #25–#27; readiness checklist #33 definition only); not operationally enabled |

See `AGENT_OPERATING_INSTRUCTIONS.md`.
