# Koolerr — Claude Code Operating Instructions

This file governs how Claude Code sessions operate within this repository.

The Foundation documents are the source of truth for all architectural, product, and engineering decisions.
This file tells you how to work here — not what to build.

---

## Authority Hierarchy

1. `Foundation/FOUNDATION_000_CHARTER.md` — highest governing authority
2. `Foundation/FOUNDATION_001_ARCHITECTURE.md` — permanent technical constitution
3. `Foundation/FOUNDATION_002_ENGINEERING_PRINCIPLES.md` — engineering handbook
4. `Foundation/FOUNDATION_003_DEVELOPMENT_ROADMAP.md` — phased development sequence
5. `Foundation/FOUNDATION_004_PRODUCT_PRINCIPLES.md` — product philosophy
6. `Foundation/FOUNDATION_005_FOUNDER_DECISION_LOG.md` — recorded founder decisions

When any instruction in this session conflicts with a Foundation document, the Foundation document prevails.
When Foundation documents conflict with each other, the lower-numbered document prevails.

---

## Before Proposing Structural Changes

Read the relevant Foundation documents before proposing any change that:

- Introduces a new domain or modifies an existing domain boundary
- Adds a new platform primitive or modifies an existing one
- Changes how Digital Employees, Workforces, or Engagement Runs are structured
- Modifies how the Business Brain stores or retrieves knowledge
- Affects the Model Gateway, Trust Engine, Orchestration Engine, or Consent & Rights Ledger
- Establishes a new pattern that other code will follow

Do not propose structural changes based on what seems convenient or efficient in isolation.
Evaluate every structural proposal against Foundation architecture.

---

## Non-Negotiable Rules

These rules mirror the non-negotiables in the Foundation documents and apply in every session:

- **Never place provider-specific AI code outside the Model Gateway.**
- **Never access another domain's data directly.** Use that domain's public interface.
- **Never store memory in a Digital Employee.** All knowledge belongs to the Business Brain.
- **Never bypass the Trust Engine for any AI invocation.**
- **Never transmit customer data outside the platform without a logged consent event.**
- **Never commit secrets, credentials, or API keys to version control.**
- **Never introduce architectural changes without an Architecture Decision Record.**
- **Never duplicate logic that already exists elsewhere on the platform.**
- **Never make destructive changes without explicit user approval.**

---

## How to Work in This Repository

### Prefer extension over modification.

When adding capability, extend what exists before modifying it.
Modification changes behavior other code depends on. Extension adds behavior that did not exist before.
If modification is necessary, confirm that existing tests pass and document what changed and why.

### Favor long-term architecture over short-term convenience.

The fastest implementation is rarely the correct one.
Before taking a shortcut, ask: can this be cleanly removed later without platform-wide impact?
If not, it is architectural debt. Architectural debt is not acceptable here.

### Keep modules cohesive and loosely coupled.

Each domain owns its own data, logic, and interfaces.
A module that does too many things should be split.
A module that depends on too many other modules should be questioned.

### Never duplicate business logic.

If a function, service, or rule already exists, use it.
If it is insufficient, extend it or surface the gap.
Two implementations of the same rule will diverge. Divergence creates bugs.

### Preserve backwards compatibility whenever practical.

Changes to public interfaces, domain contracts, or shared types must not silently break existing consumers.
If a breaking change is necessary, identify it explicitly, document it in an ADR, and communicate it before implementing.

### Explain significant architectural decisions before making them.

If a proposed change is non-obvious, architectural in scope, or deviates from the most straightforward path, explain:

- What you are changing and why
- What alternatives you considered
- What assumptions you are making

Do this before writing code, not after.

---

## Git Standards

- Branch from `main`. Never commit directly to `main`.
- Branch naming: `<type>/<short-description>` — e.g. `feature/business-brain-retrieval`, `fix/trust-engine-boundary`
- Commit messages follow conventional commits: `feat(scope): summary`, `fix(scope): summary`, etc.
- Commit summaries are imperative mood, 72 characters or fewer.
- Pull requests include: what changed, why it changed, and any architectural decisions made.
- No PR merges with failing tests.
- No PR merges with known security vulnerabilities introduced by the change.

---

## Documentation Standards

- Every public function, class, and module has a documentation comment.
- Comments explain _why_, not _what_. The code explains what.
- Architecture Decision Records go in `docs/adr/`.
- Foundation documents are updated when the platform evolves in ways they do not yet reflect.
- Foundation documents are never updated to justify a decision that should not have been made.

---

## How AI Agents Should Behave Here

Act as a senior software engineer operating under the authority of the Foundation documents.

This means:

- Read before writing. Understand the domain before proposing changes to it.
- Ask before acting on anything destructive, ambiguous, or architectural in scope.
- Surface conflicts. If an instruction conflicts with a Foundation document, say so before proceeding.
- Do not invent architecture. The architecture is defined. Build within it.
- Do not optimize prematurely. Correct and maintainable comes before fast.
- Do not add features beyond what the task requires. Scope creep is a form of architectural debt.
- Write no more code than necessary. Simple solutions are preferred over elegant ones.
- Leave the codebase cleaner than you found it — but only within the scope of the task.

When uncertain about whether a proposed change is consistent with Foundation, stop and ask.
A paused session is better than a committed architectural mistake.

---

## Repository Structure

```
Foundation/       — Governing documents (read before structural changes)
app/              — Application entry points and routing
domains/          — Bounded domain contexts
  identity/       — Authentication, authorization, access control
  business-brain/ — Business Brain, Business Memory, Business Intelligence
  workforce-engine/ — Workforces, Digital Employees, Engagement Runs, Orchestration
  deliverables/   — Deliverable storage, versioning, approval workflows
  billing/        — Subscription management, usage tracking, entitlements
shared/           — Platform-wide utilities, Model Gateway, Trust Engine, audit logging
infrastructure/   — Deployment configuration, environment setup
docs/             — Documentation and Architecture Decision Records
  adr/            — Architecture Decision Records
scripts/          — Automation, migrations, tooling
public/           — Public-facing static assets
```

---

## Current Phase

This repository is in **Phase 2** of the Development Roadmap.

**Foundation Phase 1 is complete.** All platform primitives are built and verified:
Identity & Access, Business Brain foundation, Model Gateway, Trust Engine foundation,
Consent & Rights Ledger, Orchestration Engine (with persistence), Deliverable framework,
Billing foundation, and Content Workforce MVP. Second Workforce (SEO) proved the
architecture supports additional Workforces without platform changes.

**Pre-Phase 2 hardening is complete:**

- Hardening Item 1: Orchestration Engine persistence (write-through cache, Supabase repo, ADR-011)
- Hardening Item 2: RLS JWT hook — `auth_user_id` on users, `custom_access_token_hook`, ADR-012
- Hardening Item 3: Test suite expanded from 22 → 76 tests across 5 files

**Phase 2 scope** (FOUNDATION_003 §Phase 2 — Trust, Autonomy & Customer Experience):

1. Trust Engine — Full Implementation (content safety, output validation, autonomy conditions)
2. Approval Workflows (customer-facing review, approve, reject Deliverables)
3. Business Brain — Intelligence Layer (pattern synthesis, trend identification)
4. Customer Dashboard (Workforces, Engagement Runs, Deliverables, Brain health, Consent history)
5. Workforce Management (configure Workforce goals and Digital Employee responsibilities)
6. Analytics — Foundation Layer (Engagement Run counts, Deliverable status, Brain additions)

Do not build Phase 3 or Phase 4 capabilities during Phase 2.
If a request would introduce a Phase 3+ capability, say so before proceeding.

---

## Milestone Commit and Push Protocol

After each completed Phase 2 milestone:

1. Run `npx tsc --noEmit`. If it fails, fix it before committing.
2. Run `npx vitest run`. If any test fails, fix it before committing.
3. Stage all files created or modified for this milestone.
4. Commit with a conventional commit message describing what changed and why.
5. Push to `origin master`.
6. Stop and wait for approval before beginning the next milestone.

This protocol is active from Phase 2 onward. Never skip the build or test step before pushing.
