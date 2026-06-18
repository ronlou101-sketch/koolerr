-- =============================================================================
-- Migration 006: Billing Domain
--
-- Subscriptions, usage events, and entitlements.
--
-- Entitlements use (organization_id, feature) as a composite primary key.
-- limit_amount is nullable — NULL means unlimited, which the service maps
-- to/from Infinity in TypeScript.
--
-- Usage events are append-only: the table has no update path. The billing
-- service increments the entitlement.used counter as a separate operation.
--
-- See FOUNDATION_001_ARCHITECTURE.md §2.14 — Billing.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Subscriptions — one per Tenant
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS subscriptions (
  id                    text PRIMARY KEY,
  tenant_id             text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  organization_id       text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id               text NOT NULL,
  status                text NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active', 'trialing', 'past_due', 'canceled')),
  current_period_start  timestamptz NOT NULL,
  current_period_end    timestamptz NOT NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id)
);

CREATE INDEX IF NOT EXISTS subscriptions_tenant_id_idx ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS subscriptions_org_id_idx    ON subscriptions(organization_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_tenant_isolation" ON subscriptions
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- ---------------------------------------------------------------------------
-- Usage events — append-only; emitted by the Model Gateway via billing sink
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS usage_events (
  id              text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type            text NOT NULL
                       CHECK (type IN (
                         'engagement_run', 'deliverable', 'model_invocation', 'storage'
                       )),
  quantity        bigint NOT NULL DEFAULT 1 CHECK (quantity > 0),
  metadata        jsonb NOT NULL DEFAULT '{}',
  occurred_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS usage_events_org_id_idx   ON usage_events(organization_id);
CREATE INDEX IF NOT EXISTS usage_events_type_idx     ON usage_events(type);
CREATE INDEX IF NOT EXISTS usage_events_occurred_idx ON usage_events(occurred_at);

ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usage_events_tenant_isolation" ON usage_events
  FOR ALL
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE tenant_id = current_tenant_id()
    )
  );

-- ---------------------------------------------------------------------------
-- Entitlements — (organization_id, feature) composite key
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS entitlements (
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  feature         text NOT NULL,
  -- NULL = unlimited (maps to Infinity in TypeScript)
  limit_amount    bigint CHECK (limit_amount IS NULL OR limit_amount >= 0),
  used            bigint NOT NULL DEFAULT 0 CHECK (used >= 0),
  reset_at        timestamptz,
  PRIMARY KEY (organization_id, feature)
);

CREATE INDEX IF NOT EXISTS entitlements_org_id_idx ON entitlements(organization_id);

ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "entitlements_tenant_isolation" ON entitlements
  FOR ALL
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE tenant_id = current_tenant_id()
    )
  );
