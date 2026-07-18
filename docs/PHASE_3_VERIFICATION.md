# Phase 3 — Stripe Integration: Production Verification Checklist

**Environment:** koolerr.vercel.app (Stripe Test Mode)
**Prerequisite:** Complete sections in order. Each section depends on the previous.
**DB access:** Supabase Dashboard → Table Editor → `subscriptions` table.
**Stripe access:** dashboard.stripe.com → Developers → Webhooks and Events.

---

## How to Read This Checklist

Each step has three parts:

- **Action** — what to do
- **Expect** — what success looks like
- **DB state** — what columns to verify in the `subscriptions` row for the test org

Mark each item ✅ Pass or ❌ Fail. Record any failure with the actual behaviour and the HTTP
status or error text observed.

---

## Section 1 — Stripe Dashboard Configuration

> Goal: confirm all Stripe-side infrastructure is in place before any code path is exercised.

### 1.1 Products and Prices

- [ ] Navigate to dashboard.stripe.com → Products.
- [ ] Confirm three products exist: **Koolerr BUILD**, **Koolerr GROW**, **Koolerr SCALE**.
- [ ] For each product, open the product detail and confirm exactly one recurring monthly price is
      active:
  - BUILD → $99.00 / month
  - GROW → $499.00 / month
  - SCALE → $1,499.00 / month
- [ ] Copy the three Price IDs (format `price_...`). These must match `STRIPE_BUILD_PRICE_ID`,
      `STRIPE_GROW_PRICE_ID`, `STRIPE_SCALE_PRICE_ID` in Vercel.

### 1.2 Webhook Endpoint

- [ ] Navigate to Developers → Webhooks.
- [ ] Confirm one endpoint is registered:
      `https://koolerr.vercel.app/api/webhooks/stripe`
- [ ] Confirm the endpoint is **Enabled** (not disabled).
- [ ] Confirm exactly these four events are subscribed:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
- [ ] Copy the Webhook Signing Secret (format `whsec_...`). Must match `STRIPE_WEBHOOK_SECRET`.

### 1.3 Customer Portal

- [ ] Navigate to Settings → Customer Portal.
- [ ] Confirm the portal is **Active** (not in test-only draft).
- [ ] Confirm the Return URL is `https://koolerr.vercel.app/billing`.
- [ ] Confirm the portal allows customers to:
  - Update payment methods
  - Cancel subscriptions
  - View billing history

---

## Section 2 — Vercel Environment Variables

> Goal: confirm all six required env vars are set in the Production environment.

- [ ] Navigate to vercel.com → koolerr project → Settings → Environment Variables.
- [ ] Filter to **Production** environment. Confirm all six variables are present:

| Variable                | Expected format                              |
| ----------------------- | -------------------------------------------- |
| `STRIPE_SECRET_KEY`     | `sk_test_...` (test) or `sk_live_...` (live) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...`                                  |
| `STRIPE_BUILD_PRICE_ID` | `price_...` matching BUILD product           |
| `STRIPE_GROW_PRICE_ID`  | `price_...` matching GROW product            |
| `STRIPE_SCALE_PRICE_ID` | `price_...` matching SCALE product           |
| `NEXT_PUBLIC_APP_URL`   | `https://koolerr.vercel.app`                 |

- [ ] Confirm none of the values contain leading/trailing whitespace (copy-paste risk).
- [ ] Confirm a **redeployment** has been triggered after the last env var change, so the live
      deployment picks up the current values.

### 2.1 Billing Page Smoke Test

- [ ] Sign in to koolerr.vercel.app as owner (ronlou101@gmail.com).
- [ ] Navigate to `/billing`.

**Expect:** The amber "Payments not yet active" banner is **absent**. Its presence means
`STRIPE_SECRET_KEY` is unset or the deployment did not pick up the variable.

---

## Section 3 — New Customer Checkout

> Goal: verify the end-to-end new-customer flow from `/pricing` through account provisioning.
> Use a fresh incognito browser session (not signed in).

### 3.1 Checkout initiation

- [ ] Open `https://koolerr.vercel.app/pricing` in an incognito window.
- [ ] Click the **Start Hiring AI** button on the BUILD card ($99/month).

**Expect:** Browser redirects to `checkout.stripe.com/...` (Stripe-hosted Checkout page).
No error page. Stripe Checkout shows "Koolerr BUILD — $99.00 / month".

### 3.2 Payment with test card

- [ ] On the Stripe Checkout page, enter:
  - Email: a fresh test address (e.g. `testcustomer+1@example.com`)
  - Card number: `4242 4242 4242 4242`
  - Expiry: any future date (e.g. `12/30`)
  - CVC: any 3 digits (e.g. `123`)
  - Name: any value
- [ ] Click **Subscribe**.

**Expect:** Stripe processes the payment and redirects back to
`https://koolerr.vercel.app/checkout/success?session_id=cs_test_...`.

### 3.3 Provisioning spinner

- [ ] On `/checkout/success`, the page shows a provisioning spinner briefly, then a password
      creation form appears.

**Expect (within ~5 seconds):** Password creation form is visible.
A "Retry" button should NOT appear unless provisioning failed.

**If the Retry button appears:**

- Check Vercel function logs for `/api/checkout/complete`.
- Common causes: Supabase service role key missing, database unreachable.

### 3.4 Password creation and auto sign-in

- [ ] Enter a secure password in both fields and click **Create Password & Sign In**.

**Expect:** Redirect to `/dashboard`. The platform header shows the Koolerr logo and nav.
No redirect to `/login`.

### 3.5 DB state after checkout

- [ ] In Supabase → Table Editor → `subscriptions`, find the row for the newly provisioned org.
- [ ] Verify all columns:

| Column                   | Expected             |
| ------------------------ | -------------------- |
| `plan_id`                | `build`              |
| `status`                 | `active`             |
| `stripe_customer_id`     | `cus_...` (not null) |
| `stripe_subscription_id` | `sub_...` (not null) |
| `stripe_price_id`        | the BUILD price ID   |
| `current_period_end`     | ~30 days from now    |

**If `stripe_customer_id` or `stripe_subscription_id` is null:** the
`checkout.session.completed` webhook did not fire or was not processed. See Section 4.1.

### 3.6 Billing page after checkout

- [ ] Navigate to `/billing` while signed in as the new test customer.

**Expect:**

- Active Package widget is visible showing **BUILD — AI Workforce Package**.
- Status shows `active`.
- "Renews [date]" shows ~30 days out.
- "Manage Billing →" button is visible (requires `stripeCustomerId`).
- "Cancel subscription" link is visible below the Manage Billing button.
- BUILD card shows **Your Current Package** (no CTA button).
- GROW and SCALE cards show **PlanChangeButton** CTAs ("Scale My AI Team" and "Talk to Our Team").
- No amber "Payments not yet active" banner.

---

## Section 4 — Webhook Processing

> Goal: confirm all four webhook events are received, verified, and processed correctly.

### 4.1 Inspect `checkout.session.completed`

- [ ] In Stripe Dashboard → Developers → Webhooks → click your endpoint.
- [ ] Find the most recent `checkout.session.completed` event (from Section 3).
- [ ] Click the event to view details.

**Expect:**

- Response status: **200**
- Response body: `{"received":true}`
- No error in the response.

**If status is 400:** Signature verification failed. Check `STRIPE_WEBHOOK_SECRET` matches.
**If status is 500:** Server error. Check Vercel function logs for `[STRIPE_WEBHOOK]` entries.

### 4.2 Inspect `customer.subscription.updated`

- [ ] In the same webhook events list, find the `customer.subscription.updated` event that
      immediately followed the checkout (Stripe fires this when a new subscription is created).

**Expect:** Response status **200**, body `{"received":true}`.

Check Vercel logs for this event. Look for:

```
[STRIPE_WEBHOOK] Subscription updated { resolvedPlanId: 'build' }
```

If `resolvedPlanId` shows `(unknown price)`, the `STRIPE_BUILD_PRICE_ID` env var does not
match the price ID on the Stripe subscription. This will prevent `planId` from syncing on
plan changes. Resolve the mismatch before continuing.

### 4.3 Manual event send (optional deep test)

- [ ] In the webhook endpoint detail page, click **Send test webhook**.
- [ ] Send a `customer.subscription.updated` event.

**Expect:** Status **200** in the response log.
This confirms the endpoint is reachable and the signature secret is correct independently
of any live subscription.

---

## Section 5 — Billing Page: Active Subscription Display

> Continuing with the test customer from Section 3.

- [ ] Navigate to `/billing` as the test BUILD customer.
- [ ] Verify the Active Package widget contains:
  - Plan name: **BUILD — AI Workforce Package**
  - Status: `active`
  - Renewal date displayed
  - "Manage Billing →" button
  - "Cancel subscription" link
- [ ] Verify platform layout has **no amber soft banner** (subscription is active).
- [ ] Navigate to `/dashboard` and confirm the platform renders fully (no `billing_only` gate).

---

## Section 6 — BUILD → GROW Upgrade

### 6.1 Initiate upgrade

- [ ] On `/billing` as the BUILD test customer, click **Scale My AI Team** on the GROW card.
- [ ] Button shows "Updating…" while the request is in flight.

**Expect (within ~3 seconds):** Page reloads automatically (`window.location.reload()`).

**If an error message appears below the button:**

- Check browser DevTools → Network → `POST /api/billing/upgrade` for the response body.
- A 409 means the subscription is already on this plan.
- A 503 means `STRIPE_GROW_PRICE_ID` is not configured in Vercel.
- A 502 means Stripe rejected the request (check Vercel logs).

### 6.2 Verify billing page after reload

**Expect after page reload:**

- Active Package widget now shows **GROW — AI Workforce Package**.
- Status: `active`.
- GROW card shows **Your Current Package**.
- BUILD card shows **Switch to BUILD** (PlanChangeButton, not CheckoutButton).
- SCALE card shows **Talk to Our Team** (PlanChangeButton, upgrade CTA).

> Note: The green "Your AI Workforce Package has been updated" banner does NOT appear here
> because `window.location.reload()` does not append `?upgraded=true`. The banner only
> appears after a new checkout session. This is expected behaviour.

### 6.3 Stripe Dashboard verification

- [ ] In Stripe → Customers, find the test customer.
- [ ] Open their subscription. Confirm:
  - Current plan: GROW ($499/month)
  - A proration invoice was generated for the mid-cycle upgrade.

- [ ] In Webhooks, find the `customer.subscription.updated` event that fired after the upgrade.
      Confirm status **200**.

### 6.4 DB state after BUILD → GROW

| Column                   | Expected                               |
| ------------------------ | -------------------------------------- |
| `plan_id`                | `grow`                                 |
| `status`                 | `active`                               |
| `stripe_price_id`        | the GROW price ID                      |
| `stripe_subscription_id` | unchanged (same sub ID, not a new one) |
| `current_period_end`     | updated to new period end              |

---

## Section 7 — GROW → SCALE Upgrade

### 7.1 Initiate upgrade

- [ ] On `/billing` as the now-GROW customer, click **Talk to Our Team** on the SCALE card.
- [ ] Page reloads on success.

**Expect after reload:**

- Active Package widget: **SCALE — AI Workforce Package**, status `active`.
- SCALE card: **Your Current Package**.
- BUILD card: **Switch to BUILD**.
- GROW card: **Switch to GROW**.

### 7.2 Stripe Dashboard verification

- [ ] Confirm SCALE ($1,499/month) is the active plan on the Stripe subscription.
- [ ] `customer.subscription.updated` webhook → status 200.
- [ ] Vercel logs show `resolvedPlanId: 'scale'`.

### 7.3 DB state after GROW → SCALE

| Column            | Expected           |
| ----------------- | ------------------ |
| `plan_id`         | `scale`            |
| `stripe_price_id` | the SCALE price ID |

---

## Section 8 — SCALE → BUILD Downgrade

### 8.1 Initiate downgrade

- [ ] On `/billing` as the SCALE customer, click **Switch to BUILD** on the BUILD card.
- [ ] Page reloads on success.

**Expect after reload:**

- Active Package widget: **BUILD — AI Workforce Package**, status `active`.
- BUILD card: **Your Current Package**.
- GROW card: **Scale My AI Team** (upgrade CTA).
- SCALE card: **Talk to Our Team** (upgrade CTA).

### 8.2 Stripe Dashboard verification

- [ ] Confirm BUILD ($99/month) is now the active plan on the Stripe subscription.
- [ ] A scheduled downgrade (change at period end) may appear depending on Stripe proration
      settings. Our route uses `proration_behavior: 'create_prorations'`, which applies the
      change immediately with a credit proration.
- [ ] `customer.subscription.updated` webhook → status 200.
- [ ] Vercel logs show `resolvedPlanId: 'build'`.

### 8.3 DB state after SCALE → BUILD

| Column            | Expected           |
| ----------------- | ------------------ |
| `plan_id`         | `build`            |
| `stripe_price_id` | the BUILD price ID |

---

## Section 9 — Cancel at Period End

### 9.1 Cancel button flow

- [ ] On `/billing` as the BUILD customer, locate the **Cancel subscription** link below the
      "Manage Billing →" button in the Active Package widget.
- [ ] Click **Cancel subscription**.

**Expect:** Two-step confirmation UI appears inline:

- "Your access continues until [period end date]. Cancel anyway?"
- "Yes, cancel" button (destructive red)
- "Keep plan" button

- [ ] Click **Keep plan**.

**Expect:** Confirmation UI disappears. Cancel link is visible again. Nothing was cancelled.

- [ ] Click **Cancel subscription** again, then click **Yes, cancel**.
- [ ] Button shows "Canceling…" while the request is in flight.

**Expect (within ~3 seconds):** Inline text appears:
"Subscription will end on [period end date]. Your access continues until then."

### 9.2 Stripe Dashboard verification

- [ ] In Stripe → Customers → test customer's subscription, confirm:
  - `cancel_at_period_end: true` is set on the subscription.
  - The subscription status is still **Active** (it remains active until period end).

- [ ] In Webhooks, find the `customer.subscription.updated` event that fired after the cancel.
      Confirm status **200**.

### 9.3 DB state after cancel at period end

| Column                   | Expected                                             |
| ------------------------ | ---------------------------------------------------- |
| `plan_id`                | `build` (unchanged)                                  |
| `status`                 | `active` (unchanged — Stripe status is still active) |
| `stripe_subscription_id` | unchanged                                            |

> Note: The app does not store `cancel_at_period_end` or `cancel_at` in the DB. The
> subscription appears `active` until Stripe fires `customer.subscription.deleted` at
> the actual period end.

### 9.4 Billing page after cancel (page reload)

- [ ] Reload `/billing`.

**Expect:**

- Active Package widget: still shows BUILD, status `active` (because DB status is still active).
- **"Cancel subscription" link is still visible** — this is expected behaviour. The button
  will disappear only after the period ends and the webhook sets status to `canceled`.
- No soft amber banner (subscription is still active).

### 9.5 Platform access while pending cancellation

- [ ] Navigate to `/dashboard`, `/runs`, and at least one other platform route.

**Expect:** Full access. No amber banner. `resolveAccessLevel` returns `full` when status is
`active`, regardless of `cancel_at_period_end`.

---

## Section 10 — Reactivate Before Period End

> The app does not have a native Reactivate button. Reactivation is handled through the
> Stripe Customer Portal, which removes `cancel_at_period_end`.

### 10.1 Open Customer Portal

- [ ] On `/billing`, click **Manage Billing →** button in the Active Package widget.

**Expect:** Browser navigates to a `billing.stripe.com/...` Customer Portal session URL.
No error page.

### 10.2 Reactivate in portal

- [ ] In the Customer Portal, locate the pending cancellation notice.
- [ ] Click **Renew subscription** (or equivalent — Stripe labels this differently across portal
      configurations).
- [ ] Confirm the reactivation in the portal.
- [ ] Close or navigate back to `https://koolerr.vercel.app/billing` (the configured return URL).

**Expect:** Portal closes and redirects to `/billing`.

### 10.3 Stripe Dashboard verification after reactivation

- [ ] In Stripe, confirm `cancel_at_period_end` is now `false` on the subscription.
- [ ] A `customer.subscription.updated` webhook fired. Status **200**.

### 10.4 DB state after reactivation

| Column    | Expected                                  |
| --------- | ----------------------------------------- |
| `status`  | `active` (unchanged — was already active) |
| `plan_id` | `build` (unchanged)                       |

> The DB state will look identical before and after reactivation because our status mapping
> never departed from `active`. No defect — the subscription was never in a non-active state
> from the DB's perspective.

### 10.5 Billing page after reactivation

- [ ] Reload `/billing`.

**Expect:** The "Cancel subscription" link is still visible (DB status is active and
`cancel_at_period_end` is not tracked in the DB). This is expected behaviour.
No amber banner.

---

## Section 11 — Payment Failure Simulation

> Stripe test mode allows simulating payment failures through the Dashboard without needing
> to wait for a real dunning cycle.

### 11.1 Method A — Dashboard trigger (preferred)

- [ ] In Stripe → Customers → test customer's subscription, click **Actions** →
      **Simulate payment failure** (available in test mode).

**Expect:** Stripe fires `invoice.payment_failed` to the webhook endpoint.

### 11.2 Method B — Test card (alternative)

If Method A is not available:

- [ ] Open the Customer Portal and update the payment method to card `4000 0000 0000 0341`
      (card number that always declines on charge, but attaches successfully).
- [ ] Wait for Stripe to attempt the next invoice or manually trigger a new invoice in the
      Stripe Dashboard.

### 11.3 Webhook verification

- [ ] In Stripe → Webhooks → endpoint, find the `invoice.payment_failed` event.
- [ ] Confirm response status **200**.

**If the webhook returns 200 but DB status is NOT updated — known risk:**
The `invoice.payment_failed` handler routes off `invoice.metadata.organization_id`.
Stripe invoice objects do not automatically inherit subscription metadata. If
`invoice.metadata` is empty, the handler silently skips the update (logs a 200 but takes
no action). If this happens:

- In Vercel logs, look for `[STRIPE_WEBHOOK] Event received { type: 'invoice.payment_failed' }`.
- If the next log line is NOT `[STRIPE_WEBHOOK] Payment failed — subscription past_due`, then
  `invoice.metadata.organization_id` was missing.
- **This is a defect.** Record it and pause verification — this must be fixed before Phase 3
  can be marked complete.

### 11.4 DB state after payment failure (if webhook processed correctly)

| Column    | Expected   |
| --------- | ---------- |
| `status`  | `past_due` |
| `plan_id` | unchanged  |

### 11.5 Soft amber banner (past_due)

- [ ] Reload the platform while signed in as the test customer.

**Expect:** Amber soft banner at the top of the platform:

> "Your last payment failed. Update your payment method to avoid interruption."

- [ ] Confirm the banner appears on `/dashboard`, `/runs`, and at least one other route.
- [ ] Confirm platform features are still accessible (soft = warning only, not blocked).

### 11.6 Restore payment method

- [ ] In the Customer Portal, update the payment method back to `4242 4242 4242 4242`.
- [ ] In Stripe Dashboard, trigger a manual invoice retry or wait for Stripe dunning retry.

**Expect:** `invoice.payment_succeeded` fires → `customer.subscription.updated` fires
with status `active` → DB status returns to `active`.

**Expect after DB update:** Amber banner disappears on next page load.

---

## Section 12 — Customer Portal Synchronization

> Goal: confirm that plan changes made via the Stripe Customer Portal (outside the app) are
> correctly reflected in the DB through the `customer.subscription.updated` webhook.

### 12.1 Change plan via portal

- [ ] Open the Customer Portal from `/billing` → **Manage Billing →**.
- [ ] Change the plan to GROW ($499/month) using the portal's plan selection UI.
- [ ] Confirm the change in the portal and return to the app.

### 12.2 Webhook verification

- [ ] In Stripe, confirm a `customer.subscription.updated` event fired.
- [ ] Response status: **200**.
- [ ] In Vercel logs, find `[STRIPE_WEBHOOK] Subscription updated` and confirm
      `resolvedPlanId: 'grow'`.

### 12.3 DB state after portal plan change

| Column            | Expected          |
| ----------------- | ----------------- |
| `plan_id`         | `grow`            |
| `stripe_price_id` | the GROW price ID |
| `status`          | `active`          |

### 12.4 Billing page after portal plan change

- [ ] Navigate to `/billing` (or reload).

**Expect:** Active Package widget shows **GROW — AI Workforce Package**. The billing page
has updated without any in-app action — purely driven by the webhook.

This confirms that the Stripe Customer Portal and the in-app billing page are in sync
through the webhook, not through a direct database write in the plan-change routes.

---

## Section 13 — Database State Reference

> Quick reference. Check `subscriptions` table after each transition.

| Transition                      | `plan_id` | `status`   | `stripe_subscription_id` | `stripe_price_id` | `current_period_end` |
| ------------------------------- | --------- | ---------- | ------------------------ | ----------------- | -------------------- |
| After new checkout (BUILD)      | `build`   | `active`   | populated                | BUILD price       | ~30 days             |
| After BUILD → GROW upgrade      | `grow`    | `active`   | same                     | GROW price        | updated              |
| After GROW → SCALE upgrade      | `scale`   | `active`   | same                     | SCALE price       | updated              |
| After SCALE → BUILD downgrade   | `build`   | `active`   | same                     | BUILD price       | updated              |
| After cancel at period end      | `build`   | `active`   | same                     | same              | unchanged            |
| After period ends (post-cancel) | `build`   | `canceled` | same                     | same              | unchanged            |
| After reactivation (portal)     | `build`   | `active`   | same                     | same              | unchanged            |
| After payment failure           | any       | `past_due` | same                     | same              | unchanged            |
| After payment restored          | any       | `active`   | same                     | same              | updated              |

> `stripe_subscription_id` must never change across plan changes. A new `sub_...` ID
> indicates a new subscription was created (double-subscription bug), which was fixed in
> the Phase 3 implementation.

---

## Verification Sign-Off

| Section                           | Result          | Notes |
| --------------------------------- | --------------- | ----- |
| 1 — Stripe Dashboard              | ☐ Pass / ☐ Fail |       |
| 2 — Vercel Env Vars               | ☐ Pass / ☐ Fail |       |
| 3 — New Customer Checkout         | ☐ Pass / ☐ Fail |       |
| 4 — Webhook Processing            | ☐ Pass / ☐ Fail |       |
| 5 — Billing Page Display          | ☐ Pass / ☐ Fail |       |
| 6 — BUILD → GROW Upgrade          | ☐ Pass / ☐ Fail |       |
| 7 — GROW → SCALE Upgrade          | ☐ Pass / ☐ Fail |       |
| 8 — SCALE → BUILD Downgrade       | ☐ Pass / ☐ Fail |       |
| 9 — Cancel at Period End          | ☐ Pass / ☐ Fail |       |
| 10 — Reactivate Before Period End | ☐ Pass / ☐ Fail |       |
| 11 — Payment Failure              | ☐ Pass / ☐ Fail |       |
| 12 — Portal Synchronization       | ☐ Pass / ☐ Fail |       |

**Phase 3 is complete when all 12 sections pass with no open defects.**

---

## Known Risks and Defect Watch List

**Risk 1 — `invoice.payment_failed` may not resolve `organization_id`**

The `invoice.payment_failed` webhook handler reads `invoice.metadata.organization_id` to
identify which org had the payment failure. Stripe invoice objects do not automatically
inherit the metadata that was set on the parent subscription. If invoices are created with
empty metadata, the handler will silently skip the `past_due` status update.

Verify this in Section 11. If confirmed, the fix is to look up the organization by
`invoice.subscription` (the subscription ID) using a new billing service method, rather
than relying on invoice metadata. Do not code the fix until the defect is confirmed.

**Risk 2 — `cancel_at_period_end` not reflected in billing page**

After cancelling at period end, the "Cancel subscription" link continues to appear on the
billing page (because DB status remains `active`). This is expected given the current data
model, which does not store `cancel_at_period_end`. If this is confusing for the owner
during dogfooding, a fix would be to store the `cancel_at` timestamp in the subscriptions
table and reflect it in the billing page. Do not code the fix unless requested.

**Risk 3 — Reactivation not surfaced in app UI**

Reactivation (removing `cancel_at_period_end`) requires the Stripe Customer Portal. The
app has no native Reactivate button. This is acceptable for launch — the portal handles it.
Note for future Phase 5 consideration.
