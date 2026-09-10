# AGENT_OPERATING_INSTRUCTIONS.md

> Foreman SoT: how agents operate under founder authority. Complements — does not replace — `CLAUDE.md` and Foundation.

| Field | Value |
| --- | --- |
| **Canonical working branch (founder-authorized SoT)** | `feat/phase-5-6-launch-integrity` |
| **HEAD before SoT pack commit** | `b5283625f7e6f78a9382a9a51d4340abdee0f2da` |
| **SoT pack** | Established by the PR that adds these nine root markdown files |

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
| **CLAUDE CODE** | Implementation agent per `CLAUDE.md` | **NOT installed** in this execution environment |
| **INDEPENDENT QA** | Separate verification gate | **NOT available** |
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
- Installing Claude Code or inventing Independent QA sign-off.
- Marking Launch Phase 8+ complete while README/CLAUDE vs Tracker/status conflict remains unresolved.

---

## This environment (evidence + declared)

- Shallow clone / `gh` push authorized for SoT documentation task.
- Cursor CloudAgent historically could not access this private repo — local/`gh` path used instead (task premise).
- Claude Code: **not installed** here.
- Independent QA: **not available**.
- Architect Preview MCP: **operational; do not call**.

---

## Git expectations (from CLAUDE.md, with conflict noted)

- Conventional commits; PRs explain what/why.
- No merge with failing tests (when code changes).
- Default branch on GitHub is **`master`** (CLAUDE.md still says `main` — conflict C3).
- Do not push without founder instruction — **exception:** this SoT pack task explicitly authorizes commit + push + PR open on the feat branch.

---

## Success for the SoT pack slice

Nine root files committed on `feat/phase-5-6-launch-integrity`, PR open to `master`, **no merge**, **no deploy**, **no app/infra/secrets changes**.
