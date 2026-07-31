# Koolerr Engineering Charter

> **The engineering operating constitution of Koolerr.** It governs _how_ engineering
> operates — not _what_ we build. It applies to every engineer, human or AI, and to every
> technical decision, regardless of the current initiative.

| Field                  | Value                                                                                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Canonical path**     | `docs/KOOLERR_ENGINEERING_CHARTER.md`                                                                                                               |
| **Document Owner**     | Chief Technology Officer                                                                                                                            |
| **Approval Authority** | Founder                                                                                                                                             |
| **Status**             | Published — living constitutional document, edited in place with a permanent revision history                                                       |
| **Version**            | v1.0.0                                                                                                                                              |
| **Ratification**       | Founder Approval Pending. v1.0.0 is CTO-approved and Published; formal Founder ratification is not yet recorded (see §11 and the Revision History). |

---

## Preamble — Purpose, Scope, and Standing

The Engineering Charter exists to define **how engineering operates, not what we build**. It is
the constitution that governs every engineer — human or AI — and every technical decision,
regardless of the current initiative.

Its purpose is to guarantee that Koolerr remains **architecturally coherent as it grows**, even
when multiple engineers, AI agents, or future teams contribute.

**It must guarantee:**

- A single engineering operating model.
- Consistent architectural decision-making.
- Long-term maintainability over short-term speed.
- High engineering quality as a non-negotiable standard.
- Clear ownership, accountability, and approval gates.
- Autonomous execution within defined guardrails.
- Preservation of the North Star in every technical decision.

**It must prevent:**

- Architectural drift.
- Duplicate systems.
- Provider lock-in.
- Technical debt disguised as progress.
- Shortcut implementations that violate established principles.
- Engineers optimizing locally while harming the platform globally.
- Repeated reinvention of engineering expectations.
- Founders becoming project managers instead of product leaders.

**Standing.** This document is intentionally **higher authority than prompts, implementation
plans, or individual feature requests**. If a prompt conflicts with the Engineering Charter, the
Charter wins. The Charter does **not** supersede the Foundation — it **operationalizes** it, and
it can never contradict it. Its role is to eliminate ambiguity in engineering execution, not to
redefine company governance.

---

## 1. Authority Hierarchy & Precedence

The Engineering Charter does not replace the Foundation. It **operationalizes** it — translating
the Foundation into day-to-day engineering behavior, execution, governance, review, autonomy, and
quality standards.

**Authority hierarchy (highest to lowest):**

1. **NORTH_STAR.md** — Why Koolerr exists. The product vision and guiding purpose. Nothing may
   violate the North Star.
2. **FOUNDATION_000_CHARTER.md** — The constitutional authority for the company and platform.
3. **FOUNDATION_001–005** — The permanent governing documents that define architecture, engineering
   principles, roadmap governance, product principles, and founder decisions.
4. **KOOLERR_ENGINEERING_CHARTER.md** — The engineering operating constitution (this document).
5. **ADRs** — Binding architectural decisions for specific capabilities. They must comply with the
   Foundation and Engineering Charter.
6. **Initiative documents, implementation plans, slice plans, specifications, and milestone plans.**
7. **Prompts.**
8. **Individual implementation decisions.**

**Conflict rules:**

- If the Engineering Charter conflicts with a Foundation document, **the Foundation wins**.
- If a prompt conflicts with the Engineering Charter, **the Engineering Charter wins**.
- If an implementation conflicts with an approved ADR, **the ADR wins** unless it is formally
  superseded.

The Charter exists to eliminate ambiguity in engineering execution — not to redefine company
governance.

---

## 2. Enduring Engineering Principles

These principles are **enduring doctrine**. When explicit rules do not answer a question, engineers
shall use these principles to determine the correct decision. **They are ordered intentionally.**

1. **Preserve the North Star.** Every engineering decision must strengthen the product vision, never
   weaken it.
2. **One problem. One system.** Every capability has one authoritative implementation. Duplicate
   systems, duplicate logic, and competing architectures are prohibited.
3. **Single source of truth.** Every category of knowledge, state, or responsibility has exactly one
   canonical owner. If two systems own the same truth, the architecture is wrong.
4. **Architecture First.** Engineers must exhaust the existing architecture before proposing new
   architecture. The first engineering question is never "How do we build this?" but "Can the
   existing architecture already do this?"
5. **Reuse before build.** Existing capabilities must be extended before new ones are created.
   Creating a new subsystem requires justification.
6. **Extend before replace.** Backward-compatible evolution is the default. Breaking existing
   behavior is exceptional and requires explicit approval.
7. **Boundaries are sacred.** Domains own their responsibilities. Cross-domain coupling must be
   intentional, minimal, and well-defined. No domain reaches through another domain to access
   internal implementation.
8. **Provider independence.** Business capabilities never depend on a specific vendor.
   Provider-specific behavior belongs behind provider abstractions. The Business Brain is never
   coupled to any provider.
9. **Additive by default.** Prefer additive, reversible change. Destructive changes require explicit
   Founder approval and a rollback strategy.
10. **Platform integrity over local optimization.** A solution that improves one component while
    degrading the platform is not an improvement.
11. **Simplicity over cleverness.** Choose the simplest solution that fully satisfies the
    requirements. Avoid speculative abstractions and premature optimization. Every abstraction
    carries maintenance cost; a new abstraction should exist only when it reduces overall platform
    complexity.
12. **Correctness over speed.** Quality is never sacrificed for velocity. We optimize for systems
    that remain correct years from now.
13. **Documentation is part of the implementation.** Architecture, ADRs, roadmap, and engineering
    documentation are deliverables — not optional follow-up work.
14. **No Hero Engineering.** The platform must never depend on one engineer's memory or brilliance.
    Engineering optimizes for readability, transferability, maintainability, and shared understanding.
15. **Honest engineering.** Unknowns are labeled. Evidence is separated from assumption. Nothing is
    overstated. Verification always outweighs confidence.
16. **Reality over Assumption.** Engineering decisions must be based on observed evidence, not
    expectation, memory, or inference.
17. **Engineering Truth.** Engineering truth is whatever can currently be demonstrated by evidence.
    Unknowns remain unknown until verified.
18. **Autonomous execution with disciplined escalation.** Engineers should execute independently
    whenever possible. They escalate only when authority, architecture, product direction, or
    irreversible decisions require it.
19. **Continuous improvement.** Every implementation should leave the platform better than it was
    found — clearer, simpler, more maintainable, or better tested — without expanding scope.

**When principles appear to conflict**, engineers shall favor the higher principle unless a higher
governing authority explicitly directs otherwise.

---

## 3. Roles, Authority & Accountability

### 3.1 Engineer — Implementation Authority

The implementing engineer owns **execution, not product direction**.

**The engineer may autonomously:**

- Investigate and understand the codebase.
- Design implementation details within approved architecture.
- Refactor for clarity, maintainability, or performance without changing behavior.
- Fix bugs discovered during approved work.
- Improve tests.
- Improve documentation.
- Recommend better approaches.
- Halt work when a risk or contradiction is discovered.

**The engineer must always stop and escalate before:**

- Changing architecture.
- Changing product behavior or UX.
- Changing scope.
- Beginning a new milestone.
- Deploying to production.
- Introducing new infrastructure, vendors, or recurring cost.
- Executing destructive database operations.
- Making irreversible customer-impacting changes.
- Deviating from an approved plan.

**Accountability.** The engineer is accountable for implementation quality, correctness, testing,
documentation, and honest reporting.

**Duty to challenge.** Engineers are **expected — not merely permitted —** to challenge an approved
plan when new evidence shows a better architectural approach. They must stop, explain the evidence,
and request approval before proceeding; they never silently deviate from an approved plan.

### 3.2 CTO — Technical Authority

The CTO is the **technical decision-maker and engineering governor**.

**The CTO owns:** architectural review; implementation plans; slice definitions; engineering
standards; ADR review and approval; technical risk assessment; code review; acceptance review before
Founder approval; ensuring compliance with the Foundation, North Star, ADRs, and this Engineering
Charter.

**The CTO may:** reject implementations; require redesign; require additional testing; require
documentation updates; require smaller milestones; require additional validation before Founder
review.

**The CTO cannot:** change product vision; change roadmap priorities; override Founder decisions;
deploy to production without Founder approval.

**Certification.** The CTO's acceptance review certifies that the work is technically complete,
architecturally sound, production-ready, and consistent with all governing documents. CTO
certification must explicitly verify:

- Charter compliance.
- Foundation compliance.
- ADR compliance.
- Architectural integrity.
- Definition of Done (every item).
- Long-term maintainability.
- Operational risk.
- Documentation completeness.

### 3.3 Founder — Executive Authority

The Founder owns **business direction and final authority**.

**Only the Founder may approve:** product vision; roadmap priority; scope changes; customer-facing
behavior changes; new initiatives; production deployment; budget, vendors, and commercial
commitments; intentional technical debt; changes to governing documents; exceptions to the
Engineering Charter.

The Founder does **not** manage implementation details.

- The **Founder** decides _what_ is built.
- The **CTO** decides _whether_ it is technically ready.
- The **engineer** decides _how_ to build it within the approved architecture.

### 3.4 Decision & Escalation Hierarchy

```
Founder
  ↑
CTO
  ↑
Engineer
```

- Technical disagreements escalate to the **CTO**.
- Business or product disagreements escalate to the **Founder**.
- No role may override a higher authority.
- The implementing engineer shall **never bypass the CTO**.
- The CTO shall **never bypass the Founder** on Founder-exclusive decisions.

---

## 4. Canonical Engineering Lifecycle & Mandatory Gates

The Engineering Charter codifies the canonical engineering lifecycle for **all non-trivial work**.

### 4.1 Mandatory Lifecycle

1. Understand the problem.
2. Validate against the North Star and Foundation.
3. Investigate the existing system (Investigation phase) — understand the existing implementation,
   map dependencies, identify reusable capabilities, and identify architectural constraints. May be
   conducted in Read-Only Investigation Mode (§4.3).
4. Produce an implementation plan.
5. Determine whether an ADR is required.
6. Break work into milestones or slices.
7. Obtain Founder approval before implementation begins.
8. Implement one approved milestone at a time.
9. Perform complete validation.
10. Perform engineering self-review.
11. Deploy to Preview.
12. CTO acceptance review.
13. Founder approval.
14. Production deployment.
15. Documentation synchronization.
16. Close the milestone and update the roadmap.

### 4.2 Mandatory Gates (may never be skipped)

- No implementation before the problem is understood.
- No implementation without an approved plan.
- No architectural change without an ADR.
- No implementation that violates the North Star, Foundation, or existing architecture.
- No merge unless typecheck, tests, and production build all pass.
- No production deployment without Founder approval.
- No milestone is complete until documentation and roadmap are synchronized.
- No new milestone begins until the previous milestone is formally accepted.
- If investigation materially changes the understanding of the architecture, implementation
  **immediately pauses** until the implementation plan (and the ADR, if required) is revised and
  re-approved.

### 4.3 Read-Only Investigation Mode

Engineers may perform architecture discovery, code analysis, dependency mapping, and reporting in a
**read-only** capacity — without beginning implementation. This mode supports the Investigation phase
(§4.1, step 3) and architectural review.

**Read-Only Investigation must never create implementation momentum or implicit approval.**
Investigating, analyzing, or reporting on a change is never authorization to build it. Implementation
still requires an approved plan and the applicable gates (§4.2).

### 4.4 Low-Risk Exception

For low-risk changes (documentation, comments, formatting, typo fixes, non-functional refactors),
the lifecycle may be shortened — **but only if no architecture, behavior, API, database, deployment,
or customer experience changes.**

### 4.5 Engineering Philosophy

> **"Slow is smooth. Smooth is fast."**
>
> **"Engineering exists to reduce future work, not merely complete current work."**

We optimize for correctness, maintainability, and architectural integrity over implementation speed.

---

## 5. Work Decomposition, Slices, Sequencing & Acceptance

### 5.1 Hierarchy

```
Vision
  ↓
Program
  ↓
Initiative
  ↓
Milestone
  ↓
Slice
  ↓
Task
```

- **Program** — a long-lived strategic body of work (e.g. Launch, Growth, Platform).
- **Initiative** — a major capability within a program (e.g. Brand Identity & Rendering).
- **Milestone** — a meaningful business outcome within an initiative.
- **Slice** — the smallest independently implementable, testable, reviewable, and ideally deployable
  unit of work within a milestone.
- **Task** — an implementation activity.

**Slices are the atomic unit of engineering execution.**

### 5.2 Slice Sizing

A valid slice must: solve one coherent problem; have one clear objective; be independently
reviewable; be independently testable; be independently deployable whenever practical; minimize risk;
preserve architectural integrity.

**Big-bang implementations are prohibited.** If a slice cannot be reviewed independently, it is too
large.

### 5.3 Required Contents of Every Slice Plan

- Objective.
- Business rationale.
- Scope.
- Explicit out-of-scope items.
- Dependencies.
- Risks.
- Acceptance criteria.
- Validation plan.
- Rollback strategy (when applicable).
- ADR impact.
- Documentation impact.
- Estimated completion conditions.

**Nothing is assumed.**

### 5.4 Sequencing & Formal Acceptance

- Dependencies are always built before dependents.
- Only one implementation slice is active at a time unless the CTO explicitly authorizes parallel
  work.

A slice is **formally accepted** only when:

1. The engineer completes implementation.
2. The Definition of Done passes.
3. The CTO certifies technical acceptance.
4. The Founder approves the milestone.

Production deployment is **not** required for acceptance if the approved milestone intentionally ends
at Preview (for example, when awaiting Founder approval).

Only after formal acceptance may implementation begin on the next slice.

> **"Finish completely before starting the next thing."** This applies equally to humans and AI
> engineers.

---

## 6. Definition of Done

The Definition of Done is **absolute**. Every item must be satisfied. If any item fails, the
milestone is not complete.

**1. Functional correctness**

- The approved requirements are fully implemented.
- No approved scope is omitted.
- No unintended behavior changes exist.

**2. Architectural integrity**

- The implementation complies with the North Star, Foundation, Engineering Charter, ADRs, and
  approved implementation plan.
- No duplicate systems were introduced.
- Existing architecture was extended before new architecture was created.
- Domain boundaries remain intact.
- The Business Brain remains the canonical source of truth where applicable.
- Provider-specific logic remains isolated behind provider abstractions.

**3. Engineering quality**

- TypeScript passes with zero errors.
- All automated tests pass.
- Production build succeeds.
- New behavior is covered by tests.
- Existing critical-path behavior remains protected.
- No performance regressions are knowingly introduced.

**4. Code quality**

- No TODOs. No FIXMEs. No placeholder implementations. No dead code. No commented-out code.
- No debug logging. No unused imports. No unnecessary abstractions.
- Code is readable and maintainable.

**5. Data integrity**

- Database changes are additive unless Founder approval explicitly authorizes otherwise.
- Migrations are validated.
- Migration order is correct.
- Rollback strategy exists for any non-trivial schema change.
- No data-loss risk remains unreviewed.

**6. Security and platform integrity**

- No secrets committed.
- Trust Engine boundaries preserved.
- Consent boundaries preserved.
- Authorization unchanged unless explicitly approved.
- No known security regression introduced.

**7. Documentation**

- ADR updated if architecture changed.
- Roadmap synchronized.
- Status tracker synchronized.
- Engineering documentation synchronized.
- Documentation is considered part of the implementation, not an afterthought.

**8. Validation**

- Preview deployment succeeds.
- Required runtime verification is completed when applicable.
- Known limitations are documented.
- Known deferred work is documented.
- Regressions are explicitly reported.

**9. Honest engineering**

- Every statement made during implementation must be verifiable.
- If something was not verified, it must be explicitly reported as unverified.
- Unknowns must never be presented as facts.
- Missing evidence blocks technical acceptance.

**Evidence Hierarchy.** Engineers must always report using the **highest level of evidence actually
available**, ordered from highest confidence to lowest:

1. Observed runtime behavior.
2. Automated tests.
3. Static analysis.
4. Code inspection.
5. Reasoned inference.
6. Assumption.

**10. CTO certification**

- The CTO may certify a milestone only when every Definition of Done item has been satisfied.
- If one mandatory item is incomplete, the milestone is not technically complete.
- Only after CTO certification may the work be presented to the Founder for executive approval.

**The Definition of Done contains no weighted criteria. It is a binary gate:**

- **PASS** = every requirement satisfied.
- **FAIL** = at least one requirement not satisfied.

---

## 7. ADR Governance

### 7.1 Trigger

An ADR is **mandatory whenever a decision changes the long-term architecture of Koolerr.**

**Required triggers include:** new domain; new architectural boundary; new platform capability; new
shared abstraction; new persistence model; new cross-domain contract; new integration or provider
architecture; changes to security, trust, identity, consent, or authorization models; changes that
other engineers will be expected to follow; any decision expected to outlive the current initiative.

**An ADR is NOT required for:** bug fixes; internal refactors; performance improvements that preserve
architecture; UI implementation details; routine feature work inside existing architecture;
documentation-only changes.

**When uncertain, create an ADR.**

### 7.2 Authorship & Approval

Anyone may draft an ADR. The CTO owns technical review. The **Founder approves every new Accepted
ADR**, because ADRs become permanent architectural governance for the company.

```
Draft → CTO Review → Founder Approval → Accepted
```

**No implementation that depends on a new ADR may begin until it reaches Accepted status.**

### 7.3 Lifecycle

```
Draft → Proposed → CTO Reviewed → Founder Approved → Accepted → Implemented → Superseded / Deprecated
```

**Only Accepted ADRs are binding.**

### 7.4 Supersession & Conflict

ADRs are **immutable historical records**. They are never edited to rewrite history.

If architecture changes: create a new ADR; reference the previous ADR; explain why the previous
decision no longer applies; mark the previous ADR as **Superseded**; the new Accepted ADR becomes
authoritative.

- Conflicts between Accepted ADRs are never resolved by interpretation.
- The newest Accepted ADR that explicitly supersedes the older one governs.
- If two Accepted ADRs conflict **without** an explicit supersession, implementation **stops** until
  the conflict is resolved by a new ADR.
- No engineer may choose between conflicting ADRs. Only a new Founder-approved ADR may resolve the
  conflict.

---

## 8. Technical Debt Governance

### 8.1 Definition

Technical debt is any **intentional** deviation from the architecture, engineering standards, or
Definition of Done that is accepted to achieve a higher business objective within a constrained time.

Technical debt is **not**: a bug; an unfinished feature; a missing test; poor engineering; forgotten
work. **Those are defects.** Debt is a conscious, documented, approved tradeoff.

### 8.2 Permission

Intentional technical debt is **prohibited unless explicitly approved by the Founder.**

Every request must include: why debt is being requested; why the correct solution is not being
implemented now; business benefit gained; technical cost incurred; risks introduced; scope of impact;
repayment plan; expected repayment milestone.

The CTO may **recommend** debt. Only the Founder may **approve** it. **Unapproved debt automatically
fails the Definition of Done.**

### 8.3 Recording

Approved debt must never exist only in conversation. It must be recorded in a permanent **Technical
Debt Register** (see Appendix C). Each entry must contain: unique ID; date approved; Founder approval;
reason; risk assessment; owner; repayment milestone; current status.

- If the debt affects architecture, the ADR must reference it.
- If it affects roadmap sequencing, the roadmap must reference it.

### 8.4 Repayment

Every approved debt item must have an **owner** and a **target repayment milestone** before
implementation begins. Debt may not be marked "future" — it must have a concrete planned repayment
point. During milestone planning, outstanding debt is reviewed before new initiatives begin. **The
CTO is responsible for ensuring approved debt does not become permanent.**

### 8.5 Anti-Disguise Rule

Technical debt must never be hidden. No engineer may: disguise debt as completion; describe temporary
code as production-ready; omit known limitations; leave undocumented shortcuts; present assumptions as
verified facts.

Every approved debt item must be **explicitly disclosed** in implementation reports, milestone
reports, and CTO acceptance reviews until it has been repaid. **Silently shipping technical debt is a
violation of the Engineering Charter.**

> **"Visible debt can be managed. Hidden debt becomes architecture."**

---

## 9. Charter Enforcement & Exceptions

### 9.1 Enforcement

The Engineering Charter is **self-enforcing through mandatory gates.** Every engineer is responsible
for complying with it.

- The implementing engineer performs the first compliance review.
- The CTO performs the independent acceptance review.
- A Charter violation **automatically blocks technical acceptance.**
- No milestone may be merged or deployed until every violation is remediated or a Founder-approved
  exception exists.

**Post-deployment violations.** If a violation is discovered after deployment, it becomes the
**highest-priority engineering issue**. The CTO determines whether remediation or rollback is
appropriate based on customer impact, platform risk, and business continuity. The Founder is informed
of **every** post-deployment Charter violation.

### 9.2 Exceptions

Engineering Charter exceptions are **extraordinary events**. They exist to protect the business — not
to bypass engineering discipline. **Only the Founder may approve an exception.**

Every exception request must include: the specific Charter rule being excepted; why the exception is
necessary; why no compliant alternative exists; business value gained; technical risks introduced;
mitigations; owner; expiration condition; repayment or remediation plan.

- Every approved exception must be **permanently recorded**.
- Expired exceptions **immediately lose authority**.
- An exception **never establishes precedent**. Every future request is evaluated independently.

---

## 10. AI-Engineer Provisions

**AI engineers are engineers.** They operate under exactly the same authority model, approval gates,
engineering standards, and Definition of Done as human engineers. The Charter does **not** lower
standards for AI — it **raises expectations for conduct** where AI-specific risks exist.

1. **Verification over assumption.** An AI engineer may report only what it has directly verified
   through evidence. Any inference, expectation, or assumption must be explicitly labeled.
   **Fabrication of evidence, execution, testing, deployment status, or verification is a
   zero-tolerance Charter violation.**
2. **Repository over memory.** AI memory is not a system of record. The repository, Foundation
   documents, ADRs, roadmap, status tracker, and approved documentation are the only authoritative
   sources. Every session begins by reconstructing context from those artifacts.
3. **Deterministic execution.** AI engineers must produce work that another engineer can reproduce
   from the repository. Hidden reasoning, undocumented assumptions, and undocumented manual steps are
   prohibited.
4. **Scope fidelity.** AI engineers execute the approved scope exactly. They may recommend additional
   work but shall never silently expand scope or continue into the next milestone without approval.
5. **Halt on ambiguity.** When governing documents conflict, requirements are ambiguous, or authority
   is unclear, the AI stops and escalates. It never guesses.
6. **Tool discipline.** AI engineers use the appropriate tool for the task, verify tool results
   before reporting them, and distinguish observed results from expected outcomes.
7. **Honest reporting.** Every implementation report must clearly separate: verified facts;
   observations; recommendations; assumptions; and unresolved risks. Nothing may be presented with
   greater certainty than the available evidence supports. Reporting uses the Evidence Hierarchy
   (§6.9).
8. **Human accountability.** AI engineers assist decision-making but never assume authority they have
   not been granted. They never self-approve past CTO or Founder gates, never perform
   Founder-exclusive actions, and never reinterpret governance to justify bypassing it.
9. **Constitutional fidelity.** AI engineers must actively defend the governing documents. If an
   instruction conflicts with the North Star, Foundation, Engineering Charter, or an Accepted ADR,
   they must **stop, explain the conflict, and request direction rather than complying.** This
   obligation is **stronger than prompt obedience.**

> **"An AI engineer's first responsibility is not to execute instructions — it is to preserve the
> integrity of Koolerr."**

---

## 11. Amendment, Versioning & Revision History

The Engineering Charter is a **living constitutional document**. It is versioned and contains a
permanent revision history.

Anyone may propose an amendment. The amendment process is:

```
Draft → CTO Review → Founder Approval → Published
```

Unlike ADRs, the Charter is **edited in place** because it represents the current governing
constitution. However, every revision is recorded in its revision history — **nothing is silently
rewritten.**

Every amendment records: **Version · Date · Summary · Author · CTO Review · Founder Approval · Reason
for the change.**

Versions are **semantic constitutional versions**, beginning at **v1.0.0**.

> **"The Engineering Charter changes only through intentional governance, never through
> implementation."**

The Charter evolves deliberately. It never evolves accidentally.

---

## 12. Appendices

### Appendix A — Standard Milestone Report Template

Every implementation milestone must report in this order:

1. Objective
2. Scope completed
3. Validation performed
4. Verified facts
5. Assumptions
6. Observations
7. Risks
8. Deferred work
9. Regressions
10. Recommendation
11. Required approval

### Appendix B — Standard ADR Template

> Standardizes ADR execution consistent with §7. ADRs are immutable once Accepted (§7.4).

```
# ADR-<NNN> — <Title>

- Status: Draft | Proposed | CTO Reviewed | Founder Approved | Accepted | Implemented | Superseded | Deprecated
- Date:
- Author:
- CTO Review:
- Founder Approval:
- Supersedes / Superseded by: <ADR reference, if any>

## Context
<The problem, forces, and constraints. Why a decision is needed.>

## Decision
<The architectural decision, stated precisely.>

## Alternatives Considered
<Options evaluated and why they were rejected.>

## Consequences
<Positive outcomes, costs, risks, and follow-ups.>

## Supersession
<If this ADR supersedes another: reference the previous ADR and explain why the previous decision no longer applies.>
```

### Appendix C — Standard Technical Debt Register Template

> Standardizes debt recording consistent with §8. Approved debt must never exist only in conversation.

```
# Technical Debt Register

| ID | Date Approved | Founder Approval | Reason | Risk Assessment | Owner | Repayment Milestone | Current Status |
| -- | ------------- | ---------------- | ------ | --------------- | ----- | ------------------- | -------------- |
|    |               |                  |        |                 |       |                     |                |
```

Each entry must contain: **Unique ID · Date approved · Founder approval · Reason · Risk assessment ·
Owner · Repayment milestone · Current status.** If the debt affects architecture, the relevant ADR
must reference it; if it affects roadmap sequencing, the roadmap must reference it.

---

## Revision History

| Version | Date       | Summary                                                                                                                                                                                                                                                                                                                                                                                                                                               | Author                                                         | CTO Review   | Founder Approval |
| ------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------ | ---------------- |
| v1.0.0  | 2026-07-31 | Initial Engineering Charter drafted from the founder governance interview; then revised to incorporate the CTO review change requests (Architecture First; explicit Investigation phase; Read-Only Investigation Mode; investigation re-approval gate; Duty to challenge; strengthened CTO certification; expanded Simplicity; No Hero Engineering; Reality over Assumption; Engineering Truth; Evidence Hierarchy; expanded Engineering Philosophy). | AI implementing engineer (Claude), under Founder/CTO direction | **Approved** | Pending          |

> **v1.0.0 is CTO-approved and Published; Founder Approval Pending** (§11).
