-- =============================================================================
-- Migration 002: Identity Domain
--
-- Users, sessions, organization memberships, and API keys.
--
-- All tables include tenant_id for direct RLS enforcement. Users and sessions
-- carry it natively. Memberships and API keys join to organizations for the
-- tenant resolution.
--
-- API keys store a SHA-256 hash of the key value — the plaintext is shown
-- once at issuance and never stored. Validation hashes the provided value
-- and compares against key_hash.
--
-- See FOUNDATION_001_ARCHITECTURE.md §2.15 — Identity & Access.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id          text PRIMARY KEY,
  tenant_id   text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email       text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email, tenant_id)
);

CREATE INDEX IF NOT EXISTS users_tenant_id_idx      ON users(tenant_id);
CREATE INDEX IF NOT EXISTS users_email_tenant_idx   ON users(email, tenant_id);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_tenant_isolation" ON users
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- ---------------------------------------------------------------------------
-- Sessions
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sessions (
  id          text PRIMARY KEY,
  user_id     text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id   text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  revoked_at  timestamptz
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx   ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_tenant_id_idx ON sessions(tenant_id);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_tenant_isolation" ON sessions
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- ---------------------------------------------------------------------------
-- User–Organization memberships
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_organization_memberships (
  user_id         text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role            text NOT NULL
                       CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, organization_id)
);

CREATE INDEX IF NOT EXISTS memberships_user_id_idx ON user_organization_memberships(user_id);
CREATE INDEX IF NOT EXISTS memberships_org_id_idx  ON user_organization_memberships(organization_id);

ALTER TABLE user_organization_memberships ENABLE ROW LEVEL SECURITY;

-- Scoped through organizations → tenant_id
CREATE POLICY "memberships_tenant_isolation" ON user_organization_memberships
  FOR ALL
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE tenant_id = current_tenant_id()
    )
  );

-- ---------------------------------------------------------------------------
-- API keys — stored by hash, never by plaintext value
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS api_keys (
  id              text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  prefix          text NOT NULL,
  key_hash        text NOT NULL UNIQUE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz,
  revoked_at      timestamptz
);

CREATE INDEX IF NOT EXISTS api_keys_org_id_idx  ON api_keys(organization_id);
CREATE INDEX IF NOT EXISTS api_keys_hash_idx    ON api_keys(key_hash);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_keys_tenant_isolation" ON api_keys
  FOR ALL
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE tenant_id = current_tenant_id()
    )
  );
