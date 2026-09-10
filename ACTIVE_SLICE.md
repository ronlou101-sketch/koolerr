# ACTIVE_SLICE.md

> Foreman SoT: the **one** active slice for agent work right now.

| Field | Value |
| --- | --- |
| **Branch for this slice** | `docs/sot-operational-refresh` |
| **Base commit (checked out)** | `945f30840680790fcdbced49790a28372e9aab47` (`945f308` — merge of PR #2) |
| **Branch cut from** | current `master` (see `CURRENT_STATE.md`) |
| **Prior slice** | SoT pack — **closed complete** (see `COMPLETED_WORK.md`) |

---

## Active slice (this work)

**Name:** SoT operational refresh — close the SoT-pack slice; record the master-based Claude Code workflow and the temporary Foreman QA substitute.

**Scope (documentation only):**

- Close the SoT-pack slice with merge evidence (PR #2, merge SHA `945f3084…`).
- Record that future Claude Code implementation branches are cut from current `master`, not from `feat/phase-5-6-launch-integrity`.
- Record verified Claude Code availability (installed and authenticated through `claude.ai`).
- Record that Independent QA remains **unavailable**, and that Founder-approved **temporary Foreman QA** is the substitute for narrowly scoped, non-reserved slices only.
- Record that **PR #1 remains OPEN and untouched** — separate product line, not the vehicle for this slice.
- **Do not** resolve, reinterpret, or delete `DECISIONS.md` conflicts **C1–C7**.

**Files in scope (allowlist):** `ACTIVE_SLICE.md`, `CURRENT_STATE.md`, `AGENT_OPERATING_INSTRUCTIONS.md`, `QA_PROTOCOL.md`, `DECISIONS.md`, and `COMPLETED_WORK.md` (SoT-pack completion record only).

**Out of scope / forbidden for this slice:** `app/`, `domains/`, `shared/`, `supabase/`, `middleware.ts`, Vercel config, `.env*`, secrets, migrations, RLS/auth, billing, deploy; any change to PR #1; calling Architect Preview MCP; commit / push / merge / branch creation by the implementing agent (Foreman commits).

**Done when:** the six allowlisted files reflect the facts above, `git diff --name-only` shows nothing outside the allowlist, C1–C7 remain present and unresolved, and Foreman has committed the change on `docs/sot-operational-refresh`.

---

## After this slice

Once this refresh is **completed and merged**, there is **no active implementation slice**. The next implementation slice **awaits Founder approval** and must be named by the Founder before any agent begins work.

Agents must not infer, propose-and-start, or self-authorize the next product slice from `MASTER_ROADMAP.md`, `docs/status.json`, or the Tracker — the roadmap narrative itself is an unresolved conflict (`DECISIONS.md` C1).

---

## Explicitly NOT claimed complete by this slice

Do **not** mark as complete solely because of this documentation change:

- Launch Phase 8 / 9 / 10 product outcomes (sources conflict — see `MASTER_ROADMAP.md`, `DECISIONS.md` C1).
- Campaign Rendering production M2 / full runtime proof (C6).
- **Independent QA pass** — Independent QA does not exist; temporary Foreman QA is not Independent QA.
- Any app feature, migration, billing, auth, or provider change.

Product “current” strings in `docs/status.json` (Steps 4–6, CR-\*, Phase 13, etc.) remain **historical / parallel evidence** until the Founder re-points live status.
