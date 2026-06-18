-- =============================================================================
-- Migration 005: Deliverables Domain
--
-- Deliverables and their append-only decision/revision history.
--
-- The deliverables table is the primary record. approval_decisions and
-- revision_requests are event tables — rows are only ever inserted, never
-- updated or deleted. This preserves the additive history invariant from
-- FOUNDATION_001.
--
-- organization_id is included in the child tables (even though it's
-- derivable via deliverable_id) for efficient RLS enforcement without
-- a multi-level join.
--
-- See FOUNDATION_001_ARCHITECTURE.md §2.9 — Deliverables.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Deliverables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS deliverables (
  id               text PRIMARY KEY,
  organization_id  text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  engagement_run_id text NOT NULL REFERENCES engagement_runs(id) ON DELETE CASCADE,
  tenant_id        text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type             text NOT NULL
                        CHECK (type IN (
                          'blog_post', 'advertisement', 'email', 'proposal',
                          'report', 'strategy', 'image', 'video',
                          'hiring_packet', 'customer_response'
                        )),
  title            text NOT NULL,
  content          jsonb NOT NULL DEFAULT '{}',
  status           text NOT NULL DEFAULT 'draft'
                        CHECK (status IN (
                          'draft', 'pending_review', 'approved', 'rejected', 'published'
                        )),
  version          integer NOT NULL DEFAULT 1 CHECK (version >= 1),
  attributed_to    text[] NOT NULL DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deliverables_org_id_idx    ON deliverables(organization_id);
CREATE INDEX IF NOT EXISTS deliverables_run_id_idx    ON deliverables(engagement_run_id);
CREATE INDEX IF NOT EXISTS deliverables_tenant_id_idx ON deliverables(tenant_id);
CREATE INDEX IF NOT EXISTS deliverables_status_idx    ON deliverables(status);

ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deliverables_tenant_isolation" ON deliverables
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- ---------------------------------------------------------------------------
-- Deliverable approval decisions — append-only event log
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS deliverable_approval_decisions (
  id               text PRIMARY KEY,
  deliverable_id   text NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  organization_id  text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reviewed_by      text NOT NULL,
  decision         text NOT NULL CHECK (decision IN ('approved', 'rejected')),
  feedback         text,
  decided_at       timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS approval_decisions_deliverable_idx ON deliverable_approval_decisions(deliverable_id);
CREATE INDEX IF NOT EXISTS approval_decisions_org_id_idx      ON deliverable_approval_decisions(organization_id);

ALTER TABLE deliverable_approval_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "approval_decisions_tenant_isolation" ON deliverable_approval_decisions
  FOR ALL
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE tenant_id = current_tenant_id()
    )
  );

-- ---------------------------------------------------------------------------
-- Deliverable revision requests — append-only event log
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS deliverable_revision_requests (
  id               text PRIMARY KEY,
  deliverable_id   text NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  organization_id  text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  requested_by     text NOT NULL,
  instructions     text NOT NULL,
  requested_at     timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS revision_requests_deliverable_idx ON deliverable_revision_requests(deliverable_id);
CREATE INDEX IF NOT EXISTS revision_requests_org_id_idx      ON deliverable_revision_requests(organization_id);

ALTER TABLE deliverable_revision_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "revision_requests_tenant_isolation" ON deliverable_revision_requests
  FOR ALL
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE tenant_id = current_tenant_id()
    )
  );
