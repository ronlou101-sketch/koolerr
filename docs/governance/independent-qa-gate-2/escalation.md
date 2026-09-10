# Independent QA Gate #2 — Escalation

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

Define when Gate #2 review must escalate, how routing placeholders work, and that **final authority remains with the human Founder**. This file names **no** individuals and grants **no** permissions.

---

## 2. Escalation triggers

Escalate (and typically record outcome **blocked** until resolved) when any of the following occur:

| Trigger | Example |
| --- | --- |
| **COI** | Author or Foreman attempting Gate #2 Independent QA review |
| **Missing evidence** | Manifest incomplete; mandatory artifacts absent |
| **Conflict** | Disagreement on checklist outcome that cannot be resolved at reviewer level |
| **Override attempts** | Author/Foreman pressure to re-label fail as pass; claiming Temporary Foreman QA = Independent QA |
| **Incomplete review** | No independent reviewer capacity (owner TBD); review abandoned mid-flight |
| **Scope breach** | Package touches prohibited / out-of-allowlist paths for the claimed class |

---

## 3. Routing placeholders (not named people)

| Step | Placeholder role | Action |
| --- | --- | --- |
| 1 | Independent QA reviewer capacity | Attempt non-conflicted reassessment |
| 2 | Foreman (coordination only) | Supply missing evidence; must not dispose Gate #2 |
| 3 | Architect (policy/design consult) | Clarify definition interpretation if needed — **not** merge/deploy |
| 4 | **Founder** | Final exception / authority; only human Founder may grant exception |

Do not invent named assignees in operational tickets from this definition pack alone.

---

## 4. Documentation expectations

Escalations must record at minimum:

- trigger and timestamp;
- linked evidence manifest / disposition IDs;
- parties in placeholder roles (not false name claims);
- interim Gate #2 outcome (**blocked** / **fail** as applicable);
- Founder decision reference when resolved by exception.

---

## 5. Final authority

**Final authority remains with the human Founder.** Definition docs, Architect consults, Foreman coordination, and Temporary Foreman QA do **not** create Gate #2 pass authority or AMG activation.
