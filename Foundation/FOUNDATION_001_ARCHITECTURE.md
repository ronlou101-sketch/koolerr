# FOUNDATION_001_ARCHITECTURE.md

# Koolerr Platform Architecture Specification

**Version:** 1.0
**Authority:** FOUNDATION_000_CHARTER.md
**Status:** Permanent

---

## Preamble

This document is the permanent technical constitution of Koolerr.

It does not describe a single implementation.

It describes the permanent architecture that every implementation must conform to.

Engineers, AI agents, and future contributors must treat this document as binding authority second only to the Charter itself.

If any engineering decision conflicts with this specification, this specification prevails.

If any engineering decision conflicts with the Charter, the Charter prevails.

---

## 1. Architectural Philosophy

### 1.1 Why Koolerr Exists as an Operating System

Most software platforms are applications.

An application solves a specific problem for a specific user in a specific workflow.

An operating system provides permanent infrastructure that other capabilities are built on top of.

Koolerr is an operating system.

Customers do not interact with isolated tools.

Customers hire Workforces composed of Digital Employees that share permanent platform infrastructure.

This distinction is not cosmetic.

It determines every architectural decision.

Applications are replaced.

Operating systems are extended.

Every platform primitive built at Koolerr is intended to exist permanently, be extended indefinitely, and support capabilities that have not yet been imagined.

This is why temporary architecture is never acceptable, even when temporary shortcuts are.

### 1.2 Modular Monolith Philosophy

Koolerr begins as a modular monolith.

A modular monolith is a single deployable unit composed of strongly bounded, independently evolving domains.

Each domain owns its data, its logic, and its interfaces.

Domains communicate through defined contracts—never through shared databases, shared state, or direct internal coupling.

The modular monolith approach is chosen deliberately because:

* It eliminates the operational overhead of distributed systems during early platform development.
* It enforces domain boundaries through discipline rather than infrastructure.
* It allows the team to evolve domains independently without coordination overhead.
* It creates a natural migration path toward services when scale requires it.

The goal is not to avoid microservices forever.

The goal is to earn the right to distribute by proving domain boundaries through the discipline of a monolith first.

### 1.3 Domain-First Design

Every capability in Koolerr belongs to a domain.

A domain is a bounded context with clearly defined responsibilities, clearly defined ownership, and clearly defined external interfaces.

No capability exists outside a domain.

No domain owns a capability that belongs to another domain.

When a new capability is required, the first question is always: which domain owns this?

If the answer is unclear, the domain boundaries must be clarified before implementation begins.

Domain-first design ensures that the platform remains coherent as it grows.

It prevents the accumulation of ownership debt that eventually makes large systems impossible to evolve.

### 1.4 Evolution Strategy

Koolerr evolves in one direction only: toward a more complete operating system.

New Workforces are added by extending permanent primitives—never by introducing new platform architecture.

New Digital Employees are added by composing existing platform capabilities—never by duplicating them.

New integrations are added through the Model Gateway and Trust Engine—never through provider-specific code scattered across domains.

Evolution is measured by platform maturity, not feature count.

A platform that adds ten new capabilities built on permanent primitives is more mature than a platform that adds one hundred isolated features.

---

## 2. Permanent Platform Primitives

These primitives are the foundation of everything Koolerr builds.

They are permanent.

They are not replaced.

They are extended.

### 2.1 Tenant

A Tenant is the top-level account holder on the Koolerr platform.

Every piece of data on the platform belongs to a Tenant.

Tenant isolation is absolute.

No Tenant may access, read, influence, or affect the data, workflows, or AI context of any other Tenant.

The Tenant primitive is the root of all platform security.

Every query, every AI invocation, every workflow execution, and every data access is scoped to a Tenant.

### 2.2 Organization

An Organization is the primary business entity within a Tenant.

A Tenant may own one or more Organizations.

Each Organization represents a real business operating within the platform.

Organizations own Workforces, Digital Employees, Business Brains, and Deliverables.

The Organization is the customer's business as represented inside Koolerr.

### 2.3 Business Brain

The Business Brain is the permanent, cumulative memory of an Organization.

It is not a feature.

It is infrastructure.

The Business Brain stores everything the platform learns about the business over time:

* Company identity and brand
* Products and services
* Pricing and policies
* Standard Operating Procedures
* Customers and relationships
* Assets and resources
* Preferences and historical decisions
* Knowledge accumulated through Workforce activity

The Business Brain belongs entirely to the Organization.

It is never shared across Organizations.

It never leaves the platform unless the customer explicitly exports it.

Digital Employees never own memory.

All knowledge generated by Digital Employees during Engagement Runs returns to the Business Brain.

If every Workforce were replaced tomorrow, the Business Brain remains intact.

This is the foundational customer promise.

### 2.4 Business Memory

Business Memory is the structured storage layer of the Business Brain.

It represents individual units of knowledge stored within the Business Brain.

Each unit of Business Memory has a type, a source, a relevance scope, and a timestamp.

Business Memory is queryable by Digital Employees during Engagement Runs.

Business Memory is writable only through approved workflows—never directly by users or Digital Employees outside of structured processes.

Business Memory is versioned.

Past states of the Business Brain are recoverable.

### 2.5 Business Intelligence

Business Intelligence is the reasoning and synthesis layer of the Business Brain.

Where Business Memory stores facts, Business Intelligence surfaces patterns, trends, recommendations, and insights derived from accumulated Business Memory.

Business Intelligence improves over time as Business Memory grows.

It is not a dashboard.

It is the platform's ability to understand the business as a whole rather than as isolated data points.

### 2.6 Workforce

A Workforce is a department.

It is a named group of Digital Employees organized around a business function.

Examples: Content Workforce, Sales Workforce, Operations Workforce.

A Workforce does not own business knowledge.

A Workforce accesses the Business Brain to perform work.

A Workforce contributes to the Business Brain upon completing work.

Workforces are additive.

Adding a new Workforce never changes platform architecture.

New Workforces are built by composing existing platform primitives.

### 2.7 Digital Employee

A Digital Employee is an AI agent assigned to a Workforce with defined responsibilities, objectives, tools, and permissions.

A Digital Employee is not a chatbot.

It performs structured work.

It has a role within a Workforce.

It collaborates with other Digital Employees.

It hands work to other Digital Employees.

It reviews the work of other Digital Employees.

A Digital Employee never owns memory.

Everything it learns during an Engagement Run is returned to the Business Brain.

A Digital Employee is temporary in the sense that it can be replaced, upgraded, or retired without any loss of institutional knowledge.

### 2.8 Engagement Run

An Engagement Run is a discrete unit of work performed by one or more Digital Employees.

Every Engagement Run has a defined objective, a defined scope, a defined set of participants, and a defined output.

Engagement Runs produce Deliverables.

Engagement Runs are auditable.

Every action taken during an Engagement Run is logged, attributed, and retrievable.

Engagement Runs may be triggered by customers, by scheduled processes, or by other Engagement Runs.

### 2.9 Deliverable

A Deliverable is the completed output of an Engagement Run.

A Deliverable is what customers pay for.

Examples: blog posts, advertisements, emails, proposals, reports, hiring packets, customer responses, strategies.

A Deliverable is a first-class platform object.

It is stored, versioned, attributed to the Engagement Run that produced it, and linked to the Digital Employees that created it.

Customers review, approve, export, and publish Deliverables.

Customers do not pay for prompts.

Customers do not pay for tokens.

Customers pay for Deliverables.

### 2.10 Trust Engine

The Trust Engine is the platform's governance layer for AI behavior.

It enforces what Digital Employees are permitted to do, how, and under what conditions.

The Trust Engine applies rules before any AI invocation executes.

It enforces:

* Permission boundaries per Digital Employee
* Consent requirements before sensitive actions
* Content safety and output validation
* Audit logging of all AI decisions
* Rate limits and usage governance

No AI invocation bypasses the Trust Engine.

No Digital Employee operates outside the boundaries the Trust Engine enforces.

The Trust Engine is not a feature.

It is infrastructure that every other primitive depends on.

### 2.11 Consent & Rights Ledger

The Consent & Rights Ledger is the permanent record of every permission, consent, and rights decision made within the platform.

It records:

* What customers have consented to
* What Digital Employees are permitted to do on behalf of customers
* What data has been authorized for use in AI contexts
* What actions have been taken under each consent grant

The Consent & Rights Ledger is append-only.

Past consents are never erased—they are superseded by updated consents.

This ledger is the foundation of customer trust.

Customers can always inspect what has been consented to and by whom.

### 2.12 Model Gateway

The Model Gateway is the single entry point for all AI model invocations on the platform.

No domain invokes an AI provider directly.

Every AI invocation routes through the Model Gateway.

The Model Gateway is responsible for:

* Provider abstraction
* Model selection and routing
* Token accounting
* Retry and fallback logic
* Cost attribution per Tenant and Workforce
* Prompt construction governance
* Response validation

Provider-specific code exists only inside the Model Gateway.

No other domain contains provider-specific logic.

This ensures that adding a new AI provider, replacing an existing provider, or migrating between providers requires changes in exactly one place.

### 2.13 Orchestration Engine

The Orchestration Engine coordinates multi-step, multi-agent workflows.

When an Engagement Run requires multiple Digital Employees to collaborate, hand work between each other, or execute sequentially or in parallel, the Orchestration Engine manages that coordination.

The Orchestration Engine is responsible for:

* Workflow state management
* Step sequencing and dependency resolution
* Inter-agent communication
* Failure recovery and retry
* Progress tracking and auditability

Business logic does not live in the Orchestration Engine.

The Orchestration Engine coordinates execution.

Digital Employees perform the work.

### 2.14 Billing

The Billing primitive tracks platform usage, enforces subscription entitlements, and manages payment relationships.

Billing is scoped per Tenant.

Usage is attributed per Organization, per Workforce, and per Engagement Run.

Customers are billed for Deliverables and usage tiers—not for raw tokens or compute.

The Billing primitive integrates with the Model Gateway to translate AI invocation costs into platform-level billing events.

Billing is not a reporting layer.

It is a governance layer that enforces what each Tenant is entitled to at any given time.

### 2.15 Identity & Access

The Identity & Access primitive manages authentication, authorization, and role-based access control across the platform.

It is responsible for:

* User authentication
* Session management
* Role assignment and enforcement
* Scoped permissions per Organization and Workforce
* API key management for external integrations

Identity & Access enforces least privilege by default.

No user, Digital Employee, or external system receives more access than the minimum required to perform its function.

---

## 3. Domain Boundaries

Koolerr is organized into clearly bounded domains.

Each domain owns a specific set of responsibilities.

No domain crosses into another domain's ownership.

### identity

Owns: user authentication, session management, role-based access control, API key lifecycle.

Does not own: business data, AI invocations, billing logic, workforce operations.

### business-brain

Owns: Business Brain lifecycle, Business Memory storage and retrieval, Business Intelligence synthesis.

Does not own: AI invocation, workflow orchestration, billing, user identity.

### workforce-engine

Owns: Workforce definitions, Digital Employee definitions and lifecycle, Engagement Run execution, Orchestration Engine integration.

Does not own: Business Brain writes (it contributes to the Brain through defined interfaces), billing, identity.

### deliverables

Owns: Deliverable storage, versioning, attribution, customer review and approval workflows.

Does not own: Deliverable creation (that is performed by Digital Employees within the workforce-engine), billing, identity.

### billing

Owns: subscription management, usage tracking, payment processing, entitlement enforcement.

Does not own: any business data, any AI invocations, any workflow logic.

### shared

Owns: platform-wide utilities, the Model Gateway, the Trust Engine, the Consent & Rights Ledger, audit logging infrastructure.

Does not own: any domain-specific business logic.

---

## 4. Data Ownership Rules

Data ownership determines which domain is the single source of truth for a given entity.

**User and session data:** owned by identity. No other domain writes user records.

**Business Brain and Business Memory:** owned by business-brain. The workforce-engine contributes to the Business Brain through defined write interfaces. No domain reads directly from the Business Brain's internal storage—all reads go through the business-brain domain's query interfaces.

**Workforce and Digital Employee definitions:** owned by workforce-engine.

**Engagement Run state and history:** owned by workforce-engine.

**Deliverables:** owned by deliverables. The workforce-engine produces Deliverables and hands them to the deliverables domain through defined interfaces.

**Billing and usage events:** owned by billing. The Model Gateway emits usage events to billing. No other domain writes billing records.

**Audit logs:** written by shared infrastructure. No domain may write directly to the audit log except through the shared logging interface. No domain may delete or modify audit records.

**Consent records:** owned by the Consent & Rights Ledger within shared. No domain writes consent records except through the Consent & Rights Ledger's defined interfaces.

Cross-domain reads are permitted through defined query interfaces only.

Cross-domain writes are never permitted directly.

---

## 5. Workforce Extension Rules

Future Workforces are added by extending platform primitives—not by changing platform architecture.

The process for adding a new Workforce is:

1. Define the Workforce's business function, name, and purpose.
2. Define the Digital Employees that belong to the Workforce, including their responsibilities, objectives, permitted tools, and permission boundaries.
3. Define the Engagement Runs the Workforce supports, including inputs, outputs, and Deliverable types.
4. Register the Workforce, its Digital Employees, and its Engagement Run types within the workforce-engine domain.
5. Define what Business Memory types the Workforce reads from and contributes to the Business Brain.
6. Define Deliverable types the Workforce produces within the deliverables domain.
7. Register billing entitlements for the Workforce within the billing domain.

No step in this process requires changes to the Model Gateway, the Trust Engine, the Consent & Rights Ledger, the Orchestration Engine, or the Identity & Access primitive.

This is the proof of platform maturity.

A platform that requires architectural changes to add a new Workforce is not an operating system.

It is an application collection.

---

## 6. AI Provider Strategy

### 6.1 Why Providers Are Abstracted

AI providers are vendors.

Vendors change pricing.

Vendors deprecate models.

New vendors emerge with superior capabilities.

Regulatory environments change which providers are permissible in which jurisdictions.

If provider-specific code exists throughout the platform, every provider change becomes a platform-wide migration.

Koolerr abstracts all AI providers behind the Model Gateway so that the platform is permanently decoupled from the decisions of any single vendor.

### 6.2 The Model Gateway Contract

The Model Gateway exposes a stable internal interface to the rest of the platform.

Domains that require AI invocations call the Model Gateway using platform-defined request types.

The Model Gateway translates those requests into provider-specific API calls.

The Model Gateway translates provider-specific responses back into platform-defined response types.

Domains never receive provider-specific objects.

Domains never send provider-specific parameters.

### 6.3 Provider-Specific Code Boundary

Provider-specific code lives exclusively inside the Model Gateway.

No exception exists to this rule.

If an engineer discovers provider-specific logic outside the Model Gateway, it must be moved inside the Model Gateway immediately.

This rule is non-negotiable.

---

## 7. Scalability Philosophy

### 7.1 Why We Begin With a Modular Monolith

Distributed systems solve the problems of scale.

They introduce the problems of distribution: network latency, partial failure, distributed transactions, operational complexity, and observability overhead.

These are real costs.

A platform that incurs distributed systems costs before it has distributed systems scale has made a permanent mistake.

Koolerr begins as a modular monolith to avoid that mistake.

The domain boundaries enforced within the monolith are the same boundaries that services would enforce.

The monolith proves those boundaries under real conditions before the cost of distribution is paid.

### 7.2 Migration Path Toward Services

When a domain requires independent scaling, independent deployment, or independent team ownership at a scale that justifies distribution costs, that domain may be extracted into a service.

The extraction is possible because:

* Each domain already owns its data cleanly.
* Each domain already communicates through defined interfaces.
* No domain is coupled to another domain's internal implementation.

Extraction is a deployment decision, not an architectural decision.

The architecture is already service-ready.

---

## 8. Security Philosophy

### 8.1 Row-Level Security

Every database table that contains Tenant-scoped data enforces Row-Level Security.

Tenant isolation at the data layer is not enforced exclusively by application logic.

It is enforced at the database layer so that no application-level bug can expose one Tenant's data to another Tenant.

### 8.2 Least Privilege

Every component of the platform—users, Digital Employees, internal services, and external integrations—operates with the minimum permissions required to perform its function.

Permissions are never granted speculatively.

Permissions are never inherited from a broader role when a narrower role is sufficient.

Permission escalation requires explicit approval and audit logging.

### 8.3 Tenant Isolation

Tenant isolation is absolute and enforced at every layer of the platform:

* At the database layer through Row-Level Security.
* At the application layer through request scoping.
* At the AI invocation layer through prompt construction governance in the Model Gateway.
* At the audit layer through attribution of every action to its originating Tenant.

No cross-Tenant data access is permitted under any circumstance.

### 8.4 Secrets Management

Secrets—API keys, credentials, connection strings, encryption keys—are never stored in code, configuration files, or version control.

Secrets are managed through dedicated secrets infrastructure.

Secrets are rotated on defined schedules.

Access to secrets is logged and audited.

### 8.5 Auditability

Every consequential action on the platform is logged with sufficient context to reconstruct what happened, who initiated it, on whose behalf, and what the outcome was.

Audit logs are immutable.

Audit logs are not deleted.

Audit logs are the foundation of customer accountability and platform trust.

---

## 9. Non-Negotiable Engineering Rules

These rules apply to every engineer and every AI agent working on the Koolerr platform.

**1. No provider-specific code outside the Model Gateway.**
Every AI invocation routes through the Model Gateway. No exception.

**2. No cross-domain database access.**
Domains access other domains' data through defined query interfaces only. Never through direct database queries against another domain's tables.

**3. No architectural changes to add a new Workforce.**
New Workforces compose existing primitives. If adding a Workforce requires changing platform architecture, the architecture is wrong.

**4. No bypassing the Trust Engine.**
Every AI invocation passes through the Trust Engine. No shortcut exists and none will be created.

**5. No data leaving the platform without explicit customer consent.**
Customer data, Business Brain contents, and Deliverables are never transmitted to external systems without a logged consent event.

**6. No temporary architecture.**
Temporary shortcuts are acceptable. Shortcuts that require architectural cleanup to remove are not. If a shortcut introduces permanent architectural debt, it must not be taken.

**7. No domain owns another domain's data.**
Data ownership is defined once and never renegotiated in implementation. If ownership is unclear, clarify the domain boundary before writing code.

**8. No tenant data without RLS.**
Every table containing tenant-scoped data enforces Row-Level Security. No exception.

**9. No secrets in code or version control.**
All secrets are managed through secrets infrastructure. Committing a secret to version control is a critical incident regardless of how quickly it is removed.

**10. No undocumented deviation from this specification.**
If a deviation from this specification is required, it must be documented, justified, reviewed against the Charter, and approved before implementation begins.

---

## 10. Future Compatibility

Koolerr's architecture is designed to support an unlimited number of future Workforces without architectural redesign.

The following demonstrates how future expansion maps onto existing primitives:

| Future Capability | Existing Primitives Used |
|---|---|
| New Workforce (e.g., Finance Workforce) | Workforce, Digital Employee, Engagement Run, Deliverable, Business Brain |
| New Digital Employee within existing Workforce | Digital Employee, Trust Engine, Model Gateway |
| New Deliverable type | Deliverable, deliverables domain |
| New AI provider integration | Model Gateway only |
| New Tenant jurisdiction with different compliance requirements | Trust Engine, Consent & Rights Ledger |
| New billing tier or entitlement | Billing primitive only |
| New customer permission type | Consent & Rights Ledger, Identity & Access |
| New Business Memory category | business-brain domain only |
| Extracting a domain to an independent service | Deployment change only—no architectural change |

No item in this table requires platform-wide changes.

No item requires a new platform primitive.

No item requires renegotiating domain ownership.

This is what it means to build an operating system rather than an application.

---

## Closing Statement

This document is not a plan.

It is a constitution.

Plans change.

Constitutions endure.

Every engineer who touches this platform inherits the responsibility of building in alignment with what is defined here.

When this document and a short-term business pressure conflict, this document prevails.

When this document and the Charter conflict, the Charter prevails.

Everything else is implementation detail.
