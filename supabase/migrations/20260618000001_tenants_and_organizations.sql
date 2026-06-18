-- =============================================================================
-- Migration 001: Tenants & Organizations
--
-- Foundation tables. Every other table in the platform is scoped to a tenant
-- through either a direct tenant_id column or through organization_id →
-- organizations.tenant_id.
--
-- Tenant isolation is enforced at this layer via Row-Level Security. The
-- current_tenant_id() function extracts the tenant from the JWT so that
-- application code never has to manually scope queries.
--
-- See FOUNDATION_001_ARCHITECTURE.md §2.1, §2.2, §8.1, §8.3.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- RLS helper
-- Extract the current tenant from the JWT custom claim 'tenant_id'.
-- Returns NULL if the claim is absent (e.g. unauthenticated or service role).
-- Service role bypasses RLS entirely; this function is used by user JWTs.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT NULLIF(COALESCE(auth.jwt() ->> 'tenant_id', ''), '')
$$;

-- ---------------------------------------------------------------------------
-- Tenants
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tenants (
  id          text PRIMARY KEY,
  status      text NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'suspended', 'terminated')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenants_tenant_isolation" ON tenants
  FOR ALL
  USING (id = current_tenant_id());

-- ---------------------------------------------------------------------------
-- Organizations
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS organizations (
  id          text PRIMARY KEY,
  tenant_id   text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        text NOT NULL,
  status      text NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'inactive')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS organizations_tenant_id_idx ON organizations(tenant_id);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organizations_tenant_isolation" ON organizations
  FOR ALL
  USING (tenant_id = current_tenant_id());
