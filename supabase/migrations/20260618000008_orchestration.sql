-- =============================================================================
-- Migration 008: Orchestration Engine Persistence
--
-- Two tables that back the Orchestration Engine's write-through persistence:
--
-- workflows: One row per Engagement Run workflow. Carries the workflow status
-- and references the engagement_run that triggered it.
--
-- workflow_steps: One row per step within a workflow. Steps are always
-- queried as a group (by workflow_id), so the composite PK (workflow_id,
-- step_id) is both the uniqueness constraint and the join key.
--
-- Design decisions:
-- - Steps store their input/output as jsonb. Content volumes are modest and
--   this avoids a separate content table.
-- - The depends_on column is text[] (step IDs) rather than a FK join table.
--   The dependency graph is small (typically 2-4 steps) and is only ever
--   read as a whole, so the array representation is simpler and faster.
-- - RLS on workflow_steps joins back to workflows via a subquery to inherit
--   tenant isolation from the parent workflow row.
--
-- See FOUNDATION_001_ARCHITECTURE.md §2.13 — Orchestration Engine.
-- See docs/adr/ADR-011-orchestration-persistence.md.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Workflows
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS workflows (
  id                text PRIMARY KEY,
  tenant_id         text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  organization_id   text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  engagement_run_id text NOT NULL,
  status            text NOT NULL
                         CHECK (status IN ('pending','running','completed','failed','cancelled')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  completed_at      timestamptz
);

CREATE INDEX IF NOT EXISTS workflows_tenant_id_idx       ON workflows(tenant_id);
CREATE INDEX IF NOT EXISTS workflows_org_id_idx          ON workflows(organization_id);
CREATE INDEX IF NOT EXISTS workflows_engagement_run_idx  ON workflows(engagement_run_id);
CREATE INDEX IF NOT EXISTS workflows_status_idx          ON workflows(status);

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workflows_tenant_isolation" ON workflows
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- ---------------------------------------------------------------------------
-- Workflow steps
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS workflow_steps (
  step_id             text        NOT NULL,
  workflow_id         text        NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  name                text        NOT NULL,
  digital_employee_id text        NOT NULL,
  action              text        NOT NULL,
  depends_on          text[]      NOT NULL DEFAULT '{}',
  input               jsonb       NOT NULL DEFAULT '{}',
  status              text        NOT NULL
                                       CHECK (status IN (
                                         'pending','running','completed','failed','skipped'
                                       )),
  output              jsonb,
  error               text,
  started_at          timestamptz,
  completed_at        timestamptz,
  PRIMARY KEY (workflow_id, step_id)
);

CREATE INDEX IF NOT EXISTS workflow_steps_workflow_id_idx ON workflow_steps(workflow_id);

ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;

-- Inherit tenant isolation from the parent workflow row.
CREATE POLICY "workflow_steps_tenant_isolation" ON workflow_steps
  FOR ALL
  USING (
    workflow_id IN (
      SELECT id FROM workflows WHERE tenant_id = current_tenant_id()
    )
  );
