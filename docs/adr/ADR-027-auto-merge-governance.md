# ADR-027 — Auto-Merge Governance

- Status: **Accepted — not Activated** (records the governance decision only; **does not** activate auto-merge)
- Date: 2026-09-10
- Author: KOOLERR FOREMAN / Claude under Architect direction (`244270e7…` status update; lineage `2ec3800b…`, `31f8ff9c…`)
- CTO Review: Architect consult (Preview MCP) — policy draft clearance only; does **not** activate controls
- Founder Approval: **Accepted** as governance documentation (status update); **Activation** (tooling / eligibility) remains **not** approved and requires a separate Founder decision; merges remain Founder-gated
- Supersedes / Superseded by: none — companion operational policy: [`docs/governance/auto-merge-governance.md`](../governance/auto-merge-governance.md)

> Governed by the Koolerr Engineering Charter. This ADR is **Accepted — not Activated**: it records
> the governance decision only. Acceptance does **not** activate auto-merge or authorize operational
> implementation. It is **documentation only**. It does **not** enable GitHub auto-merge, branch
> protection changes, CI bots, workflows, tokens, permissions, or enforcement mechanisms.
> Documentation alone confers **no** auto-merge eligibility. Controls described here are **not
> active**.

## Context

Koolerr currently requires Founder authority for merge and deploy of production-affecting work
(Engineering Charter §3 / §4). As documentation and narrowly scoped changes accumulate, there is
interest in defining — in advance — how auto-merge **could** be governed if the Founder later
approves a separate, explicit activation.

Without a written authority model, review-role distinctions, eligibility classes, audit evidence,
and revocation procedure, any future tooling change would risk:

- conflating Temporary Foreman QA with Independent QA;
- treating Architect clearance or documentation PRs as de-facto auto-merge eligibility;
- enabling merge automation without Founder-gated activation and rollback.

This ADR and its companion policy record that framework **only**. They intentionally do **not**
resolve C2–C7, touch PR #1, or introduce tooling. **Independent QA** remains **not available** at
the time of this status update.

### Review-role distinctions (mandatory)

| Role | What it is | What it is not |
| --- | --- | --- |
| **Architect clearance** | Preview MCP consult / CTO technical review of design and policy soundness | Merge authority; deploy authority; auto-merge activation |
| **Temporary Foreman QA** | Narrow, non-reserved substitute QA used when Independent QA is unavailable; scoped checks only | Independent QA; Founder merge/deploy authority; blanket eligibility |
| **Independent QA** | Reserved third-party / dedicated QA function | **Not available** at the time of this draft |
| **Founder merge/deploy authority** | Sole authority to merge to protected integration branches and to deploy / authorize production-affecting outcomes | Delegable by documentation alone |

Temporary Foreman QA ≠ Independent QA. Architect clearance ≠ Founder merge. A documentation PR is
**not** auto-merge eligible merely because it is documentation.

## Decision

1. **Accepted — not Activated.** ADR-027 is **Accepted** as the governance decision record. It is
   **not Activated**. Acceptance does **not** activate auto-merge or authorize operational
   implementation. Until the Founder separately and explicitly approves a distinct **activation**
   decision (tooling, branch protection, CI gates, permissions, tokens, enforcement — out of scope
   here), **nothing is auto-merge eligible**. Default eligibility set remains empty. Future
   activation conditions are **future-only** and require separate Founder authorization.

2. **Authority model (binding when activated; descriptive now).**
   - **Founder** — sole merge and deploy authority; sole authority to Accept this ADR; sole
     authority to activate, revoke, or grant exceptions to auto-merge.
   - **Architect (CTO)** — technical / policy review via Preview MCP; may clear drafts and designs;
     cannot merge, deploy, or activate auto-merge.
   - **Claude / implementing engineer (incl. Foreman implementation)** — drafts and implements
     within approved scope; cannot self-authorize merge or activation.
   - **Temporary Foreman QA** — may perform narrowly scoped substitute verification when Independent
     QA is unavailable; never substitutes for Founder authority or Independent QA sign-off where
     Independent QA is required by a future activation policy.
   - **Independent QA** — reserved role; **not available**; must not be claimed as satisfied by
     Temporary Foreman QA.

3. **Eligible change classes vs Founder-gated classes.**
   - **Default:** no change class is auto-merge eligible.
   - **Founder-gated (non-exhaustive; remains gated unless Founder later approves an explicit
     exception):** code; CI/CD; permissions; deploy; secrets; security-sensitive changes;
     production-affecting changes; branch protection / auto-merge tooling; anything that alters
     runtime behavior, data, authz, or infrastructure.
   - **Documentation / ADR drafts:** may be reviewed under normal process but are **not**
     auto-merge eligible merely because they are documentation. This documentation PR itself is
     Founder-gated to merge.
   - Any future allowlist of eligible classes requires Founder-approved activation and must be
     recorded as an amendment or superseding ADR — not inferred from this draft.

4. **Rollback / revocation.** If auto-merge is ever activated under a future Founder decision, the
   Founder (or a Founder-designated break-glass procedure recorded at activation time) may revoke
   eligibility immediately: disable auto-merge / related branch rules, revert or freeze affected
   merges as needed, and record the revocation in audit evidence. Drafting this ADR does **not**
   create those controls; it only requires that activation (if any) ship with an explicit revocation
   path.

5. **Required audit evidence (for any future activation or for merges under it).** At minimum:
   Architect consult / clearance reference (request id); stated change class; confirmation that the
   change is on an approved eligibility allowlist (empty until activation); QA role actually used
   (Temporary Foreman QA vs Independent QA — never conflated); Founder activation or exception
   reference when applicable; link to this ADR (`ADR-027`) and the companion governance doc.

6. **Out of scope for this decision:** GitHub auto-merge settings; branch protection; CI bots;
   workflows; tokens; permissions; resolving C2–C7; any change to PR #1; any tooling PR.

## Consequences

- Stakeholders have a single **Accepted** reference for how auto-merge **would** be governed if later
  activated.
- No repository behavior changes; no auto-merge enablement; no eligibility conferred by docs alone;
  no tooling, GitHub configuration, CI/workflows, branch protection, permissions, tokens, or
  enforcement mechanisms are enabled or authorized by this status update.
- Merges remain Founder-gated.
- Future activation still requires a separate explicit Founder activation decision with tooling and
  revocation — Acceptance of this ADR alone is insufficient.
- Temporary Foreman QA remains clearly labeled as a narrow substitute; Independent QA remains
  unavailable and must not be falsely asserted.

## Alternatives considered

- **Activate auto-merge with this status update:** rejected — Acceptance records the decision only;
  Founder must separately authorize activation/tooling.
- **Treat all documentation PRs as auto-merge eligible:** rejected — documentation alone confers no
  eligibility; documentation PRs remain Founder-gated.
- **Equate Temporary Foreman QA with Independent QA:** rejected — roles must remain distinct;
  Independent QA is not available.
- **Defer recording Acceptance until tooling lands:** rejected — Founder may Accept the governance
  decision while keeping controls inactive; activation remains a separate decision.
