# Independent QA Gate #2 — Conflict of Interest

**Status:** **DEFINITION-ONLY** (not operational; not enforced)  
**Date:** 2026-09-10  
**Parent:** [README.md](./README.md)  
**Owner designation:** **TBD** (Founder follow-up)

> **Shared status (binding).**
>
> - **AMG / Auto-Merge Governance remains NOT ACTIVATED.**
> - These docs are **definition-only**; they do **not** create enforcement or approval authority.
> - Independent QA Gate #2 owner designation remains **TBD** (Founder follow-up); do not imply an assigned owner.
> - **Temporary Foreman QA is not Independent QA.**

---

## 1. Purpose

Define prohibited reviewer relationships and the recusal / reassignment / escalation process for Gate #2. This file assigns **no** personnel and grants **no** permissions.

---

## 2. Prohibited reviewer relationships

A party **must not** serve as Independent QA Gate #2 reviewer for a change when any of the following hold:

| Prohibition | Rationale |
| --- | --- |
| **Change author** reviewing their own change | Self-review |
| **Foreman** acting as Gate #2 Independent QA reviewer for a package they assembled/submitted | Role conflation; Temporary Foreman QA ≠ Independent QA |
| **Self-review** under any alternate label (agent alias, dual-hat claim) | Independence failure |
| Direct report / reporting-line conflict with author or Foreman for that package | Org independence failure |
| Material personal or operational stake in an immediate **pass** | Bias risk |
| Party who already issued the sole “ready for Gate #2” advocacy without separation of duties | Advocacy vs assessment conflation |

---

## 3. Recusal / reassignment / escalation

1. **Disclose** — potential COI noted on the evidence manifest / disposition record before assessment proceeds.
2. **Recuse** — conflicted party stops Gate #2 review immediately.
3. **Reassign** — route to a non-conflicted Independent QA reviewer capacity (**owner TBD**; placeholder only — no named assignee in this definition pack).
4. **Escalate** — if no independent reviewer capacity exists, or override is attempted, follow [escalation.md](./escalation.md). Gate #2 outcome is **blocked** until resolved.

Do **not** “fix” Gate #2 by substituting Temporary Foreman QA and labeling it Independent QA.

---

## 4. Explicit non-grants

This document:

- does **not** name or appoint reviewers;
- does **not** grant repository, CI, or production permissions;
- does **not** authorize enforcement tooling.
