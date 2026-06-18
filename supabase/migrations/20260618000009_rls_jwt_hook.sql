-- =============================================================================
-- Migration 009: RLS JWT Hook — Link Supabase Auth Users to Platform Tenants
--
-- Context
-- -------
-- All 22 platform tables have ROW LEVEL SECURITY enabled and policies that
-- call current_tenant_id(), which reads auth.jwt() ->> 'tenant_id'. However,
-- this claim has never been populated because:
--   (a) There is no Supabase custom access token hook registered, and
--   (b) The users table has no column mapping a Supabase Auth UUID to a
--       platform tenant_id.
--
-- This migration resolves both gaps:
--   1. Adds auth_user_id (the Supabase Auth UUID) to the users table.
--   2. Creates public.custom_access_token_hook, which looks up the tenant_id
--      from the users table and injects it as a JWT claim every time Supabase
--      Auth issues a token.
--
-- After this migration:
--   - New users provisioned with an authUserId get DB-layer tenant isolation.
--   - Existing users without auth_user_id continue to work via app-layer
--     isolation (current_tenant_id() returns NULL for them; policies DENY
--     by default, but the service-role key used by all repositories bypasses
--     RLS, so production behaviour is unchanged).
--
-- Manual step required after deploying
-- ─────────────────────────────────────
-- Register the hook in the Supabase dashboard:
--   Authentication → Hooks → Enable "Custom Access Token"
--   Function: public.custom_access_token_hook
--
-- See docs/adr/ADR-012-rls-enforcement.md
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Add auth_user_id to the users table.
--    auth_user_id is the UUID that Supabase Auth assigns to each user at
--    registration (auth.users.id). It is UNIQUE because one Supabase Auth
--    account maps to exactly one platform user record.
-- ---------------------------------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id text UNIQUE;

CREATE INDEX IF NOT EXISTS users_auth_user_id_idx ON users (auth_user_id)
  WHERE auth_user_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. JWT hook function.
--    Called by Supabase Auth each time it issues an access token.
--    Resolves tenant_id from auth_user_id and injects it as a custom claim.
--    Returns the event unchanged if no platform user record exists yet
--    (e.g., pre-provisioning, or users created before this migration).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims        jsonb;
  user_tenant_id text;
BEGIN
  -- Resolve tenant_id from the Supabase Auth UUID stored at provisioning.
  SELECT tenant_id INTO user_tenant_id
  FROM public.users
  WHERE auth_user_id = (event ->> 'user_id');

  claims := event -> 'claims';

  -- Only inject the claim when a platform user record exists.
  -- Unauthenticated or not-yet-provisioned users receive no tenant_id claim,
  -- so current_tenant_id() returns NULL and all RLS policies deny access.
  IF user_tenant_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{tenant_id}', to_jsonb(user_tenant_id));
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Grant permissions required for the hook to fire.
--    supabase_auth_admin is the internal role that Supabase Auth uses when
--    calling hook functions. No other roles need execute permission.
-- ---------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM PUBLIC, anon, authenticated;
