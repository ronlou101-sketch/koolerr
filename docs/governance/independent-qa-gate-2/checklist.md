# Independent QA Gate #2 — Checklist (Definition-Level)

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

Definition-level review criteria and required evidence categories for Gate #2. Outcomes use the vocabulary below. Completing this checklist in documentation form does **not** activate AMG or create merge authority.

---

## 2. Outcome vocabulary

| Outcome | Meaning |
| --- | --- |
| **pass** | All mandatory items pass; evidence linked; no unresolved blocking findings; Independent QA records explicit approval |
| **conditional-pass** | Core mandatory items pass, but time-bounded, documented conditions remain; conditions and owners (placeholders) recorded; not equivalent to unconditional pass for AMG eligibility |
| **fail** | One or more mandatory items fail, or evidence is insufficient / contradictory; remediation required |
| **blocked** | Review cannot complete (COI, missing package, override attempt, no independent reviewer capacity, etc.); no pass/fail on merits until unblocked |

---

## 3. Pass conditions (all required)

Gate #2 may be recorded as **pass** only when **all** of the following hold:

1. All **mandatory** checklist items pass.
2. Evidence is linked in the [evidence manifest](./evidence-manifest-template.md) (no secrets / production data).
3. No unresolved **blocking** findings remain.
4. Independent QA records **explicit approval** on the [disposition record](./disposition-record-template.md).

**Fail** or incomplete review **blocks AMG activation eligibility** (AMG remains **NOT ACTIVATED** regardless) and must record remediation.

---

## 4. Required evidence categories (definition-level)

| # | Category | Mandatory? | Notes |
| --- | --- | --- | --- |
| C1 | Change identity (PR / commit / scope summary) | Yes | Stable identifiers; allowlist awareness where applicable |
| C2 | Independence attestation | Yes | Reviewer not author/Foreman for this package; see COI |
| C3 | Linked validation outputs | Yes | Applicable tests / typecheck / build / docs evidence — as claimed, not invented |
| C4 | Checklist item results | Yes | Each mandatory item marked with result + pointer |
| C5 | Findings / exceptions log | Yes | Empty log allowed if none; unresolved blockers preclude **pass** |
| C6 | Disposition record | Yes | Outcome + rationale + timestamp + reviewer placeholder |
| C7 | Secrets / prod data absent from package | Yes | Manifest must not embed secrets or production data |
| C8 | Scope / out-of-allowlist scan (docs or stated allowlist) | Yes when allowlist claimed | Fail if prohibited paths present for that slice class |
| C9 | Temporary Foreman QA non-conflation | Yes | Package must not claim Foreman QA = Independent QA |

---

## 5. Remediation

On **fail** or incomplete package:

- record required follow-up on the disposition record;
- re-submit only after remediation evidence is linked;
- do not treat Temporary Foreman QA re-check as Independent QA Gate #2 **pass**.
