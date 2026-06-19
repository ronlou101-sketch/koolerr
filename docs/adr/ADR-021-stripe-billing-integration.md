# ADR-021: Stripe Billing Integration

**Status:** Accepted  
**Date:** 2026-06-18  
**Phase:** 3 Milestone 4  
**Author:** Atlas (CTO Agent) via executeCTOEngagementRun

---

## Context

Phase 3 Milestone 4 establishes Stripe as the payment infrastructure for Koolerr V1. The billing domain primitives (Subscription, Entitlement, UsageEvent) built in Phase 2 are fully operational but contain no payment collection capability. Koolerr cannot launch without revenue collection.

Additionally, this milestone builds the Revenue Dashboard (operational brain) and Mission Control (founder's executive dashboard) as first-class V1 features — not analytics add-ons.

---

## Decision 1: Native fetch for Stripe API (no Stripe SDK dependency)

Stripe's REST API is callable via standard HTTPS with form-encoded bodies. Adding the `stripe` npm package would:

- Add a ~1.6MB dependency
- Pin to a specific API version in two places (package + API version header)
- Introduce an upgrade coupling risk

The same non-fatal, env-keyed pattern used for the GitHub integration (`shared/integrations/github/index.ts`) is used here. All Stripe calls return `null` on failure and never throw.

**Environment variables required:**

- `STRIPE_SECRET_KEY` — Stripe API secret key (sk*live*... or sk*test*...)
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook endpoint signing secret (whsec\_...)
- `STRIPE_STARTER_PRICE_ID` — Stripe Price ID for the starter plan
- `STRIPE_GROWTH_PRICE_ID` — Stripe Price ID for the growth plan

None of these appear in code. FOUNDATION_002 §Secrets compliance: verified.

---

## Decision 2: Webhook signature verification via Web Crypto API

Stripe webhook signatures use HMAC-SHA-256. The Web Crypto API (`crypto.subtle`) is available in all Next.js runtime environments (Node.js and Edge). Using it avoids importing Node.js `crypto` module which may not be available in Edge runtimes.

Verification uses constant-time comparison to prevent timing attacks.

---

## Decision 3: Stripe customer/subscription IDs stored on the Subscription entity

The existing `Subscription` type and database table were extended with three nullable columns:

- `stripe_customer_id` — Stripe's `cus_xxx` identifier
- `stripe_subscription_id` — Stripe's `sub_xxx` identifier
- `stripe_price_id` — the Stripe Price purchased

These are set by the `checkout.session.completed` webhook event and updated by `customer.subscription.updated` events. Unique indexes on both nullable columns prevent duplicates.

**Why on Subscription, not Organizations:** The Subscription entity already represents the billing relationship for a Tenant. Adding Stripe IDs here is a natural extension, not a schema change. The alternative (adding stripe columns to Organizations) would couple identity and billing — a Foundation boundary violation.

---

## Decision 4: Paid plan tiers defined with Stripe price IDs from environment

`PLAN_IDS` now includes `starter` and `growth` alongside `free`. The corresponding Stripe Price IDs are read from environment variables at call time — not hardcoded. This allows the same codebase to work with test and production Stripe environments by changing env vars only.

Plan prices in the codebase ($49/month starter, $149/month growth) are display values only. Stripe is the authoritative source for actual billing amounts.

---

## Decision 5: Revenue Dashboard scoped to current Organization (Phase 3)

The Revenue Dashboard in Phase 3 shows data for the authenticated user's Organization. A cross-organization "admin revenue view" requires Supabase service-role access that bypasses RLS — this is Phase 4 scope (platform admin mode).

The Phase 3 dashboard is maximally useful for:

1. The founder operating Koolerr as their primary Organization
2. Every customer seeing their own account's revenue/activity

Phase 4 adds a platform-wide admin view using service-role keys.

---

## Decision 6: Mission Control surfaces Atlas recommendations rather than generating them on page load

Generating a V1 Readiness Report (Atlas LLM call) on every Mission Control page load would:

- Incur ~$0.10–$0.20 per page view (claude-sonnet-4-6 at 4096 tokens)
- Slow page load to 8–15 seconds
- Hit the Engagement Run entitlement limit quickly

Instead, Mission Control surfaces the most recent `v1_readiness_report` Deliverable and provides a "Run V1 Readiness Assessment" quick-action button. The button triggers a new Atlas run (redirects to `/cto` with the objective pre-filled via URL param).

---

## Consequences

**Positive:**

- Koolerr can collect payment on V1 launch day via Stripe Checkout
- Revenue Dashboard provides immediate operational visibility without Phase 4 analytics tables
- Mission Control gives Atlas a permanent home in the founder's daily workflow
- Error boundaries (`error.tsx`, `not-found.tsx`) eliminate raw Next.js errors reaching customers

**Negative / Trade-offs:**

- MRR shows $0 until Stripe is configured and first paid subscription activates — clear "Not configured" state shown
- Stripe integration requires manual configuration of env vars and webhook endpoint in Stripe Dashboard before V1

---

## Forward Compatibility

- Phase 4: `listAllSubscriptions()` with service-role access enables cross-org Revenue Dashboard
- Phase 4: Real-time Mission Control via Supabase Realtime subscriptions on `engagement_runs` and `usage_events`
- Phase 4: Atlas-generated revenue recommendations (weekly) stored as v1_readiness_report deliverables and surfaced in Mission Control automatically
