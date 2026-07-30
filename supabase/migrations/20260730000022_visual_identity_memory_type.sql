-- =============================================================================
-- Migration 022: Brand Ambassador — visual_identity Business Memory type
--
-- Experience Workstream · Brand Ambassador Foundation (Slice 1).
--
-- Additive, non-destructive: widens the business_memories.type CHECK constraint
-- to allow the new 'visual_identity' memory type. The Brand Ambassador stores a
-- provider-agnostic identity (persona, appearance, voice, brand assets, provider
-- references) in the Business Brain as a 'visual_identity' memory. No data is
-- modified; existing rows and queries are unaffected.
--
-- The constraint is inline (auto-named business_memories_type_check); we drop and
-- recreate it with the additional value. Idempotent via IF EXISTS.
-- =============================================================================

ALTER TABLE business_memories
  DROP CONSTRAINT IF EXISTS business_memories_type_check;

ALTER TABLE business_memories
  ADD CONSTRAINT business_memories_type_check
  CHECK (type IN (
    'company_identity', 'brand', 'product', 'service',
    'pricing', 'policy', 'sop', 'customer', 'asset',
    'knowledge', 'preference', 'decision',
    'visual_identity'
  ));
