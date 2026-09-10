import { NextResponse } from 'next/server'
import { bootstrapPlatform } from '@/infrastructure/platform/bootstrap'
import { publishJobsService, executePublishJob } from '@/domains/publishing'
import { env } from '@/shared/config/env'
import { logger } from '@/shared/lib/logger'

/**
 * Publish-job driver (Step 3D-2B).
 *
 * A scheduled worker that drains the durable publish_jobs queue: it atomically
 * claims a bounded set of due jobs, uploads each approved video to the connected
 * YouTube channel via `executePublishJob`, and records the outcome (published
 * with the provider video id/URL, or a retry-aware failure).
 *
 * Mirrors the proven render-jobs worker (same bearer-secret auth, bootstrap,
 * bounded claim, per-job try/catch). Nothing enqueues jobs automatically — the
 * customer triggers a publish from an approved video — so in normal flow the
 * queue is empty and this worker is a no-op.
 */

// A YouTube upload streams the full video asset; claim a small bound so the
// batch completes within the function's maxDuration. A job that would exceed the
// limit is a failed, retryable job — never a partial upload.
export const maxDuration = 300

const CLAIM_BATCH_SIZE = 1

export async function GET(request: Request): Promise<Response> {
  // ── Authenticate the scheduled request ──────────────────────────────────────
  let expectedSecret: string
  try {
    expectedSecret = env.cron.secret()
  } catch {
    logger.error('[CRON_PUBLISH_JOBS] CRON_SECRET is not configured — refusing to run')
    return NextResponse.json({ error: 'Cron not configured' }, { status: 500 })
  }
  if (request.headers.get('authorization') !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Ensure the Supabase-backed service-role singletons are wired.
  await bootstrapPlatform()

  const claim = await publishJobsService.claimPending(CLAIM_BATCH_SIZE)
  if (!claim.ok) {
    logger.error('[CRON_PUBLISH_JOBS] claimPending failed', { error: claim.error.message })
    return NextResponse.json({ error: 'claim failed' }, { status: 500 })
  }

  let published = 0
  let failed = 0
  for (const job of claim.value) {
    try {
      const result = await executePublishJob(job)
      if (result.ok) {
        await publishJobsService.markPublished(job.id, result.value)
        published++
      } else {
        await publishJobsService.markFailed(job.id, result.error.code, result.error.message)
        failed++
      }
    } catch (e) {
      await publishJobsService.markFailed(
        job.id,
        'INTERNAL_ERROR',
        e instanceof Error ? e.message : String(e)
      )
      failed++
    }
  }

  return NextResponse.json({ claimed: claim.value.length, published, failed })
}
