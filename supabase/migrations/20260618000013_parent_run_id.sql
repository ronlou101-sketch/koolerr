-- Phase 3 Milestone 2: Cross-Workforce Engagement Runs
-- Adds a nullable self-reference so child runs can point to their parent CTO run.
-- Nullable: existing runs are unaffected. Parent runs have NULL parent_run_id.
-- See docs/adr/ADR-019-cross-workforce-engagement-runs.md

ALTER TABLE engagement_runs
  ADD COLUMN IF NOT EXISTS parent_run_id text REFERENCES engagement_runs(id);

CREATE INDEX IF NOT EXISTS idx_engagement_runs_parent_run_id
  ON engagement_runs(parent_run_id)
  WHERE parent_run_id IS NOT NULL;
