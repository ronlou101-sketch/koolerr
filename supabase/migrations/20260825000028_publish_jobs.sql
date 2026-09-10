-- =============================================================================
-- Migration 028: Publish Jobs (Publishing V1 — Step 3D-2A)
--
-- Durable, idempotent, retryable customer publish jobs. A publish job tracks one
-- approved video deliverable being published to a connected channel (YouTube
-- first) and stores the provider result (video id / URL). Mirrors the proven
-- render_jobs model (atomic FOR UPDATE SKIP LOCKED claim, attempt cap) — it does
-- NOT alter render_jobs or any dogfooding/campaign table.
--
-- Status lifecycle follows the render_jobs convention for the claimable state
-- ('pending') with publish-domain terminals:
--   pending → processing → published | failed
--
-- Additive only. No RLS/auth change to existing tables. No upload logic (that is
-- Step 3D-2B) — this migration only establishes the durable model.
--
-- Includes tenant_id (in addition to the founder-listed org_id) so this table
-- adopts the platform's standard tenant-isolation RLS pattern, consistent with
-- render_jobs / channel_connections.
-- =============================================================================

CREATE TABLE IF NOT EXISTS publish_jobs (
  id                    text PRIMARY KEY,
  organization_id       text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tenant_id             text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  deliverable_id        text NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  channel_connection_id text NOT NULL REFERENCES channel_connections(id) ON DELETE CASCADE,
  provider              text NOT NULL CHECK (provider IN ('youtube')),
  status                text NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'processing', 'published', 'failed')),
  -- Deterministic key: "<org>:<deliverable>:<connection>" — the app sets it and
  -- the partial unique index below enforces "one active/published job per tuple".
  idempotency_key       text NOT NULL,
  attempt_count         integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  -- Retry backoff gate: a job is only claimable when available_at <= now().
  available_at          timestamptz NOT NULL DEFAULT now(),
  started_at            timestamptz,
  completed_at          timestamptz,
  -- Provider result (populated on success in Step 3D-2B).
  external_video_id     text,
  external_url          text,
  privacy_status        text NOT NULL DEFAULT 'unlisted'
                             CHECK (privacy_status IN ('private', 'unlisted', 'public')),
  error_code            text,
  error_message         text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS publish_jobs_org_id_idx        ON publish_jobs(organization_id);
CREATE INDEX IF NOT EXISTS publish_jobs_tenant_id_idx     ON publish_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS publish_jobs_deliverable_idx   ON publish_jobs(deliverable_id);
CREATE INDEX IF NOT EXISTS publish_jobs_status_idx        ON publish_jobs(status);

-- Idempotency: at most ONE active-or-published job per (org, deliverable,
-- connection). A 'failed' job is excluded, so a legitimate retry can re-enqueue,
-- but a video that is pending/processing/published can never be enqueued again —
-- preventing a duplicate upload to YouTube.
CREATE UNIQUE INDEX IF NOT EXISTS publish_jobs_active_unique_idx
  ON publish_jobs(organization_id, deliverable_id, channel_connection_id)
  WHERE status IN ('pending', 'processing', 'published');

ALTER TABLE publish_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "publish_jobs_tenant_isolation" ON publish_jobs
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- ---------------------------------------------------------------------------
-- Atomic bounded claim (mirrors claim_render_jobs — FOR UPDATE SKIP LOCKED).
--
-- Claims up to p_limit jobs, transitioning pending → processing and setting
-- started_at. Two things make jobs non-stuck:
--   • only 'pending' jobs whose available_at has arrived are eligible; and
--   • a 'processing' job whose started_at is older than p_stale_seconds is
--     reclaimed (worker crashed mid-run). NOTE: safe reclaim of an interrupted
--     upload requires upload-level idempotency (resumable session / pre-check),
--     which Step 3D-2B must implement before the worker actually uploads.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION claim_publish_jobs(p_limit integer, p_stale_seconds integer DEFAULT 900)
RETURNS SETOF publish_jobs
LANGUAGE sql
AS $$
  UPDATE publish_jobs
     SET status = 'processing',
         started_at = now(),
         updated_at = now()
   WHERE id IN (
     SELECT id
       FROM publish_jobs
      WHERE (status = 'pending' AND available_at <= now())
         OR (status = 'processing' AND started_at < now() - make_interval(secs => p_stale_seconds))
      ORDER BY created_at
      LIMIT p_limit
      FOR UPDATE SKIP LOCKED
   )
  RETURNING *;
$$;
