# ADR-024 — Brand Ambassador (persistent, provider-agnostic spokesperson)

- **Status:** Accepted
- **Date:** 2026-07-30
- **Deciders:** Founder (ronlou101), CTO Agent session
- **Scope:** Experience Workstream · Brand Ambassador Foundation (Slice 1). Additive only.
- **Related:** ADR-023 (Experience Workstream), `docs/PHASE_13_EXPERIENCE_WORKSTREAM.md`

## Context

Campaigns currently produce no real, branded media, and there is no persistent
visual identity per customer — the only spokesperson is a single global HeyGen
avatar shared by every organization (env `HEYGEN_AVATAR_ID`). Founder direction:
every organization must have a **persistent, recognizable Brand Ambassador** that
appears consistently across campaigns, modeled as a **first-class Digital Employee
representing the company** (not a rendering detail, and never surfaced to
customers as an "avatar"). The Business Brain must remain the source of truth and
must never be coupled to a render provider (HeyGen/Higgsfield/ElevenLabs/future).

## Decision

1. **The Brand Ambassador is a standalone, first-class Digital Employee** — a
   sibling of the Digital Workforce under the Organization, not a member of it.
   It has a persistent identity (minted stable id, name, role, personality,
   appearance, voice, provider references) but is **not enrolled in the operational
   Workforce Engine**: it has **no `workforces` row and no `digital_employees`
   row**. Its id is typed as `DigitalEmployeeId` so it can attribute rendered
   deliverables (`attributed_to` is a `text[]` with no FK to `digital_employees`).
2. **Identity lives in the Business Brain**, provider-agnostic, as a new
   `visual_identity` Business Memory (latest-wins per org, mirroring
   `company_identity`). It holds persona, personality, appearance, voice, brand
   assets, a deterministic `seed`, and an **optional** `providerRefs` map. Render
   providers consume `providerRefs`; the Business Brain imports no provider SDK.
3. **A curated, provider-agnostic Ambassador Library** seeds identities. BUILD
   auto-assigns a distinct default (deterministic by `hash(organizationId)`),
   persistent and unchangeable. GROW may select a different library entry; SCALE
   replaces it with a custom-trained ambassador (later slices).
4. **Budget = package video limits, not a separate render budget.** A new
   `spokesperson_video` entitlement (BUILD 5 / GROW 30 / SCALE 100 / unpaid 0) is
   added to the existing entitlement framework; it is applied automatically by the
   existing provisioning and checkout entitlement loops.
5. **Provisioning is a single additive Business-Brain write.**
   `provisionBrandAmbassador` calls `assignDefaultBrandAmbassador`, which mints the
   id and stores the `visual_identity` memory. Idempotent (never creates a second
   identity). The Business Brain already exists by this point in provisioning.

## Why not enroll it in the Workforce Engine

An earlier revision created a dedicated "Brand Representation" workforce plus a
`digital_employees` row. That made the Ambassador flow into **every** consumer that
enumerates workforces/employees — the customer Workforces page (a new editable
card), `/revenue` and `/mission-control` counts, all Tower rollups, `/api/readiness`,
and Atlas's cross-workforce readiness report. The Workforce Engine models
**operational runners of Engagement Runs**; the Brand Ambassador is an
identity/persona, not a runner. Keeping it out of that engine removes all of those
side effects while still making it a first-class Digital Employee.

## Alternatives considered

- **Enroll it as a dedicated Brand workforce + employee.** Rejected — introduces a
  customer-manageable operational workforce and inflates workforce/reporting counts.
- **Add it to the Content Workforce.** Rejected — it represents the whole company,
  not one department, and re-couples it to content operations.
- **Filter the Brand workforce out of every enumerator.** Rejected — fragile,
  touches many consumers, easy to miss one.
- **New dedicated `brand_identities` table.** Rejected — the Business Brain already
  models per-org knowledge; a `visual_identity` memory is additive and honors
  "all knowledge lives in the Brain."

## Consequences

- **Positive:** every org gets a distinct, persistent spokesperson from Day 1;
  identity is provider-neutral and future-proof; no operational workforce, so no
  workforce card / count / Tower / readiness inflation; provisioning is one
  low-risk write; no destructive changes.
- **Footprint (intentional):** exactly one additional Business-Brain memory
  (`visual_identity`) per org. It is excluded from the Brain page's rendered list
  and inflates no workforce/employee/run counts (Tower's memory-type view reflects
  it, as expected for the source of truth).
- **Follow-ups (out of scope for Slice 1):** rendering, gateway per-request
  identity injection, a dedicated read-only "Brand Ambassador / Team" surface
  (never the operational Workforces page), and GROW/SCALE management. The Library's
  `providerRefs` are intentionally un-curated (no invented provider ids). Existing
  orgs need a one-time backfill (no domain org-listing method yet; near-zero
  external orgs pre-Beta). Ghost `campaign_*` tables are left untouched.
