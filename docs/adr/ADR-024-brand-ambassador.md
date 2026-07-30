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

1. **The Brand Ambassador is a first-class Digital Employee**, provisioned in its
   own dedicated **"Brand" workforce** (`businessFunction: 'Brand Representation'`)
   — alongside the Digital Workforce but not inside the Content Workforce, because
   the spokesperson spans marketing, sales, support, onboarding, and future
   conversational experiences.
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
5. **Provisioning is essential and idempotent.** `provisionBrandAmbassador` runs
   in the account-provisioning sequence (Step 6c); it reuses an existing Brand
   workforce and never creates a second identity.

## Alternatives considered

- **Add the Ambassador to the Content Workforce.** Rejected — it represents the
  whole company, not one department (founder decision).
- **New dedicated `brand_identities` table.** Rejected for now — the Business
  Brain already models per-org knowledge; a `visual_identity` memory is additive
  and honors "all knowledge lives in the Brain, never on the employee."
- **Add appearance/voice columns to `digital_employees`.** Rejected — the
  architecture keeps identity/memory off the employee row.

## Consequences

- **Positive:** every org gets a distinct, persistent spokesperson from Day 1;
  identity is provider-neutral and future-proof; no destructive changes; reuses
  the entitlement framework as the budget control.
- **Cost / follow-ups:** the Library's `providerRefs` are intentionally
  un-curated (no invented provider ids); concrete provider assets are mapped when
  rendering is wired (Slice 2). Existing organizations need a one-time **backfill**
  (no domain org-listing method exists yet; near-zero external orgs pre-Beta).
  Rendering, gateway per-request identity injection, and GROW/SCALE management UI
  are explicitly **out of scope for Slice 1** and gated on separate approval.
- Ghost `campaign_*` tables are left untouched (cleanup deferred to post-Beta).
