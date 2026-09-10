# Auto-Merge Governance (Operational Policy)

**Status:** Drafting-only / **not active**  
**Date:** 2026-09-10  
**Authority record:** [ADR-027 — Auto-Merge Governance](../adr/ADR-027-auto-merge-governance.md)  
**Authors:** KOOLERR FOREMAN / Claude under Architect direction (`2ec3800b…`; consult lineage includes `31f8ff9c…`)

> **Hard constraints.** This document is a proposed operational companion to ADR-027. It is
> **documentation only**. It does **not** activate auto-merge. It does **not** change GitHub branch
> protection, CI bots, workflows, tokens, or permissions. **Documentation alone confers no
> auto-merge eligibility.** Until the Founder separately Accepts ADR-027 (or a superseding ADR) **and**
> approves an explicit activation decision, the eligibility allowlist is **empty**. All code, CI/CD,
> permissions, deploy, secrets, security-sensitive, and production-affecting changes remain
> **Founder-gated** unless the Founder later approves a separate explicit exception.

This policy does **not** resolve C2–C7 and must **never** touch PR #1.

---

## 1. Purpose

Define how auto-merge **would** be governed if activated later: who has authority, which change
classes could become eligible, how review roles differ, what audit evidence is required, and how
revocation works.

This policy does **not** turn those controls on.

---

## 2. Authority model

| Role | Authority | Limits |
| --- | --- | --- |
| **Founder** | Sole merge and deploy authority; sole power to Accept ADR-027; sole power to activate, amend eligibility, grant exceptions, or revoke auto-merge | Not replaceable by docs, Architect clearance, or QA labels |
| **Architect (CTO)** | Technical and policy review (Preview MCP consult); may clear drafts/designs | **Not** merge, deploy, or activate auto-merge |
| **Claude / implementing engineer (incl. Foreman implementation)** | Draft and implement within approved scope | **Cannot** self-authorize merge or activation |
| **Temporary Foreman QA** | Narrow, non-reserved substitute verification when Independent QA is unavailable | **≠** Independent QA; **≠** Founder merge/deploy |
| **Independent QA** | Reserved dedicated QA function | **Not available** at time of this draft; must not be claimed via Temporary Foreman QA |

### 2.1 Review-role distinctions (do not conflate)

1. **Architect clearance (Preview MCP consult)** — design/policy soundness only.  
2. **Temporary Foreman QA** — narrow non-reserved substitute checks only.  
3. **Independent QA** — **not available**; do not mark as satisfied by (2).  
4. **Founder merge/deploy authority** — only path to protected merge and production-affecting deploy.

**Temporary Foreman QA ≠ Independent QA.** Architect clearance does not imply merge permission.

---

## 3. Eligible change classes vs Founder-gated classes

### 3.1 Default (current and until activation)

**Nothing is auto-merge eligible.**

A pull request is **not** auto-merge eligible merely because it is documentation, an ADR, or this
governance file. The documentation PR that introduces ADR-027 / this policy remains Founder-gated.

### 3.2 Founder-gated classes (remain gated by default)

Unless the Founder later approves a **separate explicit exception**, the following remain
Founder-gated (non-exhaustive):

- Application or infrastructure **code**
- **CI/CD**, workflows, bots, required checks configuration
- **Permissions**, branch protection, repository access
- **Deploy** and release actions
- **Secrets**, credentials, tokens, key material
- **Security-sensitive** changes (authn/authz, trust, consent, tenant isolation, crypto)
- Any **production-affecting** behavioral, data, or config change
- Enabling or configuring **auto-merge tooling** itself

### 3.3 Future eligibility allowlist

Any non-empty allowlist of auto-merge-eligible classes requires:

1. Founder Acceptance of ADR-027 (or superseding ADR), **and**
2. A separate Founder-approved **activation** decision that names the allowlist, tooling, gates, and
   revocation path.

Until both exist, treat proposed “docs-only” or “chore” classes as **not** eligible.

---

## 4. Rollback / revocation procedure

*Describes the procedure that activation must include. Not operable from this draft alone.*

If auto-merge is ever activated:

1. **Immediate revoke** — Founder (or Founder-recorded break-glass) disables auto-merge / related
   branch rules and stops further automatic merges.
2. **Contain** — identify merges completed under the revoked policy; revert or freeze as Founder
   directs.
3. **Record** — write audit evidence (who revoked, when, why, affected PRs/SHAs, follow-up).
4. **Re-enable** — only by a new Founder explicit decision; documentation edits alone do not
   re-activate.

Drafting this section does **not** create GitHub or CI controls.

---

## 5. Required audit evidence

For any future auto-merge activation, exception, or merge performed under an activated policy,
retain at least:

| Evidence | Notes |
| --- | --- |
| Architect consult / clearance id | e.g. Preview MCP request id |
| Change class | Mapped to allowlist (empty until activation) |
| Eligibility confirmation | Explicit statement that class is on Founder-approved allowlist |
| QA role used | Label **Temporary Foreman QA** or **Independent QA** accurately; never conflate |
| Founder reference | Activation, exception, or merge authorization as applicable |
| Policy pointers | Link **ADR-027** and this file |
| Rollback readiness | For activation records: named revocation owner/path |

Merging **this** drafting PR requires Founder authority under existing Charter rules; it does not
use auto-merge.

---

## 6. Explicit non-activation status

| Claim | Truth |
| --- | --- |
| “ADR-027 / this policy enables auto-merge” | **False** — drafting only |
| “Docs PRs are auto-merge eligible” | **False** — not by virtue of being documentation |
| “Temporary Foreman QA counts as Independent QA” | **False** |
| “Architect clearance authorizes merge” | **False** |
| “Default eligibility” | **Empty** until Founder Accepts + separately activates |

Cross-reference: [ADR-027](../adr/ADR-027-auto-merge-governance.md).

---

## 7. Relationship to other work

- **Out of scope:** tooling, GitHub auto-merge, branch protection, CI bots, workflows, tokens,
  permissions, C2–C7, PR #1.
- **Foreman** may push/open PR for this documentation after QA; **Founder** remains merge authority.
- Temporary Foreman QA on a documentation draft is a narrow substitute check, not Independent QA and
  not activation.

---

## 8. Amendment

Amendments to eligibility, roles, or activation state require Founder approval and an ADR update
(amend ADR-027 or supersede it). Editing this markdown file alone does not activate or expand
auto-merge.
