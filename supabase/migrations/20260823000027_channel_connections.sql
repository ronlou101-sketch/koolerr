-- =============================================================================
-- Migration 027: Channel Connections (Publishing V1 — Step 3D-1a)
--
-- Per-organization connection to an external publishing channel (YouTube first).
-- Stores OAuth token material as OPAQUE application-encrypted strings
-- (AES-256-GCM, encrypted in the app via CHANNEL_TOKEN_ENC_KEY) — the database
-- never holds plaintext tokens and never performs the encryption. Adopts the
-- existing tenant-isolation RLS pattern; server code additionally scopes every
-- read/write by organization_id (service role bypasses RLS).
--
-- Additive only. Does NOT touch: entitlements, usage_events, render_jobs,
-- subscriptions, auth/JWT, or any dogfooding/campaign table. No publishing logic
-- is created here (that is Step 3D-2).
-- =============================================================================

CREATE TABLE IF NOT EXISTS channel_connections (
  id                     text PRIMARY KEY,
  organization_id        text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tenant_id              text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  channel                text NOT NULL CHECK (channel IN ('youtube')),
  -- External channel identity (safe to display): YouTube channel id + name.
  external_account_id    text,
  external_account_name  text,
  -- OAuth tokens: opaque AES-256-GCM ciphertext strings (never plaintext).
  encrypted_access_token  text,
  encrypted_refresh_token text,
  token_expires_at       timestamptz,
  scopes                 text[] NOT NULL DEFAULT '{}',
  status                 text NOT NULL DEFAULT 'connected'
                              CHECK (status IN ('connected', 'expired', 'revoked', 'disconnected')),
  connected_by           text REFERENCES users(id) ON DELETE SET NULL,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  -- One connection per (organization, channel) — reconnect updates in place.
  UNIQUE (organization_id, channel)
);

CREATE INDEX IF NOT EXISTS channel_connections_org_id_idx    ON channel_connections(organization_id);
CREATE INDEX IF NOT EXISTS channel_connections_tenant_id_idx ON channel_connections(tenant_id);

ALTER TABLE channel_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "channel_connections_tenant_isolation" ON channel_connections
  FOR ALL
  USING (tenant_id = current_tenant_id());
