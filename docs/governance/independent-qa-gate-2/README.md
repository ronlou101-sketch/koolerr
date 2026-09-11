# Independent QA Gate #2 — Role Charter & Index

**Status:** **DEFINITION-ONLY** (not operational; not enforced)  
**Date:** 2026-09-10  
**Architect allowlist:** `08ece7cf`  
**Owner designation:** **TBD** (Founder follow-up)

> **Shared status (binding).**
>
> - **AMG / Auto-Merge Governance remains NOT ACTIVATED.**
> - These docs are **definition-only**; they do **not** create enforcement or approval authority.
> - Independent QA Gate #2 owner designation remains **TBD** (Founder follow-up); do not imply an assigned owner.
> - **Temporary Foreman QA is not Independent QA.**

---

## 1. Purpose and scope

Independent QA Gate #2 is the **defined** (not yet staffed or enforced) second quality gate for changes that may later seek AMG eligibility or other Founder-gated advancement.

This charter defines:

- role purpose and independence expectations;
- authority boundaries;
- role flow (author → Foreman → Independent QA → Founder escalation);
- inputs / outputs;
- index to sibling definition docs.

It does **not** appoint an owner, grant permissions, activate AMG, or install enforcement tooling.

---

## 2. Authority boundaries

| May | Must not |
| --- | --- |
| Assess Gate #2 evidence against the checklist | Override or waive Gate #2 for the change author or Foreman |
| Record **pass** / **conditional-pass** / **fail** / **blocked** | Merge, deploy, or write to protected repo settings |
| Require remediation before Gate #2 can pass | Touch production, secrets, tokens, or credentials |
| Escalate COI / incomplete review / override attempts | Grant permissions, branch protection, or CI enforcement |
| Fail Gate #2 when mandatory criteria are unmet | Act as Temporary Foreman QA or claim Foreman QA = Independent QA |

**Change author and Foreman cannot override** an Independent QA Gate #2 disposition. Final exception authority remains with the human **Founder** (see [escalation.md](./escalation.md)).

**MV Independent QA** (when designated) has **no** production, deploy, secrets, or repo-write authority via this definition pack.

---

## 3. Independence expectations

Gate #2 review must be **organizationally and operationally separate** from:

- the change **author**;
- the **Foreman** who assembles/submits the package;
- any party with a material interest in an immediate pass.

See [conflict-of-interest.md](./conflict-of-interest.md). Temporary Foreman QA remains a **substitute verification** path only and **must not** be labeled Independent QA.

---

## 4. Role flow

1. **Change author** prepares evidence artifacts (tests, static checks, linked validation outputs, notes).
2. **Foreman** assembles / submits the Gate #2 package (manifest + linked evidence); does **not** act as Gate #2 Independent QA reviewer.
3. **Independent QA reviewer** (owner **TBD**) assesses against [checklist.md](./checklist.md), records disposition, and may fail or require remediation.
4. **Founder** is **escalation / exception only** — not the routine Gate #2 reviewer.

---

## 5. Inputs / outputs

| Direction | Artifacts |
| --- | --- |
| **Inputs** | Change description / PR reference; [evidence manifest](./evidence-manifest-template.md); checklist responses; linked validation outputs; COI attestation |
| **Outputs** | [Disposition record](./disposition-record-template.md); outcome vocabulary result; remediation list (if any); escalation record (if triggered) |

---

## 6. Owner

**Independent QA Gate #2 owner: TBD.** Founder follow-up required before operational use. These definition docs do **not** assign a person, role holder, or agent identity.

---

## 7. Index (sibling definition docs)

| Doc | Role |
| --- | --- |
| [conflict-of-interest.md](./conflict-of-interest.md) | Prohibited relationships; recusal / reassignment / escalation |
| [checklist.md](./checklist.md) | Definition-level criteria; outcome vocabulary; pass conditions |
| [evidence-manifest-template.md](./evidence-manifest-template.md) | Evidence package template fields |
| [disposition-record-template.md](./disposition-record-template.md) | Outcome / rationale / follow-up template |
| [escalation.md](./escalation.md) | Triggers, routing placeholders, Founder final authority |

Cross-link from repo root: [`QA_PROTOCOL.md`](../../../QA_PROTOCOL.md) (Independent QA section).

**Operational readiness dependency (definition only).** Future AMG activation that depends on
Gate #2 also depends on the planning / evidence checklist in
[`../amg-operational-readiness.md`](../amg-operational-readiness.md). That checklist does **not**
make Gate #2 operational, designate an owner, or activate AMG. Status remains **DEFINITION-ONLY**;
owner **TBD**; AMG **NOT ACTIVATED**.

---

## 8. Out of scope

This pack does **not**:

- create enforcement, merge protection, required checks, or deploy gates;
- activate AMG / Auto-Merge Governance;
- appoint Gate #2 owner or grant repository permissions;
- authorize scripts, bots, workflows, CI, or branch-protection changes;
- replace Temporary Foreman QA standing described in `QA_PROTOCOL.md`.
