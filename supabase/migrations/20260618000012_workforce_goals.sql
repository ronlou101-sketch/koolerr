-- Phase 2 Milestone 5: Workforce Management
-- Add goals column to workforces table so customers can define business goals.

ALTER TABLE workforces
  ADD COLUMN IF NOT EXISTS goals text[] NOT NULL DEFAULT '{}';
