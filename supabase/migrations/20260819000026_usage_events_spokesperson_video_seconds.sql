-- ---------------------------------------------------------------------------
-- Widen usage_events.type to include 'spokesperson_video_seconds' (Step 2D).
--
-- Additive only: adds one allowed value to the existing CHECK so the billing sink
-- can meter actual rendered spokesperson-video duration in whole seconds (the
-- integer-seconds consumption model — Step 2C). The video COUNT meter
-- ('spokesperson_video') is unchanged. No column types change (bigint holds
-- whole seconds); no data is read, modified, or deleted.
-- ---------------------------------------------------------------------------

ALTER TABLE usage_events DROP CONSTRAINT IF EXISTS usage_events_type_check;

ALTER TABLE usage_events
  ADD CONSTRAINT usage_events_type_check
  CHECK (type IN (
    'engagement_run', 'deliverable', 'model_invocation', 'storage',
    'spokesperson_video', 'spokesperson_video_seconds'
  ));
