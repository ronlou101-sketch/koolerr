-- =============================================================================
-- Migration 007: Consent, Audit, and Trust Rules
--
-- Three shared platform tables:
--
-- consent_records: The Consent & Rights Ledger. Append-only — rows are never
-- deleted. Revocation updates the status field only.
--
-- audit_events: The permanent, immutable audit trail. No update or delete
-- policy is defined — the RLS policy only allows SELECT and INSERT.
-- All platform actions that reach the audit logger write here in production.
--
-- trust_rules: Registered rules evaluated by the Trust Engine. In Phase 1
-- these are loaded at startup and stored in memory; this table provides the
-- durable backing store for production and supports runtime rule updates.
--
-- See FOUNDATION_001_ARCHITECTURE.md §2.10, §2.11, §8.5.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Consent records — append-only ledger
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS consent_records (
  id              text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tenant_id       text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  granted_by      text NOT NULL,
  scope           text NOT NULL,
  action          text NOT NULL,
  status          text NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active', 'revoked')),
  granted_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz,
  revoked_at      timestamptz
);

CREATE INDEX IF NOT EXISTS consent_records_org_id_idx     ON consent_records(organization_id);
CREATE INDEX IF NOT EXISTS consent_records_tenant_id_idx  ON consent_records(tenant_id);
CREATE INDEX IF NOT EXISTS consent_records_action_idx     ON consent_records(action);
CREATE INDEX IF NOT EXISTS consent_records_status_idx     ON consent_records(status);

ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consent_records_tenant_isolation" ON consent_records
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- ---------------------------------------------------------------------------
-- Audit events — immutable; SELECT and INSERT only
-- No UPDATE or DELETE policy is intentionally defined.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS audit_events (
  id              text PRIMARY KEY,
  tenant_id       text NOT NULL,
  organization_id text,
  actor_type      text NOT NULL
                       CHECK (actor_type IN ('user', 'digital_employee', 'system')),
  actor_id        text NOT NULL,
  action          text NOT NULL,
  resource_type   text NOT NULL,
  resource_id     text NOT NULL,
  outcome         text NOT NULL
                       CHECK (outcome IN ('success', 'denied', 'error')),
  metadata        jsonb NOT NULL DEFAULT '{}',
  occurred_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_events_tenant_id_idx  ON audit_events(tenant_id);
CREATE INDEX IF NOT EXISTS audit_events_org_id_idx     ON audit_events(organization_id);
CREATE INDEX IF NOT EXISTS audit_events_actor_idx      ON audit_events(actor_type, actor_id);
CREATE INDEX IF NOT EXISTS audit_events_action_idx     ON audit_events(action);
CREATE INDEX IF NOT EXISTS audit_events_occurred_idx   ON audit_events(occurred_at);

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Tenants may read their own audit history; writes come from server-side only.
CREATE POLICY "audit_events_select" ON audit_events
  FOR SELECT
  USING (tenant_id = current_tenant_id());

-- INSERT is not granted through user JWTs — the service role key handles writes.

-- ---------------------------------------------------------------------------
-- Trust rules
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS trust_rules (
  id                      text PRIMARY KEY,
  organization_id         text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  digital_employee_id     text NOT NULL REFERENCES digital_employees(id) ON DELETE CASCADE,
  action                  text NOT NULL,
  requires_approval       boolean NOT NULL DEFAULT true,
  autonomy_level          text NOT NULL DEFAULT 'supervised'
                               CHECK (autonomy_level IN (
                                 'supervised', 'semi_autonomous', 'autonomous'
                               )),
  required_consent_scope  text,
  UNIQUE (digital_employee_id, action)
);

CREATE INDEX IF NOT EXISTS trust_rules_org_id_idx    ON trust_rules(organization_id);
CREATE INDEX IF NOT EXISTS trust_rules_employee_idx  ON trust_rules(digital_employee_id);

ALTER TABLE trust_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trust_rules_tenant_isolation" ON trust_rules
  FOR ALL
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE tenant_id = current_tenant_id()
    )
  );
