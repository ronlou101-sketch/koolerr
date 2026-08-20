import { NextResponse } from 'next/server'
import { bootstrapPlatform } from '@/infrastructure/platform/bootstrap'
import { renderJobsService } from '@/domains/ai-workforce/render-jobs'
import type { RenderJob } from '@/domains/ai-workforce/render-jobs'
import { consumeSpokespersonVideoUsage } from '@/domains/ai-workforce/render'
import { videoProductionDepartment } from '@/domains/ai-workforce/video-production'
import { creativeDepartment } from '@/domains/ai-workforce/creative'
import type { RenderError, RenderJobResult } from '@/domains/ai-workforce/video-production'
import { env } from '@/shared/config/env'
import { logger } from '@/shared/lib/logger'
import type { Result } from '@/shared/types'

/**
 * Render-job driver (ADR-025 §5, Slice CR-6c1).
 *
 * A scheduled (Vercel Cron) worker that drains the durable render_jobs queue:
 * it atomically claims a bounded set of pending jobs, renders each through the
 * existing branded, entitlement-gated render path (CR-2/3/4), and records the
 * outcome (completed with the produced deliverable, or a retry-aware failure).
 *
 * Reuses the bootstrapped service-role singletons (renderJobsService and the
 * render department services) — no separate client is introduced.
 *
 * Nothing enqueues jobs yet (that is CR-6c2), so in normal campaign flow the
 * queue is empty and this worker is a no-op.
 */

// A render (HeyGen video poll) can be slow; claim a small bound so the batch
// completes within the function's maxDuration. ADR-025 §5: a render that would
// exceed the limit is a failed, retryable job — never a partial result.
export const maxDuration = 300

const CLAIM_BATCH_SIZE = 1

function deriveTitle(prompt: string): string {
  const trimmed = prompt.trim()
  return trimmed.length > 80 ? `${trimmed.slice(0, 77)}...` : trimmed
}

/** Dispatch a claimed job to the branded, entitlement-gated render path by kind. */
async function dispatchRender(job: RenderJob): Promise<Result<RenderJobResult, RenderError>> {
  if (job.kind === 'video') {
    if (!job.sourceDeliverableId) {
      return {
        ok: false,
        error: { code: 'RENDER_FAILED', message: 'video render job missing source deliverable' },
      }
    }
    return videoProductionDepartment.renderSpokespersonVideo({
      organizationId: job.organizationId,
      script: job.prompt,
      scriptDeliverableId: job.sourceDeliverableId,
      creativeId: null,
      title: deriveTitle(job.prompt),
    })
  }
  return creativeDepartment.renderImage({
    organizationId: job.organizationId,
    prompt: job.prompt,
    creativeId: null,
  })
}

export async function GET(request: Request): Promise<Response> {
  // ── Authenticate the scheduled request ──────────────────────────────────────
  let expectedSecret: string
  try {
    expectedSecret = env.cron.secret()
  } catch {
    logger.error('[CRON_RENDER_JOBS] CRON_SECRET is not configured — refusing to run')
    return NextResponse.json({ error: 'Cron not configured' }, { status: 500 })
  }
  if (request.headers.get('authorization') !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Ensure the Supabase-backed service-role singletons are wired.
  await bootstrapPlatform()

  const claim = await renderJobsService.claimPending(CLAIM_BATCH_SIZE)
  if (!claim.ok) {
    logger.error('[CRON_RENDER_JOBS] claimPending failed', { error: claim.error.message })
    return NextResponse.json({ error: 'claim failed' }, { status: 500 })
  }

  let completed = 0
  let failed = 0
  for (const job of claim.value) {
    try {
      const render = await dispatchRender(job)
      if (render.ok && render.value.deliverableId) {
        await renderJobsService.markCompleted(job.id, render.value.deliverableId)
        // Consume usage only AFTER durable persistence + completion, keyed on the
        // render_job id so a retry of the same job can never double-charge (Step 2D).
        if (job.kind === 'video') {
          await consumeSpokespersonVideoUsage({
            organizationId: job.organizationId,
            idempotencyKey: job.id,
            durationSeconds: render.value.durationSeconds ?? 0,
          })
        }
        completed++
      } else {
        const message = render.ok
          ? 'render succeeded but no deliverable was stored'
          : render.error.message
        await renderJobsService.markFailed(job.id, message)
        failed++
      }
    } catch (e) {
      await renderJobsService.markFailed(job.id, e instanceof Error ? e.message : String(e))
      failed++
    }
  }

  return NextResponse.json({ claimed: claim.value.length, completed, failed })
}
