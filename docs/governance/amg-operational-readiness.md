# AMG / Gate #2 Operational Readiness

**Status:** **PLANNING / EVIDENCE CHECKLIST ONLY** (not authorization; not enforcement)  
**Date:** 2026-09-11  
**AMG / Auto-Merge Governance:** **NOT ACTIVATED**  
**Independent QA Gate #2:** **DEFINITION-ONLY / not operational**  
**Accountable owner (Gate #2 / Independent QA):** **TBD** (Founder decision required)  
**Architect allowlist:** `6ec3e8e6` (prior context `7bb45764`)  
**Authority:** Founder-authorized, Architect-approved documentation-only slice

> **Hard constraints.** This file is a **readiness-definition and planning / evidence checklist**
> only. It does **not** activate Auto-Merge Governance, appoint or designate an owner, enable
> auto-merge, CI, branch protection, deploy gates, permissions, secrets, production, or
> live-provider access. It does **not** claim Independent QA is operational.
> **Temporary Foreman QA ≠ Independent QA.** Acceptance / definition ≠ Activation / operationalization.

---

## 1. Purpose

Define what **operational readiness** means for a **future** AMG activation decision that depends
on Independent QA Gate #2 — without making that decision, without staffing Gate #2, and without
installing enforcement.

This document separates:

| Layer | Meaning in this repo today |
| --- | --- |
| **Definition / policy** | ADR-027 Accepted — not Activated; companion AMG policy; Gate #2 definition pack |
| **Operational readiness** | Evidence that people, procedures, and verification exist to run Gate #2 truthfully (this checklist) |
| **Enforceable controls** | CI, branch protection, required checks, permissions — **out of scope; not authorized here** |
| **Activation authorization** | Explicit Founder activation decision + Architect clearance + recorded evidence — **not made here** |

Creating or merging this file changes **none** of those layers toward activation.

---

## 2. Explicit non-claims

1. AMG / Auto-Merge Governance remains **NOT ACTIVATED**.
2. Independent QA Gate #2 remains **definition-only / not operational**.
3. Gate #2 / Independent QA owner remains **TBD**; no owner is appointed or implied by this file.
4. Temporary Foreman QA is **not** Independent QA.
5. This checklist does **not** authorize tooling, GitHub settings, branch protection, CI/workflows,
   permissions, tokens, secrets, production, or deploy gates.
6. This checklist does **not** amend ADR-027 or flip the activation record toward activation.
7. Completing rows on this checklist in the future still requires a separate Founder activation
   decision; checklist completion alone is **not** activation.

---

## 3. Prerequisites / readiness gaps checklist

Use this as a planning and evidence checklist for a **future** readiness review. Status values
below reflect **current** truth; do not mark gaps closed without durable evidence.

| # | Prerequisite / gap | Current status | Evidence / notes (future) |
| --- | --- | --- | --- |
| 1 | Accountable Gate #2 / Independent QA **owner** designated by Founder | **TBD — Founder decision required** | Appointment / designation record (not created by this doc) |
| 2 | Independent reviewer capacity (separate from author and Foreman) | **Not established** | Named capacity plan after owner designation |
| 3 | Gate trigger & entry criteria documented and understood | **Definition exists; not operationalized** | Link Gate #2 [README](./independent-qa-gate-2/README.md) + [checklist](./independent-qa-gate-2/checklist.md) |
| 4 | Executable Gate #2 procedure (how review is requested, performed, recorded) | **Definition-only; not staffed** | Procedure owned by designated Independent QA (when designated) |
| 5 | Required evidence & retention expectations | **Templates only** | [evidence-manifest-template](./independent-qa-gate-2/evidence-manifest-template.md); retention TBD at operationalization |
| 6 | Pass / fail / conditional-pass / blocked criteria | **Definition-only** | [checklist.md](./independent-qa-gate-2/checklist.md); [disposition-record-template](./independent-qa-gate-2/disposition-record-template.md) |
| 7 | Exception / escalation path | **Definition-only** | [escalation.md](./independent-qa-gate-2/escalation.md) — Founder final authority |
| 8 | Repeatable dry-run or equivalent verification (no production / no auto-merge) | **Not performed** | Dry-run record referencing disposition + manifest templates |
| 9 | Truthful Independent QA operational status statement | **Not operational** (current binding truth) | Must remain truthful until Founder + Architect authorize otherwise |

**Founder decision point (binding):** owner designation / appointment is required **before**
activation or any owner-related operationalization of Gate #2 / Independent QA. This document
does **not** imply that designation has already occurred.

---

## 4. Evidence and review expectations (future activation decision)

Before any **future** Founder activation decision for AMG (eligible documentation-only class),
reviewers should expect durable evidence that:

1. Gate #2 owner has been **explicitly designated by Founder** (not inferred from docs).
2. Independent reviewer capacity exists and COI rules can be followed
   ([conflict-of-interest.md](./independent-qa-gate-2/conflict-of-interest.md)).
3. At least one **repeatable dry-run** (or equivalent non-production verification) exercised
   manifest → checklist → disposition → escalation placeholders without claiming operational QA.
4. Activation evidence fields in [`auto-merge-activation-record.md`](./auto-merge-activation-record.md)
   can be filled truthfully (today all remain **N/A — not activated**).
5. Architect clearance id and Independent QA reference are available for the activation record.
6. Rollback / audit minimums described in the activation record are addressable at activation time.

This section describes **expectations for a future decision**. It does **not** make that decision.

---

## 5. Cross-references (read-only where noted)

| Doc | Role |
| --- | --- |
| [Independent QA Gate #2 README](./independent-qa-gate-2/README.md) | Role charter; DEFINITION-ONLY; owner TBD |
| [Gate #2 checklist](./independent-qa-gate-2/checklist.md) | Pass/fail criteria (definition-level) |
| [Evidence manifest template](./independent-qa-gate-2/evidence-manifest-template.md) | Evidence package fields |
| [Disposition record template](./independent-qa-gate-2/disposition-record-template.md) | Outcome / rationale template |
| [Escalation](./independent-qa-gate-2/escalation.md) | Escalation triggers; Founder final authority |
| [Auto-Merge Activation Record](./auto-merge-activation-record.md) | Future activation evidence record; **NOT ACTIVATED** |
| [ADR-027 — Auto-Merge Governance](../adr/ADR-027-auto-merge-governance.md) | **Read-only ref** — Accepted — not Activated |
| [Auto-Merge Governance (Operational Policy)](./auto-merge-governance.md) | **Read-only ref** — companion policy; not active |

---

## 6. Out of scope

This document does **not**:

- activate AMG / Auto-Merge Governance or flip the activation record toward activation;
- appoint, delegate, or imply a Gate #2 / Independent QA owner;
- enable auto-merge, CI, branch protection, deploy gates, permissions, secrets, production, or
  live-provider access;
- claim Independent QA is operational;
- amend ADR-027 or rewrite `auto-merge-governance.md`;
- install enforcement, required checks, bots, or workflows;
- treat Temporary Foreman QA as Independent QA.

---

## 7. Architect lineage

- **Allowlist for this documentation-only slice:** `6ec3e8e6`
- **Prior context (not this write allowlist):** `7bb45764`

Exact write allowlist for this slice (no expansion):

1. `docs/governance/amg-operational-readiness.md` (**CREATE**)
2. `docs/governance/auto-merge-activation-record.md` (**LIGHT** cross-link / ownership-TBD note only)
3. `docs/governance/independent-qa-gate-2/README.md` (**LIGHT** cross-link / dependency note only)
