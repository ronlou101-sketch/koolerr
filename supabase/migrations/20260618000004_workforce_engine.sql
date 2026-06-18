-- =============================================================================
-- Migration 004: Workforce Engine Domain
--
-- Workforces, Digital Employees, and Engagement Runs.
--
-- participant_ids and deliverable_ids on engagement_runs are stored as text[]
-- because they are ordered lists of platform IDs (not foreign keys that need
-- referential integrity — the workforce-engine and deliverables domains own
-- those objects separately).
--
-- responsibilities and permitted_tools on digital_employees are similarly
-- stored as text[] — they are lists of strings, not relational references.
--
-- See FOUNDATION_001_ARCHITECTURE.md §2.6, §2.7, §2.8 — Workforce Engine.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Workforces
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS workforces (
  id               text PRIMARY KEY,
  organization_id  text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tenant_id        text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name             text NOT NULL,
  business_function text NOT NULL,
  status           text NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'inactive')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workforces_org_id_idx    ON workforces(organization_id);
CREATE INDEX IF NOT EXISTS workforces_tenant_id_idx ON workforces(tenant_id);

ALTER TABLE workforces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workforces_tenant_isolation" ON workforces
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- ---------------------------------------------------------------------------
-- Digital Employees
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS digital_employees (
  id               text PRIMARY KEY,
  workforce_id     text NOT NULL REFERENCES workforces(id) ON DELETE CASCADE,
  organization_id  text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tenant_id        text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name             text NOT NULL,
  role             text NOT NULL,
  responsibilities text[] NOT NULL DEFAULT '{}',
  permitted_tools  text[] NOT NULL DEFAULT '{}',
  status           text NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'inactive')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS digital_employees_workforce_id_idx ON digital_employees(workforce_id);
CREATE INDEX IF NOT EXISTS digital_employees_org_id_idx       ON digital_employees(organization_id);
CREATE INDEX IF NOT EXISTS digital_employees_tenant_id_idx    ON digital_employees(tenant_id);

ALTER TABLE digital_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "digital_employees_tenant_isolation" ON digital_employees
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- ---------------------------------------------------------------------------
-- Engagement Runs
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS engagement_runs (
  id               text PRIMARY KEY,
  organization_id  text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workforce_id     text NOT NULL REFERENCES workforces(id) ON DELETE CASCADE,
  tenant_id        text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  objective        text NOT NULL,
  status           text NOT NULL DEFAULT 'pending'
                        CHECK (status IN (
                          'pending', 'running', 'awaiting_approval',
                          'approved', 'rejected', 'completed', 'failed'
                        )),
  participant_ids  text[] NOT NULL DEFAULT '{}',
  deliverable_ids  text[] NOT NULL DEFAULT '{}',
  started_at       timestamptz,
  completed_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS engagement_runs_org_id_idx    ON engagement_runs(organization_id);
CREATE INDEX IF NOT EXISTS engagement_runs_workforce_idx ON engagement_runs(workforce_id);
CREATE INDEX IF NOT EXISTS engagement_runs_tenant_id_idx ON engagement_runs(tenant_id);
CREATE INDEX IF NOT EXISTS engagement_runs_status_idx    ON engagement_runs(status);

ALTER TABLE engagement_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "engagement_runs_tenant_isolation" ON engagement_runs
  FOR ALL
  USING (tenant_id = current_tenant_id());
