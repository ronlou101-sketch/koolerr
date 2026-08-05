-- =============================================================================
-- Migration 024: Render Jobs (ADR-025 §5, Slice CR-6b)
--
-- Durable, idempotent, resumable, retryable per-asset render jobs. A render job
-- tracks one media asset to be produced for an engagement run — keyed to the run
-- and (for video) its source `video_script` deliverable — through the branded,
-- entitlement-gated render path.
--
-- Additive only: a new table + a claim function. No existing table is altered.
-- Nothing produces or drives these jobs yet (that is CR-6c); this migration
-- establishes the durable model per ADR-025 §5.
--
-- See docs/adr/ADR-025-campaign-rendering.md §5.
-- See docs/adr/ADR-004-repository-pattern.md.
-- =============================================================================

CREATE TABLE IF NOT EXISTS render_jobs (
  id                    text PRIMARY KEY,
  organization_id       text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tenant_id             text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  engagement_run_id     text NOT NULL REFERENCES engagement_runs(id) ON DELETE CASCADE,
  kind                  text NOT NULL CHECK (kind IN ('video', 'image')),
  -- Source `video_script` deliverable for a video job; null for a prompt-only image job.
  source_deliverable_id text,
  -- The render input: the spoken script (video) or the image prompt (image).
  prompt                text NOT NULL,
  status                text NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  attempts              integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  -- Produced `video`/`image` deliverable id, set on completion.
  result_deliverable_id text,
  error                 text,
  -- Idempotency key (e.g. "<run>:<kind>:<source-ref>"): a duplicate enqueue is a no-op.
  dedupe_key            text NOT NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  -- Set when a worker claims the job; supports future stale-claim recovery.
  claimed_at            timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS render_jobs_dedupe_key_idx ON render_jobs(dedupe_key);
CREATE INDEX IF NOT EXISTS render_jobs_org_id_idx    ON render_jobs(organization_id);
CREATE INDEX IF NOT EXISTS render_jobs_tenant_id_idx ON render_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS render_jobs_run_id_idx    ON render_jobs(engagement_run_id);
CREATE INDEX IF NOT EXISTS render_jobs_status_idx    ON render_jobs(status);

ALTER TABLE render_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "render_jobs_tenant_isolation" ON render_jobs
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- ---------------------------------------------------------------------------
-- Atomic bounded claim (ADR-025 §5 — bounded concurrency, no double-claim).
--
-- Transitions up to `p_limit` pending jobs to 'running' in a single statement,
-- skipping rows another worker has locked (FOR UPDATE SKIP LOCKED), and returns
-- the claimed rows. This is the only concurrency-safe way to hand work to a
-- worker; the repository calls it via RPC.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION claim_render_jobs(p_limit integer)
RETURNS SETOF render_jobs
LANGUAGE sql
AS $$
  UPDATE render_jobs
     SET status = 'running',
         claimed_at = now(),
         updated_at = now()
   WHERE id IN (
     SELECT id
       FROM render_jobs
      WHERE status = 'pending'
      ORDER BY created_at
      LIMIT p_limit
      FOR UPDATE SKIP LOCKED
   )
  RETURNING *;
$$;
