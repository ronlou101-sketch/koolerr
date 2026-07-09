-- =============================================================================
-- Migration 020: Deliverable Attribution (Foundation §2.9 Compliance)
--
-- Foundation §2.9: "A Deliverable is the completed output of an Engagement Run.
-- It is stored, versioned, attributed to the Engagement Run that produced it,
-- and linked to the Digital Employees that created it."
--
-- dogfooding_ad_copy_variants and dogfooding_creatives were written without
-- Engagement Run or Digital Employee attribution. This migration brings them
-- into Foundation compliance by adding three nullable columns to each table:
--
--   engagement_run_id   — which Engagement Run produced this Deliverable
--   digital_employee_id — which Digital Employee authored it
--   model_provider      — which AI provider was used (for comparison and billing)
--
-- All columns are nullable to preserve compatibility with existing rows.
-- =============================================================================

ALTER TABLE dogfooding_ad_copy_variants
  ADD COLUMN IF NOT EXISTS engagement_run_id   text,
  ADD COLUMN IF NOT EXISTS digital_employee_id text,
  ADD COLUMN IF NOT EXISTS model_provider      text;

ALTER TABLE dogfooding_creatives
  ADD COLUMN IF NOT EXISTS engagement_run_id   text,
  ADD COLUMN IF NOT EXISTS digital_employee_id text,
  ADD COLUMN IF NOT EXISTS model_provider      text;
