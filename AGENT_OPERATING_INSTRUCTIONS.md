# AGENT_OPERATING_INSTRUCTIONS.md

> Foreman SoT: how agents operate under founder authority. Complements — does not replace — `CLAUDE.md` and Foundation.

| Field | Value |
| --- | --- |
| **Base for new implementation branches** | current **`master`** (tip `945f30840680790fcdbced49790a28372e9aab47`) |
| **Historical SoT locus** | `feat/phase-5-6-launch-integrity` — no longer the branch new work is cut from |
| **SoT pack** | Established by PR #2, **merged** at `945f3084…` |

---

## Operating chain

```
FOUNDER → FOREMAN → ARCHITECT → CLAUDE CODE → INDEPENDENT QA → KOOLERR V1
```

| Role | Responsibility (ops overlay) | Status at SoT pack |
| --- | --- | --- |
| **FOUNDER** | Vision, priority, merge/deploy approval, exception grants | Active (Ron Lou) |
| **FOREMAN** | Operating discipline, SoT pack stewardship, conflict surfacing, slice scoping | Active via this pack |
| **ARCHITECT** | Architectural counsel (Preview MCP) | **Preview MCP operational — do not call** unless founder explicitly directs |
| **CLAUDE CODE** | Implementation agent per `CLAUDE.md` | **Installed and authenticated** through `claude.ai` (verified at this refresh) |
| **INDEPENDENT QA** | Separate verification gate | **STILL NOT available** — temporarily substituted by **Foreman QA** for narrowly scoped, non-reserved slices only (`QA_PROTOCOL.md`) |
| **KOOLERR V1** | Product / production outcome | Governed by Foundation + Launch roadmap (see conflicts) |

**Note:** `docs/KOOLERR_ENGINEERING_CHARTER.md` formally defines Founder / CTO / Engineer. The chain above is the **Foreman agent-ops overlay** introduced with this SoT pack; unresolved vs Charter roles = `DECISIONS.md` C7.

---

## Before any structural or product work

1. Read `KOOLERR_CONSTITUTION.md` + relevant Foundation docs (`CLAUDE.md` authority hierarchy).
2. Read `ACTIVE_SLICE.md` — only the active slice is in scope.
3. Read `ARCHITECTURE_GUARDRAILS.md` — non-negotiables.
4. Read `DECISIONS.md` — do not silently pick a side on open conflicts.
5. Prefer evidence in-repo over memory (`docs/KOOLERR_MASTER_TRACKER.md` / `docs/status.json` caveats).

---

## Hard stops (escalate to founder)

- Architecture change without ADR.
- Deploy / merge to `master` without founder instruction.
- Secrets, Stripe/WorkOS/Supabase destructive ops, billing entitlement changes without explicit approval.
- Calling Architect Preview MCP (`consult_architect` or equivalent) without founder direction.
- Inventing Independent QA sign-off, or describing Foreman QA as Independent QA.
- Touching **PR #1** in any way (push, rebase, merge, close, comment) — separate product line, Founder-controlled.
- Starting the next implementation slice before the Founder names and approves it.
- Marking Launch Phase 8+ complete while README/CLAUDE vs Tracker/status conflict remains unresolved.

---

## This environment (evidence + declared, at this refresh)

- Shallow clone (depth 1); `gh` push authorized only when the slice brief says so.
- Cursor CloudAgent historically could not access this private repo — local/`gh` path used instead (task premise).
- Claude Code: **installed and authenticated through `claude.ai`**.
- Independent QA: **not available** — temporary **Foreman QA** substitute per `QA_PROTOCOL.md`.
- Architect Preview MCP: **operational; do not call**.

---

## Branch workflow (updated at this refresh)

- **Cut every new Claude Code implementation branch from current `master`** (`945f3084…`), **not** from `feat/phase-5-6-launch-integrity`. The SoT pack is on `master` as of the PR #2 merge.
- Branch naming per `CLAUDE.md`: `<type>/<short-description>`.
- `feat/phase-5-6-launch-integrity` is historical. Do not resume work on it, and do not assume its product commits are on `master` (`DECISIONS.md` C5 unresolved).

---

## Git expectations (from CLAUDE.md, with conflict noted)

- Conventional commits; PRs explain what/why.
- No merge with failing tests (when code changes).
- Default branch on GitHub is **`master`** (CLAUDE.md still says `main` — conflict C3, unresolved).
- **Do not commit, push, merge, force-push, or create branches without explicit founder/Foreman instruction.** The SoT-pack slice's push exception was slice-specific and has **expired** with that slice's completion. Under the current operating model, **Foreman commits**; the implementing agent edits only.

---

## Success for the current slice

See `ACTIVE_SLICE.md`. The SoT-pack slice is **closed complete** (PR #2 merged at `945f3084…`, recorded in `COMPLETED_WORK.md`). After the current SoT operational refresh merges, **the next implementation slice awaits Founder approval**.
