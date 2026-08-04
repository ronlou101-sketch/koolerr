-- ---------------------------------------------------------------------------
-- Widen usage_events.type to include 'spokesperson_video' (ADR-025 §4, Slice CR-4)
--
-- Additive only: adds one allowed value to the existing CHECK constraint so the
-- billing sink can meter spokesperson video renders (recordUsageEvent increments
-- the matching `spokesperson_video` entitlement). No data is read, modified, or
-- deleted; existing rows and values remain valid.
-- ---------------------------------------------------------------------------

ALTER TABLE usage_events DROP CONSTRAINT IF EXISTS usage_events_type_check;

ALTER TABLE usage_events
  ADD CONSTRAINT usage_events_type_check
  CHECK (type IN (
    'engagement_run', 'deliverable', 'model_invocation', 'storage', 'spokesperson_video'
  ));
