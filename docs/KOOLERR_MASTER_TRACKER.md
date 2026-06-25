# KOOLERR MASTER TRACKER

## Single Source of Truth

This document governs all development work on the Koolerr platform. It is the authoritative
source for project status, active mission, and locked decisions. When this document conflicts
with assumptions, memory, prior conversations, or any other source — this document prevails.
No work should begin without reading and verifying the Current Phase and Session Objective.
No work should end without updating this document.

---

## Status Legend

| Symbol         | Meaning                                                                           |
| -------------- | --------------------------------------------------------------------------------- |
| ✅ Complete    | Implemented AND demonstrated working in the running application                   |
| 🟡 In Progress | Partially complete or pending verification                                        |
| ⬜ Not Started | No work begun                                                                     |
| 🚫 Blocked     | Cannot proceed — external dependency or decision required                         |
| 🔒 Locked      | Finalized decision that must not change unless explicitly approved by the founder |

---

## 1. Project Overview

**Koolerr** is an AI Workforce Platform.

> _Stop buying software. Start hiring AI._

Every customer gets a fully-equipped team of AI employees — built for their brand, powered by
their Business Brain, and working around the clock.

|                     |                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------- |
| **Stack**           | Next.js 15 App Router · Supabase (Auth + Postgres + RLS) · Anthropic Claude · Stripe · Vercel |
| **Repository**      | `ronlou101-sketch/koolerr` (GitHub, branch: `master`)                                         |
| **Production URL**  | https://koolerr.vercel.app                                                                    |
| **Contact**         | team@koolerr.com                                                                              |
| **ADRs**            | 22 recorded (`docs/adr/ADR-001` through `ADR-022`)                                            |
| **Foundation docs** | `Foundation/FOUNDATION_000` through `FOUNDATION_005`                                          |

---

## 2. Overall Completion

**~20%** — Phase 1 is complete. Phases 2 and 3 are in progress. Phases 4–10 are not started.

> ⚠️ Percentage reflects code implementation only. No phase is counted Complete until
> end-to-end verification in the running application is confirmed.

| Phase | Name                    | Status         | Est. Complete |
| ----- | ----------------------- | -------------- | ------------- |
| 1     | Production Foundation   | ✅ Complete    | 100%          |
| 2     | Launch Readiness Review | 🟡 In Progress | ~75%          |
| 3     | Stripe Integration      | 🟡 In Progress | ~60%          |
| 4     | AI Integrations         | ⬜ Not Started | 0%            |
| 5     | Core V1 Experiences     | ⬜ Not Started | 0%            |
| 6     | End-to-End Verification | ⬜ Not Started | 0%            |
| 7     | Internal Dogfooding     | ⬜ Not Started | 0%            |
| 8     | Beta Launch             | ⬜ Not Started | 0%            |
| 9     | Public Launch           | ⬜ Not Started | 0%            |
| 10    | Post-Launch             | ⬜ Not Started | 0%            |

---

## 3. Progress Ledger

> This section is append-only. Never delete or rewrite existing entries. Only add new rows.
> A milestone may only be recorded here after it has been demonstrated working in the
> running application and approved by the founder.

| Date       | Phase                       | Mission                                            | What Was Completed                                                                                                                                                                                                                                                                              | Verification Performed                                                                               | Founder Approved |
| ---------- | --------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------- |
| 2026-06-23 | 1 — Production Foundation   | Build the complete platform foundation             | Next.js 15 App Router; Supabase Auth + RLS; all domain services (Identity, Business Brain, Workforce Engine, Deliverables, Billing, Consent); Model Gateway + Trust Engine; Orchestration Engine with persistence; Content Workforce MVP; SEO Workforce MVP; CTO Agent; 22 ADRs; 155-test suite | TypeScript clean, 155 tests passing, deployed to Vercel                                              | Yes              |
| 2026-06-23 | 2 — Launch Readiness Review | Create all public marketing pages                  | Landing, Features, Pricing, Privacy, Terms, Contact, Support pages; PublicHeader + PublicFooter; middleware updated for public route access                                                                                                                                                     | Pages publicly accessible on koolerr.vercel.app without authentication                               | Yes              |
| 2026-06-23 | 2 — Launch Readiness Review | Implement approved Koolerr logo and favicon        | Logo variants (Trimmed, Wordmark, Icon-only); full favicon set; OG + Twitter images; PWA manifest; SEO metadata in app/layout.tsx                                                                                                                                                               | Assets visible in browser tab, OG preview, and all application surfaces on koolerr.vercel.app        | Yes              |
| 2026-06-23 | 2 — Launch Readiness Review | Polish logo sizing and spacing across all surfaces | Platform header h-10; auth layout Wordmark h-16; nav spacing widened; OG images regenerated with trimmed logo                                                                                                                                                                                   | Visually verified across platform header, auth pages, and public header/footer on koolerr.vercel.app | Yes              |

---

## 4. Locked Roadmap 🔒

These phases and their sequence are locked. Do not reorder, compress, or skip phases.
Any change to the roadmap requires explicit founder approval.

1. **Phase 1 — Production Foundation** ✅
2. **Phase 2 — Launch Readiness Review** 🟡
3. **Phase 3 — Stripe Integration** 🟡
4. **Phase 4 — AI Integrations** ⬜
5. **Phase 5 — Core V1 Experiences** ⬜
6. **Phase 6 — End-to-End Verification** ⬜
7. **Phase 7 — Internal Dogfooding** ⬜
8. **Phase 8 — Beta Launch** ⬜
9. **Phase 9 — Public Launch** ⬜
10. **Phase 10 — Post-Launch** ⬜

---

## 5. Current Phase

**Phase 3 — Stripe Integration** 🟡

All Stripe code is complete and pushed to production. Configuration in Stripe Dashboard and
Vercel is pending user action and has not been confirmed. Phase 3 is not complete until
end-to-end checkout is demonstrated working in the live application.

**Phase gate:** Stripe must pass full end-to-end production verification before Phase 4
(AI Integrations) begins. This is a hard gate — no exceptions.

---

## 6. Session Objective

> There is always exactly ONE active mission. Do not begin the next mission without
> explicit founder approval.

**Current Phase:** Phase 3 — Stripe Integration

**Current Mission:** Complete and verify Stripe in production.

**Success Criteria** — all items must be checked before this mission is closed:

- [ ] Stripe Products created: "Koolerr BUILD" $99/mo · "Koolerr GROW" $499/mo · "Koolerr SCALE" $1,499/mo
- [ ] Stripe Price IDs captured and set as Vercel env vars (`STRIPE_BUILD_PRICE_ID`, `STRIPE_GROW_PRICE_ID`, `STRIPE_SCALE_PRICE_ID`)
- [ ] `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL` set in Vercel Production
- [ ] Webhook endpoint registered: `https://koolerr.vercel.app/api/webhooks/stripe` (4 events)
- [ ] Customer Portal activated in Stripe Dashboard, return URL set to `/billing`
- [ ] `/billing` page loads in production with no amber "Payments not yet active" banner
- [ ] Clicking a checkout button redirects to Stripe Checkout (not a 400 error)
- [ ] Test checkout with card `4242 4242 4242 4242` completes and lands on `/billing?upgraded=1`
- [ ] Active Package widget displays the correct plan name after checkout
- [ ] `checkout.session.completed` webhook shows status 200 in Stripe Dashboard
- [ ] Subscription record in DB has `stripeCustomerId` and `stripeSubscriptionId` populated
- [ ] "Manage Billing →" button opens the Stripe Customer Portal successfully

---

## 7. Phase Checklists

### Phase 1 — Production Foundation ✅

**Platform Architecture**

- ✅ Next.js 15 App Router with route groups `(auth)`, `(platform)`, `(public)`
- ✅ Supabase Auth (sign-up, sign-in, session refresh)
- ✅ Row-Level Security across all tables
- ✅ RLS JWT hook — `auth_user_id` on users, `custom_access_token_hook` (ADR-012)
- ✅ Platform bootstrap (`infrastructure/platform/bootstrap.ts`)

**Domains**

- ✅ Identity & Access domain (ADR-005)
- ✅ Business Brain — structured memory storage and retrieval (ADR-007, ADR-015, ADR-020)
- ✅ Workforce Engine — Digital Employees, Engagement Runs, Orchestration (ADR-006, ADR-016, ADR-019)
- ✅ Deliverables — storage, versioning, approval workflows (ADR-014)
- ✅ Billing — service, Supabase repository, types, plan definitions (ADR-009, ADR-021)
- ✅ Consent & Rights Ledger (ADR-008)

**Shared Platform**

- ✅ Model Gateway (Anthropic adapter, usage sink wiring) (ADR-002, ADR-003)
- ✅ Trust Engine — content safety, output validation, earned autonomy (ADR-002, ADR-013)
- ✅ Orchestration Engine with Supabase persistence and write-through cache (ADR-011)
- ✅ Audit logging (Supabase-persisted)
- ✅ Analytics foundation (ADR-017)

**Workforces**

- ✅ Content Workforce MVP (ADR-006)
- ✅ SEO Workforce — confirmed architecture supports multiple workforces (ADR-010)
- ✅ CTO Agent (Atlas) — cross-workforce orchestration (ADR-018, ADR-019)
- ✅ Cross-workforce Engagement Runs (ADR-019)
- ✅ Business Brain intelligence layer (ADR-020)

**Revenue & Analytics**

- ✅ Revenue Dashboard (`/revenue`)
- ✅ Mission Control (`/mission-control`)
- ✅ Usage tracking (`/usage`)
- ✅ Analytics dashboard (`/analytics`)

**Quality**

- ✅ Test suite — 155 tests across 10 files
- ✅ 22 Architecture Decision Records

---

### Phase 2 — Launch Readiness Review 🟡

**Public Marketing Pages**

- ✅ Landing page (full marketing page — hero, value strip, features, pricing teaser, FAQ)
- ✅ Features page (`/features`) — 8 sections; Morning Brief and Academy marked coming soon
- ✅ Pricing page (`/pricing`) — BUILD $99 / GROW $499 (Best Value) / SCALE $1,499
- ✅ Privacy Policy (`/privacy`) — effective June 24, 2026
- ✅ Terms of Service (`/terms`)
- ✅ Contact page (`/contact`) — team@koolerr.com, business hours, security disclosure
- ✅ Support / Help Center (`/support`) — 6 categories, FAQ accordion
- ✅ `PublicHeader` component (sticky, mobile hamburger menu)
- ✅ `PublicFooter` component (4-column grid, legal links, copyright)
- ✅ `(public)` route group with shared layout
- ✅ Middleware updated — 10 public paths whitelisted without auth

**Branding & Assets**

- ✅ `Koolerr_Logo_Trimmed.png` — transparent padding removed (3840×1441)
- ✅ `Koolerr_Logo_Wordmark.png` — tagline removed (3840×1274)
- ✅ Logo placed: platform header (h-10) · public header (h-9) · public footer (h-8) · auth layout (h-16 Wordmark)
- ✅ Favicon set: `favicon.ico` (16/32/48px) · `favicon-16x16.png` · `favicon-32x32.png` · `apple-touch-icon.png` · `android-chrome-192x192.png` · `android-chrome-512x512.png`
- ✅ `app/icon.png` (32×32) and `app/apple-icon.png` (180×180) — icon-only, auto-injected by Next.js
- ✅ OG image (`app/opengraph-image.png`) — 1200×630, trimmed logo on dark background
- ✅ Twitter card (`app/twitter-image.png`) — 1200×600
- ✅ PWA manifest (`app/manifest.ts`)
- ✅ SEO metadata in `app/layout.tsx` (title template, description, keywords, metadataBase)

**Packages & Pricing**

- ✅ BUILD package finalized — `build` plan ID, $99/month, 250 engagement runs / 500K model invocations
- ✅ GROW package finalized — `grow` plan ID, $499/month, unlimited engagement runs (Best Value badge)
- ✅ SCALE package finalized — `scale` plan ID, $1,499/month, unlimited everything, self-serve Stripe checkout
- ✅ Package pricing finalized — $99 / $499 / $1,499 locked in `PLAN_PRICES_CENTS` and Locked Decisions

**Process**

- ✅ Master tracker (`/docs/KOOLERR_MASTER_TRACKER.md`) — this document

---

### Phase 3 — Stripe Integration 🟡

**Feature Implementation**

- ✅ Products — three Stripe products defined: Koolerr BUILD · Koolerr GROW · Koolerr SCALE
- ✅ Pricing — plan prices aligned: build=$99 · grow=$499 · scale=$1,499 (locked in `PLAN_PRICES_CENTS`)
- ✅ Checkout — checkout session creation, Stripe redirect, success/cancel URL handling
- ✅ Customer Portal — billing portal session creation and redirect
- ✅ Webhooks — 4 lifecycle events handled, HMAC-SHA-256 signature verification, 5-min replay protection
- ⬜ Subscription lifecycle — post-checkout subscription state management
- ⬜ Upgrade/Downgrade — plan change flows (proration, timing)
- ⬜ Cancellation — cancellation handling and access revocation
- ⬜ Payment failure handling — dunning, retry logic, access suspension
- ⬜ Billing verification — end-to-end production test (see Success Criteria)

> ⚠️ ✅ items above are code implementation only. None qualify as ✅ Complete under the
> project definition until verified working in the running application.

**Code — complete and pushed**

- ✅ `shared/integrations/stripe/index.ts` — `createCheckoutSession`, `createPortalSession`, `verifyStripeWebhook` (no SDK, native fetch, Web Crypto HMAC-SHA-256, 5-min replay protection)
- ✅ `POST /api/billing/checkout` — reads JSON body, validates `build | grow | scale`
- ✅ `POST /api/billing/portal` — requires existing `stripeCustomerId`
- ✅ `POST /api/webhooks/stripe` — handles 4 lifecycle events, HMAC signature verification
- ✅ `CheckoutButton` client component — POSTs `{ planId }` as JSON, redirects to Stripe URL
- ✅ Billing page — BUILD / GROW / SCALE cards, comparison table, active package widget
- ✅ Middleware — `/api/webhooks/stripe` in `PUBLIC_PATHS` (self-secured via Stripe signature)
- ✅ Plan IDs: `unpaid` / `build` / `grow` / `scale` (all `free` / `starter` / `growth` references removed)
- ✅ `PLAN_PRICES_CENTS`: build=$99, grow=$499, scale=$1,499
- ✅ `stripePriceId()` reads `STRIPE_BUILD_PRICE_ID`, `STRIPE_GROW_PRICE_ID`, `STRIPE_SCALE_PRICE_ID`
- ✅ SCALE is self-serve Stripe checkout (no contact-sales gate)
- 🟡 DB migration `plan_id 'free' → 'unpaid'` — SQL provided, execution not confirmed (Needs Review)

> ⚠️ Code items above are marked ✅ for implementation only. None qualify as ✅ Complete
> under the project definition until verified working in the running application.
> See Session Objective → Success Criteria for the full verification checklist.

**Stripe Dashboard — pending user action**

- 🟡 Product + Price created: "Koolerr BUILD" $99.00/month → `STRIPE_BUILD_PRICE_ID` — Needs Review
- 🟡 Product + Price created: "Koolerr GROW" $499.00/month → `STRIPE_GROW_PRICE_ID` — Needs Review
- 🟡 Product + Price created: "Koolerr SCALE" $1,499.00/month → `STRIPE_SCALE_PRICE_ID` — Needs Review
- 🟡 Webhook endpoint registered: `https://koolerr.vercel.app/api/webhooks/stripe` — Needs Review
- 🟡 Webhook events: `checkout.session.completed` · `customer.subscription.updated` · `customer.subscription.deleted` · `invoice.payment_failed` — Needs Review
- 🟡 Signing secret captured → `STRIPE_WEBHOOK_SECRET` — Needs Review
- 🟡 Customer Portal activated, return URL set to `https://koolerr.vercel.app/billing` — Needs Review

**Vercel — pending user action**

- 🟡 `STRIPE_SECRET_KEY` set in Production — Needs Review
- 🟡 `STRIPE_WEBHOOK_SECRET` set in Production — Needs Review
- 🟡 `STRIPE_BUILD_PRICE_ID` set in Production — Needs Review
- 🟡 `STRIPE_GROW_PRICE_ID` set in Production — Needs Review
- 🟡 `STRIPE_SCALE_PRICE_ID` set in Production — Needs Review
- 🟡 `NEXT_PUBLIC_APP_URL` set in Production — Needs Review

**End-to-End Verification — not started**

See Section 6 (Session Objective) → Success Criteria for the full verification checklist.

---

### Phase 4 — AI Integrations ⬜

- ⬜ **HeyGen** — AI spokesperson video generation
  Spokesperson video limits are named on all three pricing tiers (5 / 30 / 100 per month).
  High-priority gap — this is a paid deliverable customers are expecting.
- ⬜ **Higgsfield** — AI creative video generation
  Follow-on to HeyGen. Patterns established in HeyGen apply here.
- 🚫 **Manus** — BLOCKED. Product role undefined.
  Do not estimate, scope, or begin implementation until the founder defines the role.

---

### Phase 5 — Core V1 Experiences ⬜

🟡 Needs Review — Scope not yet defined in this tracker.
Reference: `Foundation/FOUNDATION_003_DEVELOPMENT_ROADMAP.md §Phase 2` for context
(Trust, Autonomy & Customer Experience — approval workflows, Workforce Management UI,
customer dashboard, Business Intelligence layer).

---

### Phases 6–10 ⬜

Not started. Scope to be defined after Phase 5 is complete.

---

## 8. Session Log

| Date       | Summary                                                                                                                                                                                                 |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-06-23 | Phase 2 public pages: Landing, Features, Pricing, Privacy, Terms, Contact, Support. PublicHeader, PublicFooter. Middleware public route whitelist.                                                      |
| 2026-06-23 | Logo/favicon: Trimmed + Wordmark PNG variants generated. Full favicon set. OG/Twitter images. PWA manifest. SEO metadata.                                                                               |
| 2026-06-23 | UI Polish: platform header h-10, auth Wordmark h-16, nav spacing widened, OG image regenerated.                                                                                                         |
| 2026-06-23 | Phase 3.1 audit: complete readiness reports for Stripe, Manus, HeyGen, Higgsfield. Gaps identified: 4 missing Stripe env vars, webhook not registered, form/JSON mismatch, middleware blocking webhook. |
| 2026-06-24 | Stripe code fixes: middleware webhook exemption, checkout formData→JSON, `'free'`→`'unpaid'` plan rename, `PLAN_PRICES_CENTS` corrected to $99/$499.                                                    |
| 2026-06-24 | Plan ID alignment: `starter`/`growth` → `build`/`grow`; SCALE added as purchasable Stripe tier with `planId: 'scale'`; `CheckoutButton` client component created; env var names updated.                |
| 2026-06-25 | KOOLERR_MASTER_TRACKER.md created.                                                                                                                                                                      |

---

## 9. Blockers

| ID    | Blocker                                                             | Phase | Owner   | Status                     |
| ----- | ------------------------------------------------------------------- | ----- | ------- | -------------------------- |
| B-001 | Stripe Dashboard not configured (products, prices, webhook, portal) | 3     | User    | 🟡 Pending                 |
| B-002 | Vercel Stripe env vars not set                                      | 3     | User    | 🟡 Pending                 |
| B-003 | End-to-end checkout not verified                                    | 3     | —       | ⬜ Waiting on B-001, B-002 |
| B-004 | DB migration `plan_id 'free'→'unpaid'` execution not confirmed      | 3     | User    | 🟡 Needs Review            |
| B-005 | Manus product role undefined                                        | 4     | Founder | 🚫 Blocked                 |

---

## 10. Locked Decisions

All items in this section are 🔒 Locked. They may not be changed without explicit founder
approval. Where a decision is not yet finalized, it is marked 🟡 Needs Review and must be
resolved before the relevant phase begins.

### Package Names 🔒

BUILD · GROW · SCALE

### Package Pricing 🔒

| Package | Monthly Price  |
| ------- | -------------- |
| BUILD   | $99 / month    |
| GROW    | $499 / month   |
| SCALE   | $1,499 / month |

GROW carries the "Best Value" badge. There is no free plan. The pre-subscription internal
state is `unpaid` — it is never displayed to customers as a plan option.

### Roadmap Order 🔒

Phases 1–10 as defined in Section 4. Sequence cannot be changed without founder approval.

### Branding 🔒

| Surface           | Asset                                |
| ----------------- | ------------------------------------ |
| Platform header   | `Koolerr_Logo_Trimmed.png` at h-10   |
| Public header     | `Koolerr_Logo_Trimmed.png` at h-9    |
| Public footer     | `Koolerr_Logo_Trimmed.png` at h-8    |
| Auth pages        | `Koolerr_Logo_Wordmark.png` at h-16  |
| Browser tab / PWA | Icon-only (chat bubble + sunglasses) |

Primary brand color: emerald-500 for positive indicators. Background tokens from Tailwind
design system (`bg-background`, `text-foreground`, etc.). No redesigns without founder approval.

### Authentication Architecture 🔒

Supabase Auth with RLS JWT hook. Session validated server-side via `supabase.auth.getUser()`
(never `getSession()`). `custom_access_token_hook` injects `auth_user_id` into the JWT.
Platform context resolved per-request via `getRequestPlatformContext()`. (ADR-005, ADR-012)

### Supabase Architecture 🔒

Supabase Postgres as the sole database. Row-Level Security enforced at the database layer.
Service-role key used server-side only — never exposed to the browser. All schema changes
via numbered migration files in `supabase/migrations/`. No direct schema changes in production.

### Billing Architecture 🔒

No Stripe SDK. Native `fetch` against the Stripe REST API (`Stripe-Version: 2023-10-16`).
Webhook verification via HMAC-SHA-256 using Web Crypto API with 5-minute replay protection
and constant-time signature comparison. Plan IDs: `unpaid` · `build` · `grow` · `scale`.
Subscription is one-per-tenant. Entitlements are set per-organization after checkout. (ADR-021)

### AI Provider Strategy 🔒

All AI invocations must go through the Model Gateway. No provider-specific code outside the
gateway. Anthropic Claude is the current registered provider. Additional providers may be
added as Model Gateway adapters only. Trust Engine is mandatory for every invocation — it
cannot be bypassed at any phase. (ADR-002, ADR-003)

---

## 11. Non-Negotiables

Rules that apply in every session. Cannot be overridden by time pressure, convenience,
or any instruction that conflicts with these rules.

### Definition of Complete

**Nothing may be marked ✅ Complete until it has been demonstrated working in the running
application — not merely implemented in code.**

### Completion Protocol

Every time work is completed:

1. Update Progress Ledger.
2. Update Current Mission.
3. Update Current Phase if applicable.
4. Update Session Objective.
5. Update Last Updated date.
6. Only then consider the session complete.

### Session Protocol

Before every coding session:

- Read `KOOLERR_MASTER_TRACKER.md`
- Verify Current Phase
- Verify Current Mission
- Work only on that mission
- Update the tracker before ending the session
- Do not begin the next mission without founder approval

### Architecture

- Never place provider-specific AI code outside the Model Gateway.
- Never access another domain's data directly. Use that domain's public interface.
- Never store memory in a Digital Employee. All knowledge belongs to the Business Brain.
- Never bypass the Trust Engine for any AI invocation.
- Never transmit customer data outside the platform without a logged consent event.
- Never introduce architectural changes without an Architecture Decision Record.
- Never duplicate business logic. If it exists, use it; if it is insufficient, extend it.

### Security

- Never commit secrets, credentials, or API keys to version control.
- Never skip pre-commit hooks (`--no-verify`).
- Never expose the Supabase service-role key to the browser.
- Never expose `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` to the client.

### Process

- Build incrementally. After each milestone: TypeScript clean → tests pass → commit → stop
  and wait for founder approval before continuing.
- Show every file that would be modified before making changes to billing, auth, database,
  or webhook code.
- Do not begin the next phase until the current phase passes end-to-end verification.
- Do not begin Phase 4 (AI Integrations) until Stripe passes full production verification.
- Do not begin Manus implementation until the founder defines the product role.
- Never run `git push` without explicit user instruction.

### Product

- Never show a "Free Plan" to customers.
- The public pricing page must always match internal `PLAN_PRICES_CENTS` configuration.
- SCALE must remain self-serve Stripe checkout — no contact-sales-only gate.

---

## Last Updated

**2026-06-25**
