# Auto-Merge Activation Record

**Status:** **NOT ACTIVATED** (definition / future evidence record only)  
**Date:** 2026-09-10  
**Authority:** [ADR-027](../adr/ADR-027-auto-merge-governance.md) (**Accepted — not Activated**) + companion [`docs/governance/auto-merge-governance.md`](./auto-merge-governance.md)  
**Architect consult lineage:** `7fbcea46…`, `c630a559…` (and prior `874a9669…`, `330c7d5f…` as context)  
**Founder eligibility decision:** session `t96u`  
**Authors:** KOOLERR FOREMAN / Claude under Architect + Founder direction

> **Hard constraints.** This file is a **future activation / evidence RECORD and DEFINITION
> capture**. It does **not** activate Auto-Merge Governance. Creating or merging this file
> authorizes **no** tooling, GitHub settings, branch protection, CI/workflows, permissions,
> tokens, or enforcement. ADR-027 remains **Accepted — not Activated**; this record does **not**
> amend ADR-027. **Acceptance ≠ Activation.**

---

## 1. Explicit non-activation statements

1. This file does **not** activate Auto-Merge Governance.
2. No tooling, GitHub settings, branch protection, CI/workflows, permissions, tokens, or
   enforcement are authorized by creating this file.
3. ADR-027 remains **Accepted — not Activated**; this record does **not** amend ADR-027.
4. **Independent QA is mandatory** for any future activation / auto-merge use of the eligible
   class.
5. **Temporary Foreman QA is not Independent QA** (coordination/evidence only).
6. Architect clearance is required before any candidate PR in the eligible class may be
   auto-merged after a future activation decision.
7. **Acceptance ≠ Activation.**

---

## 2. Eligible class (Founder — full definition)

**ONLY** documentation-only PRs that:

- modify documentation/content files only;
- contain no executable code;
- contain no application configuration;
- contain no infrastructure;
- contain no database/schema/RLS changes;
- contain no authentication/security changes;
- contain no dependencies or package changes;
- contain no CI/workflow changes;
- contain no GitHub configuration or branch-protection changes;
- contain no permissions/tokens/secrets;
- contain no production settings or deployment changes;
- contain no destructive or irreversible actions.

Being labeled “docs” or touching a `.md` file alone is **NOT** sufficient; the **actual diff**
must satisfy the entire definition.

Everything outside this exact class remains **Founder-gated**.

---

## 3. Required GitHub check categories (after future activation)

Documented as required categories for a **future** activation decision. This record does **not**
claim that any check currently passes or is configured:

- applicable documentation validation
- repository policy/guard checks
- required review/approval status
- merge/branch-protection status

---

## 4. Rollback / audit minimums

At activation time (not now), the following minimums are required:

- rollback/disable capability required at activation time
- durable audit of Architect clearance, checks, approvals, merge outcome
- post-merge traceability to PR and commit

---

## 5. Hard exclusions

The following remain excluded from any auto-merge eligibility (and from any claim that this
file enables them):

- Executable code
- Tests
- Workflows / CI
- Repository and branch settings
- Dependency / configuration changes
- Security-sensitive documentation or policy changes
- Generated artifacts
- All paths other than this designated recording file for activation-recording slices
- Any enablement **now**

---

## 6. Future activation-recording allowlist

Exact future allowlist for activation-recording work (when Founder later authorizes):

**only** `docs/governance/auto-merge-activation-record.md`

No other path is authorized for activation-recording slices by this definition.

---

## 7. Activation evidence (empty template — not activated)

| Field | Value |
| --- | --- |
| Founder activation authorization reference | **N/A — not activated** |
| Architect clearance id | **N/A — not activated** |
| Independent QA reference | **N/A — not activated** |
| Checks recorded | **N/A — not activated** |
| Rollback owner / path | **N/A — not activated** |
| Activation timestamp | **N/A — not activated** |

---

## 8. Cross-references

- [ADR-027 — Auto-Merge Governance](../adr/ADR-027-auto-merge-governance.md) — Accepted — not Activated
- [Auto-Merge Governance (Operational Policy)](./auto-merge-governance.md) — companion policy; not active
- [AMG / Gate #2 Operational Readiness](./amg-operational-readiness.md) — planning / evidence checklist only; **NOT** activation

**Operational ownership note.** Accountable Gate #2 / Independent QA owner remains **TBD** and
requires an explicit **Founder** decision before activation or owner-related operationalization.
This activation record remains **NOT ACTIVATED**; the readiness checklist does not flip that
status, appoint an owner, or authorize enforcement.

Creating this file changes neither ADR-027 nor the companion policy’s activation state.
