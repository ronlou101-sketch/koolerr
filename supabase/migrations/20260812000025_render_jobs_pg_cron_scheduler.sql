-- Render-jobs scheduler — move ONLY the schedule off Vercel Cron (ADR-025 §5).
--
-- WHY: Vercel Cron is incompatible with the project's Hobby plan (Hobby permits
-- cron at most once per day, so the intended `*/2 * * * *` cadence fails the
-- deployment). The render worker and queue are scheduler-agnostic — the worker
-- is a plain authenticated endpoint — so we relocate ONLY the trigger to
-- Supabase pg_cron + pg_net, co-located with the render_jobs queue.
--
-- This migration changes NOTHING about the render pipeline. It does not touch
-- the render_jobs table, claim_render_jobs(), the render-jobs service/repository,
-- retry/idempotency/dedupe logic, provider integrations, entitlement gating, or
-- the worker's auth contract. It only registers a scheduled HTTP ping to the
-- existing endpoint:
--
--     GET /api/cron/render-jobs
--     Authorization: Bearer <CRON_SECRET>
--
-- pg_cron PERMISSIONS: on Supabase the migration role may NOT read or write the
-- `cron.job` table directly (SELECT/UPDATE raise permission denied, SQLSTATE
-- 42501). We therefore use only pg_cron's function API — cron.unschedule /
-- cron.schedule / cron.alter_job — never direct table DML.
--
-- SAFETY: the job is created DISABLED via cron.alter_job(active := false). It
-- issues NO HTTP request until explicitly enabled under separate authorization.
-- The bearer secret and worker origin are read from Supabase Vault at execution
-- time and are NEVER stored in this file, source code, or committed config.
--
-- ACTIVATION PREREQUISITES (performed LATER, not by this migration):
--   1. Store two secrets in Supabase Vault:
--        - 'CRON_SECRET'       : the worker bearer secret (matches the Vercel env var)
--        - 'render_worker_url' : the stable production origin
--                                (https://koolerr-s1bb.vercel.app), no trailing slash
--   2. Enable the job (separately authorized) — e.g. via the Supabase Cron
--      dashboard (toggle Active on), or SQL:
--        select cron.alter_job(<jobid>, active := true);
--      where <jobid> is this job's id (visible in the Supabase Cron dashboard).

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
declare
  v_jobid bigint;
begin
  -- Idempotent (re)creation via the function API only. cron.unschedule raises if
  -- the job is absent (e.g. first apply), so tolerate that. We do NOT rely on any
  -- unverified update-on-duplicate-name behavior of cron.schedule.
  begin
    perform cron.unschedule('render-jobs-drain');
  exception
    when others then
      null;  -- no existing job named render-jobs-drain; nothing to remove
  end;

  -- Register the 2-minute drain schedule; cron.schedule returns the new jobid.
  -- The command reads the worker origin and bearer secret from Vault at run time
  -- — no secret or environment-specific value is committed here.
  v_jobid := cron.schedule(
    'render-jobs-drain',
    '*/2 * * * *',
    $cmd$
      select net.http_get(
        url := (
          select decrypted_secret from vault.decrypted_secrets
          where name = 'render_worker_url'
        ) || '/api/cron/render-jobs',
        headers := jsonb_build_object(
          'Authorization',
          'Bearer ' || (
            select decrypted_secret from vault.decrypted_secrets
            where name = 'CRON_SECRET'
          )
        )
      );
    $cmd$
  );

  -- CRITICAL: leave the job DISABLED via the supported function API (no direct
  -- cron.job UPDATE). It will not fire until explicitly enabled later.
  perform cron.alter_job(v_jobid, active := false);
end;
$$;
