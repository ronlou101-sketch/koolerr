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

**~28%** — Phase 1 is complete. Phase 2 is near-complete. Phase 3 is in progress. Phases 4–10 are not started.

> ⚠️ Percentage reflects code implementation only. No phase is counted Complete until
> end-to-end verification in the running application is confirmed.

| Phase | Name                    | Status         | Est. Complete |
| ----- | ----------------------- | -------------- | ------------- |
| 1     | Production Foundation   | ✅ Complete    | 100%          |
| 2     | Launch Readiness Review | 🟡 In Progress | ~90%          |
| 3     | Stripe Integration      | 🟡 In Progress | ~70%          |
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

| Date       | Phase                       | Mission                                                                            | What Was Completed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Verification Performed                                                                                                                                                                                                                                                                    | Founder Approved                                                  |
| ---------- | --------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 2026-06-23 | 1 — Production Foundation   | Build the complete platform foundation                                             | Next.js 15 App Router; Supabase Auth + RLS; all domain services (Identity, Business Brain, Workforce Engine, Deliverables, Billing, Consent); Model Gateway + Trust Engine; Orchestration Engine with persistence; Content Workforce MVP; SEO Workforce MVP; CTO Agent; 22 ADRs; 155-test suite                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | TypeScript clean, 155 tests passing, deployed to Vercel                                                                                                                                                                                                                                   | Yes                                                               |
| 2026-06-23 | 2 — Launch Readiness Review | Create all public marketing pages                                                  | Landing, Features, Pricing, Privacy, Terms, Contact, Support pages; PublicHeader + PublicFooter; middleware updated for public route access                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Pages publicly accessible on koolerr.vercel.app without authentication                                                                                                                                                                                                                    | Yes                                                               |
| 2026-06-23 | 2 — Launch Readiness Review | Implement approved Koolerr logo and favicon                                        | Logo variants (Trimmed, Wordmark, Icon-only); full favicon set; OG + Twitter images; PWA manifest; SEO metadata in app/layout.tsx                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Assets visible in browser tab, OG preview, and all application surfaces on koolerr.vercel.app                                                                                                                                                                                             | Yes                                                               |
| 2026-06-23 | 2 — Launch Readiness Review | Polish logo sizing and spacing across all surfaces                                 | Platform header h-10; auth layout Wordmark h-16; nav spacing widened; OG images regenerated with trimmed logo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Visually verified across platform header, auth pages, and public header/footer on koolerr.vercel.app                                                                                                                                                                                      | Yes                                                               |
| 2026-06-26 | 3 — Stripe Integration      | Harden billing, provisioning, and login flows                                      | Provisioning idempotency fix (heal missing subscription on re-provision); login healing for already-authenticated users with no subscription record; billing display fix suppressing active package section for unpaid plan; temporary diagnostic logging removed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | TypeScript clean; deployed to koolerr.vercel.app                                                                                                                                                                                                                                          | Yes                                                               |
| 2026-06-26 | 3 — Stripe Integration      | Redesign customer onboarding with pre-auth Stripe checkout                         | New customer flow: /pricing → /api/checkout/start?plan=x → Stripe Checkout → /checkout/success (provision org/subscription/user/workforce + password creation + auto sign-in → /dashboard). POST /api/checkout/complete with 3-attempt internal retry + client Retry button + support email fallback (never-stranded guarantee). POST /api/checkout/set-password (httpOnly cookie auth, 30-min expiry). /forgot-password + /reset-password flows added. Subscription enforcement in platform layout: soft amber banner (past_due/unpaid) + billing_only hard gate (expired/canceled). Middleware updated: x-pathname header for server components; 6 new public paths. Stripe integration extended: retrieveCheckoutSession, updateStripeSubscriptionMetadata. Schema migration 016: subscriptions_organization_id_key unique constraint. | TypeScript clean; 155 tests passing; build successful; deployed to koolerr.vercel.app; owner login and dashboard access verified                                                                                                                                                          | Yes                                                               |
| 2026-06-27 | 3 — Stripe Integration      | Implement permanent Owner Protection                                               | infrastructure/auth/guards.ts created as single source of truth: OWNER_ALWAYS_PATHS (11 administrative routes), isOwner(ctx), isOwnerAlwaysPath(pathname). Platform layout billing_only gate updated to exempt owner on all administrative and recovery paths while preserving customer subscription enforcement on feature routes (/runs, /cto, /analytics). 73 regression tests in infrastructure/auth/guards.test.ts verify every guarantee.                                                                                                                                                                                                                                                                                                                                                                                           | TypeScript clean; 228 tests (11 files) passing; deployed to koolerr.vercel.app                                                                                                                                                                                                            | Yes                                                               |
| 2026-06-27 | 3 — Stripe Integration      | Production deployment and verification (partial)                                   | Production deployment dpl_EejVAZS9AK9dvg9BYz3CnPvo2uxA deployed to koolerr.vercel.app. Verification: owner login infrastructure ✅; all 13 platform routes live ✅; customer subscription enforcement confirmed by test suite ✅; Stripe API handler error responses correct ✅; 228/228 regression tests pass ✅. Regression found: password reset email link fails with /login?error=missing_code#error=access_denied&error_code=otp_expired. Root cause identified: Supabase OTP consumed by email security scanner (prefetch) before user clicks the link. Fix not yet implemented (B-006).                                                                                                                                                                                                                                           | 228/228 tests passing; TypeScript clean; 5 of 6 production verification items confirmed                                                                                                                                                                                                   | Yes — deployment approved; password reset regression awaiting fix |
| 2026-06-28 | 3 — Stripe Integration      | Fix password reset regression (B-006)                                              | Scanner-proof `/confirm` page (`app/(auth)/confirm/page.tsx`): `verifyOtp` called only on form POST (user click), never on GET — email scanner prefetch cannot consume the OTP. Middleware: `/confirm` added to `PUBLIC_PATHS`. Supabase Reset Password email template changed from `{{ .ConfirmationURL }}` to `{{ .TokenHash }}` flow pointing to `/confirm`. OTP expiry confirmed at 3600s. Deployed as commit `69dd3f6` to koolerr.vercel.app.                                                                                                                                                                                                                                                                                                                                                                                        | End-to-end password reset verified in production: reset requested → email received with `/confirm` link → page rendered without consuming OTP → button clicked → recovery session established → `/reset-password` reached → new password saved → signed in successfully with new password | Yes                                                               |
| 2026-06-29 | Dogfooding (parallel)       | Build Tower Control v1 — Founder Command Center (12 phases)                        | All 12 Tower Control phases complete: shell, live health, drill-down, executive intelligence, autonomous operations, agent execution framework, autonomous support, execution engine, business brain & founder intelligence, autonomous company OS, company memory & learning engine, AI support command center. 44 production routes. Commits `59afb77` through `fd0d279`.                                                                                                                                                                                                                                                                                                                                                                                                                                                               | TypeScript clean; 234 tests passing; all 44 routes verified in running application                                                                                                                                                                                                        | Yes                                                               |
| 2026-07-01 | Dogfooding (parallel)       | Build 7-step Customer Onboarding Pipeline with AI Workforce trigger                | Comprehensive Business Profile wizard (Business Info, Services, Audience, Brand Identity, Strategy, Online Presence, Review & Launch). `saveBusinessProfile` server action. `triggerAIWorkforce` server action. `runAIWorkforcePipeline()`. `/api/ai-workforce/start` + `/api/ai-workforce/status/:runId`. `AIWorkforceProgress` client component. Commit `8111299`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | TypeScript clean; 445 tests across 19 files passing                                                                                                                                                                                                                                       | Yes                                                               |
| 2026-07-08 | Dogfooding (parallel)       | Campaign Architect Wizard — Steps 1–4 complete                                     | Step 1: goal selection (9 options). Step 2: business type selection (9 types). Step 3: service area configuration with map, location autocomplete, 7 coverage modes. Step 4: AI-generated campaign strategy (9 editable cards, loading animation, regenerate, stale-request deduplication via `requestRef`, Continue `disabled={editField !== null}` — prevents advancing while a card edit is in progress). `createCampaign()` surfaced through `IDogfoodingService` and `DogfoodingService`. `POST /api/tower/dogfooding/campaigns` handler added. Step 5 save + redirect implemented (commit `08d248b`). Step 4 Continue disabled gate added (commit `2173c6b`).                                                                                                                                                                       | Production E2E verified: single POST to `/api/tower/dogfooding/campaign-strategy`, single POST to `/api/tower/dogfooding/campaigns`, one campaign created, correct redirect, correct detail page heading. TypeScript clean; 563 tests passing.                                            | Yes                                                               |
| 2026-07-09 | Dogfooding (parallel)       | Campaign Architect Wizard — Step 5 complete + Campaign Detail structured rendering | Wizard progress bar corrected to `total={5}` — wizard has exactly 5 steps (commit `236298b`). Campaign Brief section on `/tower/dogfooding/campaigns/:id` replaced `<pre>{JSON.stringify(campaign.targetAudience, null, 2)}</pre>` with 8 labeled field sections: Primary Goal (`objectiveSummary`), Target Audience, Core Message, Recommended Offer, Content Pillars (pill badges, `bg-primary/10`), Posting Frequency, Campaign Length, Tone of Voice (chip badges, `bg-muted`). All fields conditionally rendered. Commits `236298b` and `2bfec58`. Deployed to koolerr.vercel.app (deployment SHA `2bfec58199d4`, Vercel state `success`).                                                                                                                                                                                           | TypeScript clean; 563/563 tests passing; Vercel deployment state `success`; Campaign Brief renders 8 labeled sections with no raw JSON; Campaign Architect flow Steps 1–5 → save → redirect → detail page verified end-to-end.                                                            | Yes                                                               |

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

All Stripe and onboarding code is implemented and deployed to production (commit `7dbd5cc`).
The complete pre-auth checkout flow is live: `/pricing` → `/api/checkout/start` → Stripe Checkout
→ `/checkout/success` (provision + password creation + auto sign-in → `/dashboard`). Subscription
enforcement (soft banner + billing_only hard gate) and permanent Owner Protection are deployed.

B-006 (password reset regression) is resolved: scanner-proof `/confirm` page deployed (commit
`69dd3f6`), Supabase email template updated to `{{ .TokenHash }}` flow, end-to-end production
verification confirmed by founder. Stripe Dashboard configuration and Vercel env vars are still
pending user action (`B-001`, `B-002`). Phase 3 is not complete until end-to-end Stripe checkout
passes full production verification.

**Phase gate:** Stripe must pass full end-to-end production verification before Phase 4
(AI Integrations) begins. This is a hard gate — no exceptions.

---

## 6. Session Objective

> There is always exactly ONE active mission. Do not begin the next mission without
> explicit founder approval.

**Current Phase:** Dogfooding (parallel) — no active mission; awaiting founder approval

> Phase 3 (Stripe Integration) remains blocked on external user actions B-001 and B-002.
> Dogfooding continues in parallel while those blockers are resolved.

**Current Mission:** Campaign Architect Wizard — Step 5 ✅ COMPLETE

**Success Criteria** — all items must be checked before this mission is closed:

- [x] Campaign Architect Wizard Step 5 implemented per founder specification
- [x] Step 5 verified end-to-end in the running application
- [x] TypeScript clean; all tests passing
- [x] Committed and approved by founder

**Phase 3 Stripe blockers still open (user action required):**

- [ ] Stripe Products created: "Koolerr BUILD" $99/mo · "Koolerr GROW" $499/mo · "Koolerr SCALE" $1,499/mo
- [ ] Stripe Price IDs captured and set as Vercel env vars (`STRIPE_BUILD_PRICE_ID`, `STRIPE_GROW_PRICE_ID`, `STRIPE_SCALE_PRICE_ID`)
- [ ] `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL` set in Vercel Production
- [ ] Webhook endpoint registered: `https://koolerr.vercel.app/api/webhooks/stripe` (4 events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`)
- [ ] Webhook signing secret captured → `STRIPE_WEBHOOK_SECRET`
- [ ] Customer Portal activated in Stripe Dashboard, return URL set to `https://koolerr.vercel.app/billing`

**Phase 3 end-to-end checkout verification (blocked on above):**

- [ ] `/billing` page loads in production with no amber "Payments not yet active" banner
- [ ] Clicking a plan button on `/pricing` redirects to Stripe Checkout (via `/api/checkout/start?plan=build|grow|scale`)
- [ ] Test checkout with card `4242 4242 4242 4242` completes: Stripe redirects to `/checkout/success`, account is provisioned, password creation form appears, customer signs in and reaches `/dashboard`
- [ ] `/billing` displays the correct plan name and active package after checkout
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

- ✅ Test suite — 228 tests across 11 files (grown from 155/10 through Phase 3 additions)
- ✅ 22 Architecture Decision Records (ADR-001 through ADR-022)

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
- ✅ Pre-auth checkout flow — new customers select plan on `/pricing`, complete Stripe Checkout before account exists, provisioning happens after payment confirmation
- ✅ Checkout session — session creation, Stripe redirect, success/cancel URL handling
- ✅ Post-checkout provisioning — idempotent org/subscription/user/workforce creation with 3-attempt internal retry; never-stranded guarantee
- ✅ Password creation — httpOnly cookie auth; customer creates password on `/checkout/success`; auto sign-in to `/dashboard`
- ✅ Customer Portal — billing portal session creation and redirect
- ✅ Webhooks — 4 lifecycle events handled, HMAC-SHA-256 signature verification, 5-min replay protection
- ✅ Subscription enforcement — soft amber banner (unpaid/past_due/ending); billing_only hard gate (expired/canceled); fails open on null context
- ✅ Owner Protection — OWNER_ALWAYS_PATHS exempts owner from billing_only gate on 11 administrative routes; subscription enforcement unchanged for non-owner roles and feature routes
- ✅ Forgot password flow — `/forgot-password` → Supabase `resetPasswordForEmail` → `/auth/callback?next=/reset-password` → `/reset-password`
- ✅ Password reset production verification — B-006 resolved: `/confirm` page deployed (commit `69dd3f6`); Supabase template updated to `{{ .TokenHash }}` flow; end-to-end production verification confirmed
- ⬜ Upgrade/Downgrade — plan change flows (proration, timing)
- ⬜ Cancellation — cancellation handling and access revocation
- ⬜ Payment failure handling — dunning, retry logic, access suspension
- ⬜ Billing verification — end-to-end production test (see Success Criteria)

> ⚠️ ✅ items above are code implementation only. None qualify as ✅ Complete under the
> project definition until verified working in the running application.

**Code — complete and pushed (commit `7dbd5cc`)**

- ✅ `shared/integrations/stripe/index.ts` — `createCheckoutSession` (organizationId optional for pre-auth), `createPortalSession`, `retrieveCheckoutSession`, `updateStripeSubscriptionMetadata`, `verifyStripeWebhook` (no SDK, native fetch, Web Crypto HMAC-SHA-256, 5-min replay protection)
- ✅ `GET /api/checkout/start` — maps `?plan=build|grow|scale` to Stripe price ID; creates pre-auth checkout session; redirects to Stripe
- ✅ `POST /api/checkout/complete` — verifies Stripe payment; provisions platform account (idempotent); patches Stripe subscription metadata with `organization_id` for future webhook routing
- ✅ `POST /api/checkout/set-password` — sets password on newly-created account via Supabase Admin API; authorized via httpOnly `pending_password_setup` cookie (30-min expiry)
- ✅ `/checkout/success` — client page: provisioning spinner → password creation form → auto sign-in → `/dashboard`; client Retry button (3 attempts); support email fallback
- ✅ `POST /api/billing/checkout` — existing endpoint for authenticated billing page upgrades (still active)
- ✅ `POST /api/billing/portal` — requires existing `stripeCustomerId`
- ✅ `POST /api/webhooks/stripe` — handles 4 lifecycle events, HMAC signature verification
- ✅ `/forgot-password` — email form, `resetPasswordForEmail` with `redirectTo: /auth/callback?next=/reset-password`
- ✅ `/reset-password` — verifies recovery session via `getUser()`; calls `updateUser({ password })`; redirects to `/dashboard`
- ✅ `/auth/callback` — recovery branch: if `next === '/reset-password'` skip provisioning and redirect directly
- ✅ `app/(auth)/confirm/page.tsx` — scanner-proof password reset confirmation page at `/confirm`; renders form on GET without consuming OTP; Server Action calls `verifyOtp({ token_hash, type: 'recovery' })` only on form POST (user click); redirects to `/reset-password` on success
- ✅ `middleware.ts` — `/confirm` added to `PUBLIC_PATHS`; required so unauthenticated users can reach the confirm page
- ✅ `infrastructure/auth/guards.ts` — `OWNER_ALWAYS_PATHS`, `isOwner()`, `isOwnerAlwaysPath()`; 73 regression tests in `guards.test.ts`
- ✅ `app/(platform)/layout.tsx` — subscription enforcement + Owner Protection gate
- ✅ Middleware — x-pathname header; 6 new public paths including checkout and password routes
- ✅ Pricing page — plan CTAs link to `/api/checkout/start?plan=build|grow|scale` (not signup)
- ✅ Login page — "Forgot password?" link added
- ✅ Plan IDs: `unpaid` / `build` / `grow` / `scale` (all `free` / `starter` / `growth` references removed)
- ✅ `PLAN_PRICES_CENTS`: build=$99, grow=$499, scale=$1,499
- ✅ `stripePriceId()` reads `STRIPE_BUILD_PRICE_ID`, `STRIPE_GROW_PRICE_ID`, `STRIPE_SCALE_PRICE_ID`
- ✅ SCALE is self-serve Stripe checkout (no contact-sales gate)
- ✅ Schema migration 016 (`20260626000016_subscription_unique_per_org.sql`) — `subscriptions_organization_id_key` unique constraint; `subscriptions_tenant_id_key` dropped
- ✅ Test suite — 228 tests across 11 files (73 new owner-protection regression tests)
- 🟡 DB migration `plan_id 'free' → 'unpaid'` — SQL provided, execution in production not confirmed (Needs Review)

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

**End-to-End Verification — blocked on B-006 and B-001/B-002**

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

| Date       | Summary                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-06-23 | Phase 2 public pages: Landing, Features, Pricing, Privacy, Terms, Contact, Support. PublicHeader, PublicFooter. Middleware public route whitelist.                                                                                                                                                                                                                                                                                                            |
| 2026-06-23 | Logo/favicon: Trimmed + Wordmark PNG variants generated. Full favicon set. OG/Twitter images. PWA manifest. SEO metadata.                                                                                                                                                                                                                                                                                                                                     |
| 2026-06-23 | UI Polish: platform header h-10, auth Wordmark h-16, nav spacing widened, OG image regenerated.                                                                                                                                                                                                                                                                                                                                                               |
| 2026-06-23 | Phase 3.1 audit: complete readiness reports for Stripe, Manus, HeyGen, Higgsfield. Gaps identified: 4 missing Stripe env vars, webhook not registered, form/JSON mismatch, middleware blocking webhook.                                                                                                                                                                                                                                                       |
| 2026-06-24 | Stripe code fixes: middleware webhook exemption, checkout formData→JSON, `'free'`→`'unpaid'` plan rename, `PLAN_PRICES_CENTS` corrected to $99/$499.                                                                                                                                                                                                                                                                                                          |
| 2026-06-24 | Plan ID alignment: `starter`/`growth` → `build`/`grow`; SCALE added as purchasable Stripe tier with `planId: 'scale'`; `CheckoutButton` client component created; env var names updated.                                                                                                                                                                                                                                                                      |
| 2026-06-25 | KOOLERR_MASTER_TRACKER.md created.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 2026-06-26 | Billing/provisioning hardening: heal missing subscription on idempotent re-provision; login healing for already-authenticated users; suppress active package widget for unpaid plan; remove diagnostic logging.                                                                                                                                                                                                                                               |
| 2026-06-26 | Onboarding redesign (commit `81af314`): pre-auth Stripe checkout (/pricing → /api/checkout/start → Stripe → /checkout/success with provisioning + password creation + auto sign-in → /dashboard); /forgot-password and /reset-password; subscription enforcement (soft banner + billing_only gate); middleware x-pathname header; schema migration 016.                                                                                                       |
| 2026-06-27 | Owner Protection (commit `7dbd5cc`): OWNER_ALWAYS_PATHS in infrastructure/auth/guards.ts; isOwner() and isOwnerAlwaysPath() guards; platform layout gate updated; 73 regression tests; TypeScript clean; 228 tests passing; deployed to production.                                                                                                                                                                                                           |
| 2026-06-27 | Production verification: 5 of 6 items confirmed. Regression identified: password reset email links fail with otp_expired — Supabase OTP consumed by email security scanner before user click. Root cause documented. Fix not yet implemented (B-006).                                                                                                                                                                                                         |
| 2026-06-28 | Tracker synchronized with codebase state through commit 7dbd5cc. All unrecorded work from 2026-06-26 and 2026-06-27 entered. Phase 3 checklist, success criteria, and blockers updated.                                                                                                                                                                                                                                                                       |
| 2026-06-28 | B-006 root-cause verification (5 dimensions): confirmed OTP consumed by email scanner via {{ .ConfirmationURL }} → supabase.co/auth/v1/verify prefetch. Scanner-proof fix implemented (uncommitted): app/(auth)/confirm/page.tsx — verifyOtp on form POST only, not GET; middleware.ts — /confirm added to PUBLIC_PATHS. TypeScript clean, 228/228 tests pass. Pending: Supabase dashboard template change ({{ .TokenHash }} flow) + end-to-end verification. |
| 2026-06-28 | B-006 fix deployed (commit 69dd3f6) and Supabase email template updated to {{ .TokenHash }} flow. End-to-end production verification confirmed: reset email requested → /confirm link received → page rendered without consuming OTP → button clicked → recovery session established → /reset-password reached → new password saved → signed in successfully with new password. B-006 closed.                                                                 |
| 2026-06-29 | Tower Control v1 — all 12 phases built (commits `59afb77`–`fd0d279`). 234 tests. 44 production routes. Deployed to production.                                                                                                                                                                                                                                                                                                                                |
| 2026-07-01 | Customer Onboarding Pipeline — 7-step Business Profile wizard + AI Workforce trigger (commit `8111299`). 445 tests across 19 files.                                                                                                                                                                                                                                                                                                                           |
| 2026-07-08 | Campaign Architect Wizard Steps 1–4 complete. `createCampaign()` surfaced through service layer; `POST /api/tower/dogfooding/campaigns` added; Step 5 save+redirect implemented (commit `08d248b`); Step 4 Continue `disabled={editField !== null}` gate added (commit `2173c6b`). 563 tests passing. Step 5 is the active mission.                                                                                                                           |

---

## 9. Blockers

| ID    | Blocker                                                                                                                                                                                                                                                                                                                                                                                                            | Phase | Owner   | Status                            |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- | ------- | --------------------------------- |
| B-001 | Stripe Dashboard not configured (products, prices, webhook, portal)                                                                                                                                                                                                                                                                                                                                                | 3     | User    | 🟡 Pending                        |
| B-002 | Vercel Stripe env vars not set                                                                                                                                                                                                                                                                                                                                                                                     | 3     | User    | 🟡 Pending                        |
| B-003 | End-to-end checkout not verified                                                                                                                                                                                                                                                                                                                                                                                   | 3     | —       | ⬜ Waiting on B-001, B-002, B-006 |
| B-004 | DB migration `plan_id 'free'→'unpaid'` execution not confirmed                                                                                                                                                                                                                                                                                                                                                     | 3     | User    | 🟡 Needs Review                   |
| B-005 | Manus product role undefined                                                                                                                                                                                                                                                                                                                                                                                       | 4     | Founder | 🚫 Blocked                        |
| B-006 | ✅ RESOLVED — Password reset regression fixed. Root cause: Supabase OTP consumed by email scanner via `{{ .ConfirmationURL }}` prefetch. Fix: scanner-proof `/confirm` page (verifyOtp on form POST only, never on GET); Supabase email template updated to `{{ .TokenHash }}` flow; OTP expiry confirmed at 3600s. Deployed commit `69dd3f6`. End-to-end production verification confirmed by founder 2026-06-28. | 3     | —       | ✅ Resolved 2026-06-28            |

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

**2026-07-08** (Campaign Architect Wizard Steps 1–4 complete — Step 5 is the active mission)
