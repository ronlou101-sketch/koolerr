-- Publish-jobs scheduler — register ONLY the schedule (Step 3D-2B).
--
-- WHY: identical rationale to the render-jobs scheduler (migration 025). Vercel
-- Cron on the Hobby plan permits at most one run per day, so the intended
-- 2-minute drain cadence must live on Supabase pg_cron + pg_net, co-located with
-- the publish_jobs queue. The publish worker is a plain authenticated endpoint —
-- scheduler-agnostic — so we relocate ONLY the trigger.
--
-- This migration changes NOTHING about publishing execution. It does not touch
-- the publish_jobs table, claim_publish_jobs(), the publishing service/repository,
-- retry/idempotency logic, the channels/OAuth tables, render_jobs, or any
-- dogfooding/campaign table. It only registers a scheduled HTTP ping to the
-- existing endpoint:
--
--     GET /api/cron/publish-jobs
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
--   1. Reuse the same two Vault secrets the render scheduler uses:
--        - 'CRON_SECRET'       : the worker bearer secret (matches the Vercel env var)
--        - 'render_worker_url' : the stable production origin, no trailing slash
--                                (both workers share one deployment origin)
--   2. Enable the job (separately authorized) — via the Supabase Cron dashboard
--      (toggle Active on), or SQL:
--        select cron.alter_job(<jobid>, active := true);

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
declare
  v_jobid bigint;
begin
  -- Idempotent (re)creation via the function API only. cron.unschedule raises if
  -- the job is absent (e.g. first apply), so tolerate that.
  begin
    perform cron.unschedule('publish-jobs-drain');
  exception
    when others then
      null;  -- no existing job named publish-jobs-drain; nothing to remove
  end;

  -- Register the 2-minute drain schedule; cron.schedule returns the new jobid.
  -- The command reads the worker origin and bearer secret from Vault at run time
  -- — no secret or environment-specific value is committed here.
  v_jobid := cron.schedule(
    'publish-jobs-drain',
    '*/2 * * * *',
    $cmd$
      select net.http_get(
        url := (
          select decrypted_secret from vault.decrypted_secrets
          where name = 'render_worker_url'
        ) || '/api/cron/publish-jobs',
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
