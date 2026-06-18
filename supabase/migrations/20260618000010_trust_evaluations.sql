-- =============================================================================
-- Migration 010: Trust Evaluations and Earned Autonomy
--
-- Two tables that power the earned-autonomy mechanism introduced in Phase 2.
--
-- trust_evaluations: Append-only record of every customer approval or rejection
-- of a Digital Employee action. Forms the immutable performance history that the
-- Trust Engine uses to determine whether earned autonomy is warranted.
-- Never updated or deleted — every evaluation is a permanent fact.
--
-- earned_autonomy: One row per (organization, digital_employee, action) tuple.
-- Tracks the running count of consecutive approvals and the is_earned flag.
-- Upserted on every evaluation — a rejection resets consecutive_approvals to 0.
-- When is_earned=true the Trust Engine permits the action without requiring a
-- fresh per-action customer approval (see ADR-013).
--
-- See FOUNDATION_001_ARCHITECTURE.md §2.10 — Trust Engine.
-- See docs/adr/ADR-013-trust-engine-earned-autonomy.md.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Trust evaluations — append-only performance history
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS trust_evaluations (
  id                  text PRIMARY KEY,
  tenant_id           text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  organization_id     text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  digital_employee_id text NOT NULL REFERENCES digital_employees(id) ON DELETE CASCADE,
  action              text NOT NULL,
  engagement_run_id   text NOT NULL,
  decision            text NOT NULL CHECK (decision IN ('approved', 'rejected')),
  decided_by          text NOT NULL,
  decided_at          timestamptz NOT NULL,
  reason              text
);

CREATE INDEX IF NOT EXISTS trust_evaluations_tenant_idx    ON trust_evaluations(tenant_id);
CREATE INDEX IF NOT EXISTS trust_evaluations_org_idx       ON trust_evaluations(organization_id);
CREATE INDEX IF NOT EXISTS trust_evaluations_employee_idx  ON trust_evaluations(digital_employee_id);
CREATE INDEX IF NOT EXISTS trust_evaluations_action_idx    ON trust_evaluations(action);
CREATE INDEX IF NOT EXISTS trust_evaluations_decided_idx   ON trust_evaluations(decided_at);

ALTER TABLE trust_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trust_evaluations_tenant_isolation" ON trust_evaluations
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- ---------------------------------------------------------------------------
-- Earned autonomy — one record per (organization, digital_employee, action)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS earned_autonomy (
  id                    text PRIMARY KEY,
  tenant_id             text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  organization_id       text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  digital_employee_id   text NOT NULL REFERENCES digital_employees(id) ON DELETE CASCADE,
  action                text NOT NULL,
  consecutive_approvals integer NOT NULL DEFAULT 0
                            CHECK (consecutive_approvals >= 0),
  is_earned             boolean NOT NULL DEFAULT false,
  earned_at             timestamptz,
  last_evaluated_at     timestamptz NOT NULL,
  UNIQUE (organization_id, digital_employee_id, action)
);

CREATE INDEX IF NOT EXISTS earned_autonomy_tenant_idx    ON earned_autonomy(tenant_id);
CREATE INDEX IF NOT EXISTS earned_autonomy_org_idx       ON earned_autonomy(organization_id);
CREATE INDEX IF NOT EXISTS earned_autonomy_employee_idx  ON earned_autonomy(digital_employee_id);
CREATE INDEX IF NOT EXISTS earned_autonomy_earned_idx    ON earned_autonomy(is_earned)
  WHERE is_earned = true;

ALTER TABLE earned_autonomy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "earned_autonomy_tenant_isolation" ON earned_autonomy
  FOR ALL
  USING (tenant_id = current_tenant_id());
