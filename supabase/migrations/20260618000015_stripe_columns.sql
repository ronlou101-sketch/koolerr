-- Phase 3 Milestone 4: Stripe Billing Foundation
--
-- Adds Stripe customer/subscription identifiers to the subscriptions table
-- and introduces paid plan IDs for the starter and growth tiers.
-- Stripe webhooks update these columns on checkout completion and
-- subscription lifecycle events.
--
-- All columns are nullable — existing free-tier subscriptions are
-- unaffected and do not need Stripe identifiers.
--
-- See docs/adr/ADR-021-stripe-billing-integration.md

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS stripe_customer_id     text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS stripe_price_id        text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id
  ON subscriptions(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id
  ON subscriptions(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;
