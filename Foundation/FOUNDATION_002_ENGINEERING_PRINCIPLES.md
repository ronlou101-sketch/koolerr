# FOUNDATION_002_ENGINEERING_PRINCIPLES.md

# Koolerr Engineering Principles

**Version:** 1.0
**Authority:** FOUNDATION_000_CHARTER.md, FOUNDATION_001_ARCHITECTURE.md
**Status:** Permanent

---

## Preamble

This document is the permanent engineering handbook of Koolerr.

It governs how software is written, reviewed, tested, documented, and maintained on this platform.

It applies equally to human engineers and AI coding agents.

It does not describe architecture—that is the responsibility of FOUNDATION_001_ARCHITECTURE.md.

It does not describe product vision—that is the responsibility of FOUNDATION_000_CHARTER.md.

It describes how engineers build at Koolerr.

When engineering decisions conflict with this document, this document prevails.

When this document conflicts with the Architecture specification, the Architecture specification prevails.

When the Architecture specification conflicts with the Charter, the Charter prevails.

---

## 1. Engineering Philosophy

### 1.1 Simplicity

Simplicity is not the absence of sophistication.

Simplicity is the discipline of expressing sophisticated ideas in the clearest possible way.

The goal of every implementation is the simplest solution that correctly solves the problem at hand.

Not the simplest solution the engineer could think of quickly.

Not the most elegant solution the engineer finds intellectually interesting.

The simplest solution that is correct, maintainable, and consistent with platform architecture.

When two solutions solve the same problem with equal correctness, always choose the simpler one.

When a simpler solution requires more upfront thought, take the time.

Complexity accumulated through impatience is the most expensive form of technical debt.

### 1.2 Readability

Code is written once.

Code is read many times.

Every line of code written at Koolerr will be read by engineers who were not present when it was written, by AI agents without context of the original decision, and by the original author months or years later without memory of the original reasoning.

Readability is a form of respect for future readers.

Write code that explains itself through clear naming, clear structure, and clear intent.

Do not write code that requires comments to explain what it does.

Write code that requires comments only to explain why it does something that appears counterintuitive.

Clever code is not good code.

Predictable code is good code.

### 1.3 Long-Term Thinking

Every engineering decision at Koolerr is made with a multi-year time horizon.

Short-term pressures are real.

They do not justify short-term architecture.

Before writing any significant piece of code, ask:

* Will this be easy to understand in two years?
* Will this be easy to change in two years?
* Does this create coupling that will be painful to remove later?
* Does this introduce assumptions that will be violated as the platform grows?

If the answer to any of these questions is unfavorable, reconsider the approach before proceeding.

The cost of fixing a bad decision early is always lower than the cost of living with it.

### 1.4 Quality Over Speed

Koolerr is building an operating system.

Operating systems are not shipped fast and fixed later.

They are built correctly and maintained permanently.

Speed matters.

Velocity matters.

Neither matters more than quality.

A feature shipped quickly that introduces architectural debt, security vulnerabilities, or customer trust violations is not a win.

It is a liability that will cost more to address than the time saved by shipping it fast.

Quality is not slowness.

Quality is building things that do not need to be rebuilt.

---

## 2. Coding Standards

### 2.1 Naming Conventions

Names must communicate intent clearly and completely.

**Variables and functions:** use descriptive names that explain what the variable holds or what the function does. Avoid single-letter names outside of well-understood mathematical contexts. Avoid abbreviations unless the abbreviation is universally understood within the domain.

**Boolean variables and functions:** name them as questions or states. A function that returns a boolean should read as a question: `isEligible`, `hasPermission`, `canPublish`.

**Domain entities:** use the exact names defined in FOUNDATION_001_ARCHITECTURE.md. A Business Brain is a `BusinessBrain`. An Engagement Run is an `EngagementRun`. Platform primitives are never renamed in implementation.

**Files and folders:** use consistent casing conventions appropriate to the language and framework. File names must reflect their primary content. A file that defines the `WorkforceEngine` class must be named accordingly.

**Constants:** named to explain their semantic meaning, not their value. `MAX_CONCURRENT_ENGAGEMENT_RUNS` communicates intent. `NUM_512` does not.

Naming is not cosmetic.

Naming is the first layer of documentation.

### 2.2 Folder Organization

Every domain has its own top-level folder under `domains/`.

Each domain folder contains folders for its primary responsibilities: models, services, repositories, handlers, and tests.

Shared platform utilities live in `shared/`.

No domain-specific code lives in `shared/`.

No shared utility reimplements logic that already exists in a domain.

Infrastructure configuration lives in `infrastructure/`.

Application-level entry points and routing live in `app/`.

Public-facing assets live in `public/`.

Documentation lives in `docs/`.

Scripts for automation, migrations, and tooling live in `scripts/`.

Nothing lives outside these boundaries without explicit architectural justification documented in an Architecture Decision Record.

### 2.3 Documentation Requirements

Every public function, method, class, and module must have a documentation comment that explains:

* What it does
* What its inputs mean
* What its outputs mean
* Any non-obvious preconditions or postconditions

Comments that explain what the code does are a sign that the code is not clear enough.

Comments that explain why a particular approach was chosen, or why an obvious alternative was not used, are valuable.

Documentation comments are written for the reader who has never seen this code before.

Not for the author who just wrote it.

### 2.4 Error Handling

Errors are not exceptional.

Errors are expected outcomes that must be handled explicitly.

Every function that can fail must communicate failure through the language's idiomatic error handling mechanism.

Errors must be specific. A generic error that says "something went wrong" is not an error—it is an obstacle to diagnosis.

Errors must include enough context to understand what was being attempted when the failure occurred.

Errors must be propagated to the appropriate level. Handle an error at the layer that has enough context to handle it meaningfully. Do not swallow errors to make code paths simpler.

Errors must be logged. Every error that surfaces to a system boundary must be captured in the audit log with its context.

Never use exceptions for control flow.

Never silently ignore errors.

### 2.5 Logging Philosophy

Logging exists to support diagnosis, auditability, and observability.

Log events that matter—not events that create noise.

Every consequential operation must produce a log entry: Engagement Runs initiated, Deliverables produced, Trust Engine decisions, consent events, billing events, authentication events, and errors.

Log entries must include:

* A timestamp
* The Tenant and Organization scope
* The actor (user, Digital Employee, or system process)
* The action taken
* The outcome
* Sufficient context to reproduce the state at the time of the event

Do not log sensitive data: secrets, credentials, personally identifiable information, or Business Brain contents in raw form.

Log levels must be used correctly. Debug-level logs are for development environments. Info-level logs are for significant business events. Warning-level logs are for conditions that may indicate a problem. Error-level logs are for failures that require attention.

Logging is infrastructure. It is not an afterthought added when something breaks.

---

## 3. AI Agent Development Rules

These rules govern AI coding agents working on the Koolerr platform.

They carry the same authority as the rules that govern human engineers.

### 3.1 Never Duplicate Logic

If a function, service, or capability already exists on the platform, use it.

Do not reimplement it in a new location because it is faster, because the existing implementation is in a different domain, or because the existing implementation is not exactly what is needed.

If the existing implementation is insufficient, extend it or request that it be extended.

Duplication creates two sources of truth where one existed.

Two sources of truth diverge.

Divergence creates bugs that are expensive to find and expensive to fix.

### 3.2 Never Bypass Architecture

The architectural rules defined in FOUNDATION_001_ARCHITECTURE.md are not suggestions.

An AI agent that bypasses the Model Gateway to invoke an AI provider directly has violated the architecture.

An AI agent that reads another domain's database tables directly has violated the architecture.

An AI agent that stores memory in a Digital Employee rather than the Business Brain has violated the architecture.

These violations must not occur.

If the correct architectural path to accomplish a task is not clear, stop and surface the question. Do not proceed with an architectural workaround.

### 3.3 Prefer Extension Over Modification

When adding new capability, prefer extending an existing component over modifying it.

Modification changes behavior that other parts of the system depend on.

Extension adds behavior that did not exist before.

When modification is genuinely necessary, ensure that existing tests pass and that the change is accompanied by documentation of what changed and why.

### 3.4 Preserve Backwards Compatibility

Changes to interfaces, APIs, data structures, and domain contracts must not silently break existing consumers.

If a breaking change is necessary, it must be:

* Identified explicitly as breaking
* Documented in an Architecture Decision Record
* Communicated to all affected consumers before implementation
* Versioned appropriately so that consumers can migrate on their own schedule

Silent breaking changes are among the most damaging forms of technical debt because they manifest as runtime failures in unrelated parts of the system.

### 3.5 Explain Significant Changes

When an AI agent makes a change that is non-obvious, architectural in nature, or deviates from the most straightforward implementation path, it must explain:

* What it changed
* Why it made that choice
* What alternatives it considered
* Any assumptions it made

This explanation must be present in the pull request description or as a documented comment at the point of deviation.

AI agents that make silent architectural decisions produce codebases that human engineers cannot reason about.

---

## 4. Git Standards

### 4.1 Branch Strategy

The primary branch is `main`.

`main` must always be in a deployable state.

No work is committed directly to `main`.

All work is performed on feature branches created from `main`.

Branch names must follow this convention:

`<type>/<short-description>`

Types:

* `feature/` — new capability
* `fix/` — bug correction
* `refactor/` — structural improvement without behavior change
* `docs/` — documentation changes
* `infra/` — infrastructure and configuration changes
* `test/` — test additions or corrections

Examples:

* `feature/business-brain-memory-retrieval`
* `fix/trust-engine-permission-boundary`
* `refactor/model-gateway-provider-abstraction`

Branch names are lowercase, hyphen-separated, and descriptive enough to communicate the work without reading the code.

### 4.2 Commit Message Conventions

Every commit message follows this structure:

```
<type>(<scope>): <short summary>

<optional body>

<optional footer>
```

The summary line must:

* Begin with a type and optional scope in parentheses
* Use the imperative mood: "add", "fix", "remove", not "added", "fixed", "removed"
* Be 72 characters or fewer
* Describe what the commit does, not what the developer did

Types:

* `feat` — new feature
* `fix` — bug fix
* `refactor` — code restructuring without behavior change
* `docs` — documentation
* `test` — test changes
* `infra` — infrastructure and configuration
* `chore` — maintenance tasks

The body, when present, explains why the change was made.

The body does not describe what the change is—the code shows that.

The footer references related issues, breaking changes, or cross-domain impacts.

### 4.3 Pull Request Expectations

Every pull request must include:

* A title that matches the branch name convention
* A description that explains what changed, why it changed, and any architectural decisions made
* A reference to the relevant Foundation documents or domain responsibilities if the change touches domain boundaries
* A checklist confirming that tests pass, documentation is updated, and no architectural rules have been violated

Pull requests must be reviewed before merging.

Pull requests that touch shared infrastructure, domain interfaces, or security-related code require additional scrutiny.

No pull request may merge with failing tests.

No pull request may merge with known security vulnerabilities introduced by the change.

---

## 5. Testing Philosophy

### 5.1 Unit Testing

Unit tests verify that individual functions and classes behave correctly in isolation.

Every function with meaningful logic must have unit tests.

Unit tests must be fast, deterministic, and isolated from external dependencies.

Unit tests must not make real database queries, real network calls, or real AI invocations.

Unit tests are the first line of defense against regression.

### 5.2 Integration Testing

Integration tests verify that components work correctly together within a domain.

Integration tests may use real databases and real internal services within the domain boundary.

Integration tests must not cross domain boundaries.

If an integration test requires a capability from another domain, it tests the wrong thing. Use the domain's public interface or a test double instead.

Integration tests are slower than unit tests and should be run at minimum before every merge to `main`.

### 5.3 End-to-End Testing

End-to-end tests verify that complete platform workflows produce the correct outcomes for real users.

End-to-end tests exercise the full platform stack from the customer-facing interface through to the Business Brain.

End-to-end tests are the most expensive to write and maintain.

They should cover the most critical customer workflows: hiring a Workforce, executing an Engagement Run, producing and reviewing a Deliverable.

End-to-end tests do not replace unit and integration tests.

They validate that the platform works as a whole, not that each component works in isolation.

### 5.4 Regression Testing

Every bug that is fixed must be accompanied by a test that reproduces the bug.

This test must pass after the fix is applied.

This test must be committed alongside the fix.

This ensures that fixed bugs do not reappear silently as the codebase evolves.

Regression tests are the platform's memory of past failures.

They are never deleted.

---

## 6. Security Standards

### 6.1 Secret Management

Secrets are never stored in code.

Secrets are never stored in configuration files committed to version control.

Secrets are never logged.

Secrets are never transmitted over unencrypted channels.

Secrets are stored in dedicated secrets management infrastructure and accessed at runtime through environment bindings.

Every secret has a defined rotation schedule.

Access to secrets is logged and audited.

Discovering a secret committed to version control is a critical incident regardless of when it occurred or how quickly it is removed.

### 6.2 Authentication

Authentication is the responsibility of the Identity & Access domain.

No domain implements its own authentication logic.

All authentication decisions route through the Identity & Access domain.

Sessions are bound to a single Tenant.

Sessions expire on defined schedules.

Session tokens are never stored in client-side storage that is accessible to third-party scripts.

### 6.3 Authorization

Authorization is enforced at the application layer by the Identity & Access domain and at the database layer by Row-Level Security.

The application layer enforces what a user is permitted to do.

The database layer enforces what data a user is permitted to access.

Both layers must enforce authorization independently.

The failure of either layer must not expose data or capabilities that the other layer would have denied.

Least privilege is the default.

Permissions are granted explicitly.

Permissions are never assumed.

### 6.4 Input Validation

All input entering the platform from external sources—user submissions, API requests, webhook payloads—must be validated before processing.

Validation must confirm that inputs conform to expected types, formats, lengths, and value ranges.

Validation must reject malformed input with a specific, informative error.

Validation is the responsibility of the component that receives the input.

Internal platform components that communicate with each other through defined interfaces may trust that their inputs have already been validated at the boundary—they must not add redundant validation that creates maintenance overhead.

No component may pass unvalidated input to an AI model, a database query, or an external service.

### 6.5 Audit Logging

Every consequential action on the platform must be logged with attribution.

Consequential actions include: authentication events, permission grants and revocations, consent events, Engagement Run initiations and completions, Deliverable publications, billing events, and all Trust Engine decisions.

Audit logs are append-only.

Audit logs are not modified after the fact.

Audit logs are retained according to defined retention policies.

The ability to audit any action taken on the platform is a customer trust commitment—not a compliance checkbox.

---

## 7. Performance Standards

### 7.1 Scalability

Performance decisions are made with scale in mind.

When writing code that handles a single record today, ask whether it will perform acceptably when handling ten thousand records tomorrow.

If the answer is no, design for scale now rather than refactoring under pressure later.

Do not optimize prematurely.

Do not ignore scalability.

The balance is: write code that is correct and scalable in its design, without over-engineering for hypothetical scale that may never materialize.

### 7.2 Caching Philosophy

Caching is used to reduce latency and decrease load on expensive resources.

Caching is never used to work around correctness problems.

Every cache has a defined invalidation strategy.

Caches that can serve stale data must communicate clearly under what conditions staleness is acceptable.

Tenant-scoped caches must never serve one Tenant's data to another Tenant.

Caching Business Brain data requires explicit consideration of freshness requirements—a Digital Employee must never operate on a stale Business Brain snapshot when real-time accuracy is required.

### 7.3 Database Efficiency

Database queries must be written to retrieve only the data they need.

Selecting all columns when only specific columns are needed is not acceptable at production scale.

N+1 query patterns must be identified and eliminated before code reaches production.

Database indexes must be added for all query patterns that will execute at meaningful frequency.

Long-running queries must be identified in development and addressed before they reach production under load.

Database migrations must be designed to be non-breaking, backwards-compatible, and executable without downtime.

### 7.4 Async Processing

Work that does not need to complete synchronously within a user-facing request must be processed asynchronously.

AI invocations, Deliverable generation, Business Brain updates, and billing event processing are candidates for asynchronous processing.

Asynchronous workflows must be designed to handle failure gracefully: tasks that fail must be retried with appropriate backoff, and failures that exhaust retries must be logged and surfaced for inspection.

Asynchronous workflows must produce observable state so that users and operators can understand the progress of long-running operations.

---

## 8. Documentation Standards

### 8.1 Every Major Component Documented

Every domain, every major service, and every public interface must have documentation that explains:

* What it is responsible for
* What it is not responsible for
* How to use its public interface
* What its dependencies are
* What its failure modes are

Documentation is written alongside the code—not after the feature ships.

Documentation that does not exist at merge time does not exist.

### 8.2 Architecture Decision Records

When a significant engineering decision is made—particularly one that deviates from the obvious path, involves a trade-off between competing valid approaches, or establishes a pattern that will be followed by future work—it must be documented as an Architecture Decision Record.

An Architecture Decision Record must include:

* The decision that was made
* The context that prompted the decision
* The alternatives that were considered
* The reasoning for the chosen approach
* The consequences or trade-offs accepted as a result

Architecture Decision Records live in `docs/adr/`.

Architecture Decision Records are never deleted.

If a decision is later reversed, a new Architecture Decision Record is written documenting the reversal and the reasoning behind it.

### 8.3 Updating Foundation Documents

Foundation documents are not static reference material.

They are living governance documents.

When the platform evolves in a way that is consistent with the Foundation but introduces significant new patterns, the relevant Foundation document must be updated to reflect the new pattern.

Foundation document updates require the same level of care and review as architectural changes.

Foundation documents must never be updated to justify a decision that should not have been made.

If a proposed change to a Foundation document would conflict with the Charter, the change must not be made and the original decision must be revisited.

---

## 9. Technical Debt Policy

Technical debt exists in two forms.

**Intentional technical debt** is accepted consciously in exchange for speed, with a defined plan to address it.

**Unintentional technical debt** accumulates through unclear thinking, insufficient review, or disregard for standards.

Koolerr accepts intentional technical debt under the following conditions:

* The debt is explicitly acknowledged at the time the shortcut is taken.
* The nature of the debt is documented in the code and in the pull request.
* A plan exists for when and how the debt will be addressed.
* The debt does not violate the architectural rules in FOUNDATION_001_ARCHITECTURE.md.

Koolerr does not accept unintentional technical debt.

When technical debt is discovered that was not intentionally incurred, it must be logged, prioritized, and addressed on a defined timeline.

Technical debt is never normalized.

A codebase full of acknowledged, documented shortcuts is manageable.

A codebase full of undocumented accumulated shortcuts is a liability that compounds over time.

---

## 10. Non-Negotiable Engineering Rules

These rules apply to every engineer and every AI agent working on Koolerr.

They cannot be waived by business pressure, time constraints, or the preferences of any individual contributor.

**1. No business logic in the database.**
The database stores data. Business logic lives in the application layer within the appropriate domain.

**2. No secrets in code or version control.**
Any secret discovered in code or version control is a critical incident and must be treated as a compromise until proven otherwise.

**3. No untested public interfaces.**
Every public interface must have tests before it is merged. There is no exception for small functions or obvious logic.

**4. No bypassing domain boundaries.**
Domains communicate through defined interfaces. Direct access to another domain's internal state is never permitted.

**5. No architectural changes without an Architecture Decision Record.**
Decisions that change platform architecture, establish new patterns, or deviate from documented approaches must be captured in an Architecture Decision Record before the change is merged.

**6. No broken tests merged to main.**
A failing test is a warning. Merging code with a failing test silences that warning without addressing what it is warning about.

**7. No swallowing errors.**
Every error is either handled at the appropriate layer, propagated to the appropriate caller, or logged with sufficient context for diagnosis. Silently discarding errors is not an option.

**8. No unvalidated input processed.**
Input from any external source must be validated before it is used in any database query, AI invocation, or downstream service call.

**9. No duplication of existing platform capabilities.**
When a capability exists, use it. When it is insufficient, extend it. Never reimplement it.

**10. No deviation from the Foundation without documentation.**
If any rule in the Foundation documents cannot be followed as written, the deviation must be documented, reviewed, and approved before implementation begins. Undocumented deviations are violations—not exceptions.

---

## Closing Statement

These principles are not bureaucracy.

They are the accumulated discipline required to build software that lasts.

A codebase that ignores these principles may ship features faster in the short term.

It will become impossible to maintain, extend, or trust in the long term.

Koolerr is building an operating system.

Operating systems are measured not by how fast their first version ships, but by how well they serve their users a decade after that first version was released.

Every line of code written here is a commitment to that standard.
