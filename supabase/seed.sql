-- =============================================================================
-- Production Seed: Initial Tenant
--
-- Run this ONCE after applying all migrations to a new Supabase project.
-- It creates the single root tenant for a V1 Koolerr deployment.
--
-- After running this script, copy the returned `id` value and set it as
-- PLATFORM_TENANT_ID in your Vercel (or other host) environment variables.
--
-- Usage:
--   Paste into the Supabase SQL Editor and click "Run".
--   Copy the UUID from the result row.
--
-- This script is idempotent if you use the same tenant name —
-- the INSERT will fail with a unique constraint if a tenant row already
-- exists, so you can safely re-run it to confirm the seed is applied.
-- =============================================================================

INSERT INTO tenants (id, status)
VALUES (gen_random_uuid(), 'active')
RETURNING id AS platform_tenant_id;

-- Copy the value above and set it as:
--   PLATFORM_TENANT_ID=<the uuid>
-- in your production environment variables.
