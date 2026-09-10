-- Migration 030: Publish Jobs — durable YouTube resumable upload recovery state
-- (Step 3D-2B, duplicate-upload safety / review finding B2).
--
-- Persist BOTH the resumable session URL and the original video's total byte
-- length BEFORE the first byte is uploaded. On retry the driver issues Google's
-- documented resumable STATUS query — PUT <session> with
-- `Content-Range: bytes */<upload_content_length>` and the bearer token — to
-- learn whether YouTube already created the video. That recovery must NOT depend
-- on re-fetching the (possibly-expired) source asset, so the content length is
-- stored here rather than recomputed.
--
-- Additive + nullable; no backfill. No RLS/auth/JWT change. Does NOT touch
-- render_jobs or any campaign/dogfooding table — it only widens publish_jobs.

ALTER TABLE publish_jobs
  ADD COLUMN IF NOT EXISTS upload_session_url    text,
  ADD COLUMN IF NOT EXISTS upload_content_length bigint;
