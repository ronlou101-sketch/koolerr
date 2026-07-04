-- =============================================================================
-- Migration 017: Dogfooding — Autonomous Internal Marketing Department
--
-- Creates the 11-table schema for Tower Control's dogfooding system.
-- These tables back the founder-only autonomous marketing department that
-- uses Koolerr's own platform to grow Koolerr.
--
-- Phase 1: Objectives, Marketing Plans, Campaigns, Ad Copy, Creatives, Learnings.
-- Phase 2 (Meta): Ad Sets, Ads, Performance Snapshots, Meta Connections, Budget Ledger
--                 are created here as stubs and will be populated once Meta API connects.
-- =============================================================================

-- ── Objectives ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dogfooding_objectives (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        NOT NULL REFERENCES organizations(id),
  title           text        NOT NULL,
  description     text        NOT NULL,
  goal_type       text        NOT NULL CHECK (goal_type IN (
    'brand_awareness','lead_generation','user_acquisition','retention','revenue'
  )),
  target_audience text,
  success_metrics jsonb       NOT NULL DEFAULT '[]',
  budget_cents    bigint      NOT NULL DEFAULT 0,
  status          text        NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft','active','paused','completed','archived'
  )),
  engagement_run_id text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ── Marketing Plans ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dogfooding_marketing_plans (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid        NOT NULL REFERENCES organizations(id),
  objective_id      uuid        NOT NULL REFERENCES dogfooding_objectives(id),
  title             text        NOT NULL,
  executive_summary text        NOT NULL,
  target_audience   jsonb       NOT NULL DEFAULT '{}',
  messaging_pillars jsonb       NOT NULL DEFAULT '[]',
  channel_mix       jsonb       NOT NULL DEFAULT '[]',
  campaign_phases   jsonb       NOT NULL DEFAULT '[]',
  kpis              jsonb       NOT NULL DEFAULT '[]',
  raw_content       text,
  status            text        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','archived')),
  engagement_run_id text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ── Campaigns ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dogfooding_campaigns (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid        NOT NULL REFERENCES organizations(id),
  objective_id      uuid        NOT NULL REFERENCES dogfooding_objectives(id),
  plan_id           uuid        REFERENCES dogfooding_marketing_plans(id),
  name              text        NOT NULL,
  objective_summary text        NOT NULL,
  target_audience   jsonb       NOT NULL DEFAULT '{}',
  budget_cents      bigint      NOT NULL DEFAULT 0,
  start_date        date,
  end_date          date,
  channels          text[]      NOT NULL DEFAULT '{}',
  status            text        NOT NULL DEFAULT 'planning' CHECK (status IN (
    'planning','ready','active','paused','completed','archived'
  )),
  meta_campaign_id  text,
  engagement_run_id text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ── Ad Sets (Phase 2 Meta stub) ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dogfooding_ad_sets (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        NOT NULL REFERENCES organizations(id),
  campaign_id     uuid        NOT NULL REFERENCES dogfooding_campaigns(id),
  name            text        NOT NULL,
  targeting       jsonb       NOT NULL DEFAULT '{}',
  placement       text[]      NOT NULL DEFAULT '{}',
  budget_cents    bigint      NOT NULL DEFAULT 0,
  bid_strategy    text        NOT NULL DEFAULT 'lowest_cost',
  status          text        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','archived')),
  meta_ad_set_id  text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ── Creatives ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dogfooding_creatives (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        NOT NULL REFERENCES organizations(id),
  campaign_id     uuid        REFERENCES dogfooding_campaigns(id),
  type            text        NOT NULL CHECK (type IN ('image','video','carousel','story')),
  prompt          text        NOT NULL,
  asset_url       text,
  thumbnail_url   text,
  metadata        jsonb       NOT NULL DEFAULT '{}',
  status          text        NOT NULL DEFAULT 'planned' CHECK (status IN (
    'planned','generating','ready','rejected','archived'
  )),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ── Ad Copy Variants ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dogfooding_ad_copy_variants (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid        NOT NULL REFERENCES organizations(id),
  campaign_id       uuid        NOT NULL REFERENCES dogfooding_campaigns(id),
  variant_name      text        NOT NULL,
  headline          text        NOT NULL,
  primary_text      text        NOT NULL,
  call_to_action    text        NOT NULL,
  description       text,
  url_parameters    jsonb       NOT NULL DEFAULT '{}',
  status            text        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','rejected','archived')),
  performance_score numeric,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ── Ads (Phase 2 Meta stub) ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dogfooding_ads (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        NOT NULL REFERENCES organizations(id),
  ad_set_id       uuid        REFERENCES dogfooding_ad_sets(id),
  campaign_id     uuid        REFERENCES dogfooding_campaigns(id),
  creative_id     uuid        REFERENCES dogfooding_creatives(id),
  copy_variant_id uuid        REFERENCES dogfooding_ad_copy_variants(id),
  name            text        NOT NULL,
  status          text        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','archived')),
  meta_ad_id      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ── Performance Snapshots (Phase 2 Meta polling) ──────────────────────────────

CREATE TABLE IF NOT EXISTS dogfooding_performance_snapshots (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        NOT NULL REFERENCES organizations(id),
  campaign_id     uuid        REFERENCES dogfooding_campaigns(id),
  ad_id           uuid        REFERENCES dogfooding_ads(id),
  snapshot_date   date        NOT NULL,
  impressions     bigint      NOT NULL DEFAULT 0,
  clicks          bigint      NOT NULL DEFAULT 0,
  spend_cents     bigint      NOT NULL DEFAULT 0,
  conversions     bigint      NOT NULL DEFAULT 0,
  cpm_cents       bigint      NOT NULL DEFAULT 0,
  cpc_cents       bigint      NOT NULL DEFAULT 0,
  ctr             numeric,
  roas            numeric,
  raw_metrics     jsonb       NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ── Meta Connections (Phase 2 OAuth) ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dogfooding_meta_connections (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid        NOT NULL REFERENCES organizations(id) UNIQUE,
  ad_account_id    text,
  page_id          text,
  pixel_id         text,
  token_expires_at timestamptz,
  status           text        NOT NULL DEFAULT 'disconnected' CHECK (status IN (
    'connected','disconnected','expired','revoked'
  )),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ── Learnings ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dogfooding_learnings (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        NOT NULL REFERENCES organizations(id),
  campaign_id     uuid        REFERENCES dogfooding_campaigns(id),
  objective_id    uuid        REFERENCES dogfooding_objectives(id),
  learning_type   text        NOT NULL CHECK (learning_type IN (
    'audience','creative','copy','channel','timing','budget','general'
  )),
  insight         text        NOT NULL,
  confidence      text        NOT NULL DEFAULT 'medium' CHECK (confidence IN ('low','medium','high')),
  actionable      boolean     NOT NULL DEFAULT true,
  applied         boolean     NOT NULL DEFAULT false,
  extracted_by    text        NOT NULL DEFAULT 'marketing-analyst',
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ── Budget Ledger (Phase 2) ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dogfooding_budget_ledger (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        NOT NULL REFERENCES organizations(id),
  objective_id    uuid        REFERENCES dogfooding_objectives(id),
  campaign_id     uuid        REFERENCES dogfooding_campaigns(id),
  entry_type      text        NOT NULL CHECK (entry_type IN ('allocation','spend','refund','adjustment')),
  amount_cents    bigint      NOT NULL,
  description     text        NOT NULL,
  recorded_at     timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_dogfooding_objectives_org
  ON dogfooding_objectives(organization_id);

CREATE INDEX IF NOT EXISTS idx_dogfooding_marketing_plans_objective
  ON dogfooding_marketing_plans(objective_id);

CREATE INDEX IF NOT EXISTS idx_dogfooding_campaigns_objective
  ON dogfooding_campaigns(objective_id);

CREATE INDEX IF NOT EXISTS idx_dogfooding_campaigns_org
  ON dogfooding_campaigns(organization_id);

CREATE INDEX IF NOT EXISTS idx_dogfooding_ad_copy_variants_campaign
  ON dogfooding_ad_copy_variants(campaign_id);

CREATE INDEX IF NOT EXISTS idx_dogfooding_creatives_campaign
  ON dogfooding_creatives(campaign_id);

CREATE INDEX IF NOT EXISTS idx_dogfooding_learnings_org
  ON dogfooding_learnings(organization_id);

CREATE INDEX IF NOT EXISTS idx_dogfooding_performance_snapshots_campaign
  ON dogfooding_performance_snapshots(campaign_id, snapshot_date);

-- ── Updated-at triggers ───────────────────────────────────────────────────────
-- update_updated_at_column() was created in migration 006 (billing).
-- We reference it here; no need to recreate.

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'dogfooding_objectives',
    'dogfooding_marketing_plans',
    'dogfooding_campaigns',
    'dogfooding_ad_sets',
    'dogfooding_creatives',
    'dogfooding_ad_copy_variants',
    'dogfooding_ads',
    'dogfooding_meta_connections'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'trg_' || t || '_updated_at'
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER trg_%1$s_updated_at
           BEFORE UPDATE ON %1$s
           FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
        t
      );
    END IF;
  END LOOP;
END $$;
