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
-- SAFETY: the job is created DISABLED (cron.job.active = false). It issues NO
-- HTTP request until explicitly enabled under separate authorization. The bearer
-- secret is read from Supabase Vault at execution time and is NEVER stored in
-- this file, source code, or any committed configuration.
--
-- ACTIVATION PREREQUISITES (performed LATER, not by this migration):
--   1. Store two secrets in Supabase Vault:
--        - 'CRON_SECRET'       : the worker bearer secret (matches the Vercel env var)
--        - 'render_worker_url' : the deployment origin (e.g. https://<prod-domain>),
--                                no trailing slash
--   2. Confirm both resolve, then enable the job:
--        select cron.alter_job(
--          (select jobid from cron.job where jobname = 'render-jobs-drain'),
--          active := true
--        );

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
declare
  v_jobid bigint;
begin
  -- Idempotent (re)creation: drop any prior definition of this job first.
  if exists (select 1 from cron.job where jobname = 'render-jobs-drain') then
    perform cron.unschedule('render-jobs-drain');
  end if;

  -- Register the 2-minute drain schedule. The command reads the worker origin
  -- and bearer secret from Vault at run time — no secret or environment-specific
  -- value is committed here.
  select cron.schedule(
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
  ) into v_jobid;

  -- CRITICAL: leave the job DISABLED. It will not fire until explicitly enabled.
  update cron.job set active = false where jobid = v_jobid;
end;
$$;
