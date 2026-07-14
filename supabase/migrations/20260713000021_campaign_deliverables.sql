-- =============================================================================
-- Migration 021: Campaign Deliverables
--
-- Adds the full asset-management schema that backs the Campaign Deliverables
-- page — the permanent home for every finished asset produced by the
-- Autonomous Marketing Department.
--
-- Scope
-- -----
-- 1. Amend existing tables (backward-compatible — all new columns nullable or
--    with safe defaults; existing rows and queries are unaffected):
--
--    dogfooding_creatives
--      · Expand the status check constraint to include 'approved'.
--      · Add approval_note, approved_at, publish_status.
--
--    dogfooding_ad_copy_variants
--      · Add approval_note, approved_at, publish_status.
--      (status already includes 'approved' and 'rejected' from migration 017.)
--
-- 2. Create seven new tables:
--
--    campaign_assets          — provider-agnostic store for generated images
--                               and videos (HeyGen, Higgsfield, DALL-E, etc.)
--    campaign_scripts         — written video scripts
--    campaign_captions        — per-platform social media captions
--    campaign_hashtag_sets    — curated hashtag collections
--    campaign_calendar_slots  — scheduling layer mapping assets to date/platform
--    campaign_approval_events — append-only audit log of every approval/rejection
--    campaign_publish_events  — append-only record of every publish/unpublish
--
-- Conventions
-- -----------
-- · No RLS — all dogfooding tables use the service-role client; tenant
--   isolation is enforced at the application layer via organization_id scoping
--   in every WHERE clause. This matches the pattern established in migration 017.
-- · IDs are text PRIMARY KEY DEFAULT gen_random_uuid()::text.
-- · All FKs reference by text ID (consistent with the rest of the schema).
-- · Append-only tables (approval/publish events) have no updated_at column
--   and no UPDATE trigger — they are never modified after insertion.
-- · The update_updated_at_column() trigger function was created in migration 017
--   and is reused here without redefinition.
-- =============================================================================

-- =============================================================================
-- PART 1 — Amend existing tables
-- =============================================================================

-- -----------------------------------------------------------------------------
-- dogfooding_creatives: expand status to include 'approved'
--
-- The existing check constraint only allows 'planned','generating','ready',
-- 'rejected','archived'. We need 'approved' for the approval workflow.
-- We introspect the catalog to find the actual constraint name (rather than
-- assuming an auto-generated name) so the drop is safe regardless of how
-- PostgreSQL named it at creation time.
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  v_constraint text;
BEGIN
  SELECT conname INTO v_constraint
  FROM   pg_constraint
  WHERE  conrelid = 'dogfooding_creatives'::regclass
    AND  contype  = 'c'
    AND  pg_get_constraintdef(oid) LIKE '%status%';

  IF v_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE dogfooding_creatives DROP CONSTRAINT %I', v_constraint);
  END IF;
END $$;

ALTER TABLE dogfooding_creatives
  ADD CONSTRAINT dogfooding_creatives_status_check
  CHECK (status IN ('planned', 'generating', 'ready', 'approved', 'rejected', 'archived'));

-- -----------------------------------------------------------------------------
-- dogfooding_ad_copy_variants: add approval metadata columns
-- -----------------------------------------------------------------------------

ALTER TABLE dogfooding_ad_copy_variants
  ADD COLUMN IF NOT EXISTS approval_note  text,
  ADD COLUMN IF NOT EXISTS approved_at   timestamptz,
  ADD COLUMN IF NOT EXISTS publish_status text NOT NULL DEFAULT 'unpublished'
    CHECK (publish_status IN ('unpublished', 'scheduled', 'published'));

-- -----------------------------------------------------------------------------
-- dogfooding_creatives: add approval metadata columns
-- -----------------------------------------------------------------------------

ALTER TABLE dogfooding_creatives
  ADD COLUMN IF NOT EXISTS approval_note  text,
  ADD COLUMN IF NOT EXISTS approved_at   timestamptz,
  ADD COLUMN IF NOT EXISTS publish_status text NOT NULL DEFAULT 'unpublished'
    CHECK (publish_status IN ('unpublished', 'scheduled', 'published'));

-- =============================================================================
-- PART 2 — New tables
-- =============================================================================

-- -----------------------------------------------------------------------------
-- campaign_assets
--
-- Provider-agnostic store for every generated still image and video.
-- A single row represents one file produced by one AI provider invocation.
-- The model_provider column is the discriminator (higgsfield, heygen, dalle, etc.).
-- Provider-specific metadata (dimensions, duration, render job ID, etc.) lives
-- in the metadata JSONB column.
--
-- parent_asset_id enables versioning: when an asset is regenerated the new row
-- points back to the row it supersedes. The application layer resolves the
-- version chain; the DB enforces only that the parent exists.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS campaign_assets (
  id                  text        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id     text        NOT NULL REFERENCES organizations(id),
  campaign_id         text        NOT NULL REFERENCES dogfooding_campaigns(id),
  engagement_run_id   text,
  digital_employee_id text,
  model_provider      text        NOT NULL,
  creative_id         text        REFERENCES dogfooding_creatives(id),
  type                text        NOT NULL
                                  CHECK (type IN ('image', 'video', 'audio')),
  subtype             text,
  asset_url           text,
  thumbnail_url       text,
  metadata            jsonb       NOT NULL DEFAULT '{}',
  status              text        NOT NULL DEFAULT 'generating'
                                  CHECK (status IN (
                                    'generating', 'ready', 'failed',
                                    'approved', 'rejected', 'published'
                                  )),
  approval_note       text,
  approved_at         timestamptz,
  publish_status      text        NOT NULL DEFAULT 'unpublished'
                                  CHECK (publish_status IN ('unpublished', 'scheduled', 'published')),
  version             integer     NOT NULL DEFAULT 1 CHECK (version >= 1),
  parent_asset_id     text        REFERENCES campaign_assets(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_assets_campaign
  ON campaign_assets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_assets_org
  ON campaign_assets(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaign_assets_creative
  ON campaign_assets(creative_id);
CREATE INDEX IF NOT EXISTS idx_campaign_assets_status
  ON campaign_assets(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_campaign_assets_type
  ON campaign_assets(campaign_id, type);

-- -----------------------------------------------------------------------------
-- campaign_scripts
--
-- Written video scripts produced by Digital Employees (typically the Copywriter).
-- Linked to the campaign that commissioned them. Scripts can be versioned:
-- parent_script_id points to the row a new version supersedes.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS campaign_scripts (
  id                    text        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id       text        NOT NULL REFERENCES organizations(id),
  campaign_id           text        NOT NULL REFERENCES dogfooding_campaigns(id),
  engagement_run_id     text,
  digital_employee_id   text,
  model_provider        text,
  title                 text        NOT NULL,
  body                  text        NOT NULL,
  platform              text,
  estimated_duration_sec integer,
  status                text        NOT NULL DEFAULT 'draft'
                                    CHECK (status IN ('draft', 'approved', 'rejected')),
  approval_note         text,
  approved_at           timestamptz,
  version               integer     NOT NULL DEFAULT 1 CHECK (version >= 1),
  parent_script_id      text        REFERENCES campaign_scripts(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_scripts_campaign
  ON campaign_scripts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_scripts_org
  ON campaign_scripts(organization_id);

-- -----------------------------------------------------------------------------
-- campaign_captions
--
-- Per-platform social media captions, one row per caption per platform.
-- character_count is stored denormalised for fast retrieval without a
-- length() call on large text columns. The application layer keeps it in sync.
-- paired_asset_id links a caption to the image or video it accompanies.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS campaign_captions (
  id                  text        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id     text        NOT NULL REFERENCES organizations(id),
  campaign_id         text        NOT NULL REFERENCES dogfooding_campaigns(id),
  engagement_run_id   text,
  digital_employee_id text,
  model_provider      text,
  platform            text        NOT NULL,
  body                text        NOT NULL,
  character_count     integer     NOT NULL DEFAULT 0,
  paired_asset_id     text        REFERENCES campaign_assets(id),
  status              text        NOT NULL DEFAULT 'draft'
                                  CHECK (status IN ('draft', 'approved', 'rejected')),
  approval_note       text,
  approved_at         timestamptz,
  version             integer     NOT NULL DEFAULT 1 CHECK (version >= 1),
  parent_caption_id   text        REFERENCES campaign_captions(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_captions_campaign
  ON campaign_captions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_captions_org
  ON campaign_captions(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaign_captions_platform
  ON campaign_captions(campaign_id, platform);

-- -----------------------------------------------------------------------------
-- campaign_hashtag_sets
--
-- Curated hashtag collections, one row per set per platform.
-- tags is a text array for direct iteration without JSON parsing.
-- reach_tier is a coarse signal (niche / mid / broad) set by the Digital
-- Employee based on tag popularity at generation time.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS campaign_hashtag_sets (
  id                  text        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id     text        NOT NULL REFERENCES organizations(id),
  campaign_id         text        NOT NULL REFERENCES dogfooding_campaigns(id),
  engagement_run_id   text,
  digital_employee_id text,
  model_provider      text,
  platform            text        NOT NULL,
  name                text        NOT NULL,
  tags                text[]      NOT NULL DEFAULT '{}',
  reach_tier          text        NOT NULL DEFAULT 'mid'
                                  CHECK (reach_tier IN ('niche', 'mid', 'broad')),
  status              text        NOT NULL DEFAULT 'draft'
                                  CHECK (status IN ('draft', 'approved', 'rejected')),
  approval_note       text,
  approved_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_hashtag_sets_campaign
  ON campaign_hashtag_sets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_hashtag_sets_org
  ON campaign_hashtag_sets(organization_id);

-- -----------------------------------------------------------------------------
-- campaign_calendar_slots
--
-- Scheduling layer: maps approved deliverables to a specific date, time, and
-- platform. Each slot references at most one of each deliverable type via
-- nullable FK columns. The CHECK constraint enforces that every slot has at
-- least one piece of content — a slot with no content is meaningless.
--
-- published_by is a free-text actor ID (userId or 'automation') rather than
-- a FK to users, matching the pattern in campaign_publish_events below.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS campaign_calendar_slots (
  id               text        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id  text        NOT NULL REFERENCES organizations(id),
  campaign_id      text        NOT NULL REFERENCES dogfooding_campaigns(id),
  scheduled_at     timestamptz NOT NULL,
  platform         text        NOT NULL,
  asset_id         text        REFERENCES campaign_assets(id),
  copy_variant_id  text        REFERENCES dogfooding_ad_copy_variants(id),
  caption_id       text        REFERENCES campaign_captions(id),
  hashtag_set_id   text        REFERENCES campaign_hashtag_sets(id),
  status           text        NOT NULL DEFAULT 'draft'
                               CHECK (status IN (
                                 'draft', 'scheduled', 'published', 'missed', 'cancelled'
                               )),
  published_at     timestamptz,
  published_by     text,
  live_post_url    text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT calendar_slot_has_content CHECK (
    asset_id        IS NOT NULL OR
    copy_variant_id IS NOT NULL OR
    caption_id      IS NOT NULL OR
    hashtag_set_id  IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_campaign_calendar_slots_campaign
  ON campaign_calendar_slots(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_calendar_slots_org
  ON campaign_calendar_slots(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaign_calendar_slots_scheduled
  ON campaign_calendar_slots(campaign_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_campaign_calendar_slots_status
  ON campaign_calendar_slots(campaign_id, status);

-- -----------------------------------------------------------------------------
-- campaign_approval_events
--
-- Append-only audit log. Every approval, rejection, or reset-to-draft action
-- on any deliverable type writes a row here. Rows are never updated or deleted.
--
-- asset_type discriminates which table asset_id refers to. No FK constraint is
-- placed on asset_id because a polymorphic FK spanning seven tables cannot be
-- enforced at the DB level without triggers. The application layer is
-- responsible for ensuring referential integrity at write time.
--
-- This table intentionally has no updated_at column and no update trigger.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS campaign_approval_events (
  id                text        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id   text        NOT NULL REFERENCES organizations(id),
  campaign_id       text        NOT NULL REFERENCES dogfooding_campaigns(id),
  asset_type        text        NOT NULL
                                CHECK (asset_type IN (
                                  'ad_copy_variant', 'creative', 'asset',
                                  'script', 'caption', 'hashtag_set'
                                )),
  asset_id          text        NOT NULL,
  decision          text        NOT NULL
                                CHECK (decision IN ('approved', 'rejected', 'reset_to_draft')),
  note              text,
  actor_type        text        NOT NULL
                                CHECK (actor_type IN ('user', 'digital_employee')),
  actor_id          text        NOT NULL,
  engagement_run_id text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_approval_events_campaign
  ON campaign_approval_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_approval_events_org
  ON campaign_approval_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaign_approval_events_asset
  ON campaign_approval_events(asset_type, asset_id);
CREATE INDEX IF NOT EXISTS idx_campaign_approval_events_created
  ON campaign_approval_events(campaign_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- campaign_publish_events
--
-- Append-only record of every publish, unpublish, schedule, and cancellation
-- action. Rows are never updated or deleted.
--
-- asset_type / asset_id follow the same polymorphic convention as
-- campaign_approval_events — no DB-level FK, application-layer integrity.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS campaign_publish_events (
  id               text        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id  text        NOT NULL REFERENCES organizations(id),
  campaign_id      text        NOT NULL REFERENCES dogfooding_campaigns(id),
  calendar_slot_id text        REFERENCES campaign_calendar_slots(id),
  asset_type       text        NOT NULL
                               CHECK (asset_type IN (
                                 'ad_copy_variant', 'creative', 'asset',
                                 'script', 'caption', 'hashtag_set'
                               )),
  asset_id         text        NOT NULL,
  platform         text        NOT NULL,
  action           text        NOT NULL
                               CHECK (action IN (
                                 'published', 'unpublished', 'scheduled', 'cancelled'
                               )),
  actor_type       text        NOT NULL
                               CHECK (actor_type IN ('user', 'automation')),
  actor_id         text        NOT NULL,
  live_post_url    text,
  published_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_publish_events_campaign
  ON campaign_publish_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_publish_events_org
  ON campaign_publish_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaign_publish_events_asset
  ON campaign_publish_events(asset_type, asset_id);
CREATE INDEX IF NOT EXISTS idx_campaign_publish_events_published
  ON campaign_publish_events(campaign_id, published_at DESC);

-- =============================================================================
-- PART 3 — Updated-at triggers for mutable new tables
--
-- Append-only tables (campaign_approval_events, campaign_publish_events) are
-- excluded — they have no updated_at column and must never be updated.
-- The update_updated_at_column() function already exists from migration 017.
-- =============================================================================

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'campaign_assets',
    'campaign_scripts',
    'campaign_captions',
    'campaign_hashtag_sets',
    'campaign_calendar_slots'
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
