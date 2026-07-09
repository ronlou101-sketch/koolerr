-- =============================================================================
-- Migration 016: Fix subscription uniqueness constraint
--
-- The original migration 006 declared UNIQUE (tenant_id) on the subscriptions
-- table, which allows only one subscription row per tenant. Because all
-- organizations share a single PLATFORM_TENANT_ID, this silently prevented
-- provisioning from creating subscription rows for any organization after the
-- first. The createSubscription call in provision.ts hit a unique constraint
-- violation, was treated as non-fatal, and new accounts were left with no
-- subscription row.
--
-- The correct invariant is one subscription per organization.
-- This migration drops the tenant-level unique constraint and replaces it
-- with an organization-level one.
-- =============================================================================

ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_tenant_id_key;

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_organization_id_key UNIQUE (organization_id);
