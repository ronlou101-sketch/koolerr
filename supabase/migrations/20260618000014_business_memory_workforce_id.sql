-- Phase 3 Milestone 3: Workforce Intelligence Attribution
--
-- Adds workforce_id to business_memories so every memory can be attributed
-- to the Workforce that produced it. Global/platform-seeded memories
-- (Foundation docs, ADRs) remain NULL — they belong to no single Workforce.
--
-- Used by Atlas (CTO Agent) to synthesize per-Workforce learning and
-- produce V1 Readiness Reports with cross-Workforce intelligence.
-- See docs/adr/ADR-020-business-brain-workforce-intelligence.md

ALTER TABLE business_memories
  ADD COLUMN IF NOT EXISTS workforce_id text REFERENCES workforces(id);

CREATE INDEX IF NOT EXISTS idx_business_memories_workforce_id
  ON business_memories(workforce_id)
  WHERE workforce_id IS NOT NULL;
