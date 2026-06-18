-- =============================================================================
-- Migration 003: Business Brain Domain
--
-- The permanent, cumulative organizational memory.
--
-- One BusinessBrain per Organization (enforced by UNIQUE constraint on
-- organization_id). BusinessMemory records are the individual knowledge units.
--
-- content and relevance_scope are stored as jsonb and text[] respectively
-- to support flexible schemas as Business Memory types evolve.
--
-- tenant_id is denormalized into both tables for efficient RLS without joins.
--
-- See FOUNDATION_001_ARCHITECTURE.md §2.3, §2.4 — Business Brain & Memory.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Business Brains
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS business_brains (
  id              text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tenant_id       text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id)
);

CREATE INDEX IF NOT EXISTS business_brains_org_id_idx    ON business_brains(organization_id);
CREATE INDEX IF NOT EXISTS business_brains_tenant_id_idx ON business_brains(tenant_id);

ALTER TABLE business_brains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_brains_tenant_isolation" ON business_brains
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- ---------------------------------------------------------------------------
-- Business Memories
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS business_memories (
  id                text PRIMARY KEY,
  business_brain_id text NOT NULL REFERENCES business_brains(id) ON DELETE CASCADE,
  organization_id   text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tenant_id         text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type              text NOT NULL
                         CHECK (type IN (
                           'company_identity', 'brand', 'product', 'service',
                           'pricing', 'policy', 'sop', 'customer', 'asset',
                           'knowledge', 'preference', 'decision'
                         )),
  content           jsonb NOT NULL DEFAULT '{}',
  source            text NOT NULL,
  relevance_scope   text[] NOT NULL DEFAULT '{}',
  version           integer NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS business_memories_brain_id_idx  ON business_memories(business_brain_id);
CREATE INDEX IF NOT EXISTS business_memories_org_id_idx    ON business_memories(organization_id);
CREATE INDEX IF NOT EXISTS business_memories_tenant_id_idx ON business_memories(tenant_id);
CREATE INDEX IF NOT EXISTS business_memories_type_idx      ON business_memories(type);

ALTER TABLE business_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_memories_tenant_isolation" ON business_memories
  FOR ALL
  USING (tenant_id = current_tenant_id());
