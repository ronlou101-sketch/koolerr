-- =============================================================================
-- Migration 011: Approval Requests
--
-- Stores the formal record of every Digital Employee action that requires
-- customer approval before execution. Created when the Trust Engine returns
-- 'requires_approval'. Resolved (approved/rejected) or cancelled before the
-- action executes.
--
-- Every resolved approval also triggers a Trust Evaluation (table in migration
-- 010) via TrustEngine.recordEvaluation() in the application layer.
--
-- See FOUNDATION_003 §Phase 2 — Approval Workflows.
-- See docs/adr/ADR-014-approval-workflows.md.
-- =============================================================================

CREATE TABLE IF NOT EXISTS approval_requests (
  id                  text PRIMARY KEY,
  tenant_id           text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  organization_id     text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workforce_id        text NOT NULL REFERENCES workforces(id) ON DELETE CASCADE,
  digital_employee_id text NOT NULL REFERENCES digital_employees(id) ON DELETE CASCADE,
  engagement_run_id   text NOT NULL REFERENCES engagement_runs(id) ON DELETE CASCADE,
  action              text NOT NULL,
  description         text NOT NULL,
  context             jsonb NOT NULL DEFAULT '{}',
  status              text NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'cancelled')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  expires_at          timestamptz,
  resolved_at         timestamptz,
  resolved_by         text,
  resolution_note     text
);

CREATE INDEX IF NOT EXISTS approval_requests_tenant_idx    ON approval_requests(tenant_id);
CREATE INDEX IF NOT EXISTS approval_requests_org_idx       ON approval_requests(organization_id);
CREATE INDEX IF NOT EXISTS approval_requests_run_idx       ON approval_requests(engagement_run_id);
CREATE INDEX IF NOT EXISTS approval_requests_employee_idx  ON approval_requests(digital_employee_id);
CREATE INDEX IF NOT EXISTS approval_requests_status_idx    ON approval_requests(status)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS approval_requests_created_idx   ON approval_requests(created_at);

ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "approval_requests_tenant_isolation" ON approval_requests
  FOR ALL
  USING (tenant_id = current_tenant_id());
