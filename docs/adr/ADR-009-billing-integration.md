# ADR-009: Billing Integration & Entitlement Enforcement

**Status:** Accepted  
**Phase:** 16 — Billing Integration & Entitlement Enforcement  
**Date:** 2026-06-18

---

## Context

FOUNDATION_003 Phase 1 requires: "A simple subscription or usage model must be in place before the first real customer activates." The billing domain infrastructure was complete (tables, repository, service, usage sink wired to Model Gateway) but inert:

- No subscription was created during account provisioning
- No entitlement limits were set for new organizations
- No enforcement gate checked whether a customer had remaining runs before executing
- `engagement_run` usage events were never recorded (only `model_invocation` was tracked via the Model Gateway sink)
- Customers had no visible page to see their plan or usage

This phase closes all four gaps using only the existing billing infrastructure — no new tables, no new services, no new providers.

---

## Decisions

### 1. Free tier subscription created during provisioning

**Decision:** `provisionPlatformAccount` Step 7 calls `billingService.createSubscription({ planId: 'free' })` for every new Organization. If billing fails (e.g., DB error), the failure is non-fatal: a warning is logged and the account is created without billing. The subscription can be corrected without blocking the customer from accessing the platform.

**Rationale:** Account creation must not fail because billing has a transient issue. Billing accuracy matters — billing blocking onboarding does not. This follows the same resilience pattern as the audit logger (`log()` never throws) and the usage sink (billing failures are warned but not propagated).

**Idempotency:** `createSubscription` already guards against duplicate subscriptions for the same tenant via `findSubscriptionByTenantId` check before insert.

---

### 2. Plan constants in `domains/billing/plans.ts`

**Decision:** A new `plans.ts` file defines `PLAN_IDS`, `PLAN_LABELS`, and `PLAN_ENTITLEMENTS`. Provisioning and the usage UI both import from here.

**Rationale:** Without a single source of truth, the entitlement limits set during provisioning and the limits displayed in the UI could diverge. A constants file makes drift impossible.

**Free tier:** `engagement_run: 10` runs/month, `model_invocation: 50,000` tokens/month.

---

### 3. Default entitlements set during provisioning

**Decision:** After creating the free-tier subscription, provisioning iterates `PLAN_ENTITLEMENTS[PLAN_IDS.free]` and calls `billingService.setEntitlement()` for each feature. Entitlements use upsert semantics (existing `(organizationId, feature)` pairs are updated, not duplicated).

**Rationale:** Entitlements separate the concept of "what is the limit?" from "what has been used?" Setting them at provisioning means `checkEntitlement` always returns real data, not the fallback `Infinity` that the service returns when no entitlement row exists.

---

### 4. Entitlement enforcement gate in the executor

**Decision:** `executeContentEngagementRun` checks `checkEntitlement({ feature: 'engagement_run', quantityRequested: 1 })` before loading employees or doing any work. If `used >= limit`, it throws an error with `code: PlatformErrorCode.BILLING_ERROR`. The API route catches this and returns HTTP 402.

**Rationale:** The enforcement check must happen before any resources are consumed — not after. If we check after creating an engagement run record, we'd need to clean it up on billing failure. Pre-check is simpler and correct.

**Non-fatal check failure:** If `checkEntitlement` itself fails (DB unreachable), the error is silently swallowed and execution proceeds. A billing service failure should not block a customer who hasn't hit their limit.

---

### 5. `engagement_run` usage event recorded after run completion

**Decision:** At Step 8 of the executor (after run completes and deliverable is submitted), `billingService.recordUsageEvent({ type: 'engagement_run', quantity: 1 })` is called. The service's `recordUsageEvent` implementation automatically increments `used` on the matching entitlement row.

**Rationale:** The Model Gateway already records `model_invocation` usage (tokens) via the billing sink. `engagement_run` usage (run count) was never recorded, leaving the entitlement counter permanently at 0 and the enforcement gate permanently open. Recording after completion (not before) means only successful runs count against the limit.

**Failure is non-fatal:** If recording fails, a `logger.warn` is emitted. A completed run that fails to record usage is better than a recorded run that fails to complete.

---

### 6. Usage page at `/usage`

**Decision:** A Server Component at `app/(platform)/usage/page.tsx` fetches subscription and entitlements in parallel and renders plan, period, and usage progress bars. The page links to the Audit Trail. A "Usage" nav link is added to the platform layout.

**Rationale:** Customers need to see their plan and usage to make informed decisions. The page is read-only. Plan upgrades are Phase 2+ scope (requires payment processor integration, which is out of Phase 1 scope).

---

## Known Limitations

- **No payment processor:** The free tier is the only plan. Upgrading is not possible through the UI. Payment processor integration (Stripe, etc.) is Phase 2+ scope.
- **Period resets not automatic:** Entitlement `used` counters are not automatically reset at period end. A cron job or DB trigger to reset counters at `current_period_end` is Phase 2 scope. In Phase 1, the free tier is generous enough that most customers won't hit the limit during a single month.
- **Subscription creation non-fatal:** An account can exist without a subscription record if provisioning's billing step fails. The Usage page handles this gracefully by rendering "Unknown" plan status.
- **Token limit is coarse:** `model_invocation` tracks cumulative tokens. Three runs of ~3,000 tokens each = ~9,000 tokens. The 50,000-token free tier is not the binding constraint in Phase 1 — run count is. This is intentional: token-based limits require more granular UX to be useful.
