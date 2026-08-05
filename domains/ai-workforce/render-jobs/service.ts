import { err, ok } from '@/shared/types'
import { PlatformErrorCode } from '@/shared/types'
import type { DeliverableId, EngagementRunId, PlatformResult, RenderJobId } from '@/shared/types'
import { logger } from '@/shared/lib/logger'
import type { IRenderJobsRepository } from './repository'
import { InMemoryRenderJobsRepository } from './in-memory-repository'
import type { EnqueueRenderJobInput, RenderJob } from './types'

/**
 * Default attempt cap for a render job before it is marked terminally failed
 * (ADR-025 §5 retry semantics). One initial attempt + retries.
 */
export const RENDER_JOB_MAX_ATTEMPTS = 3

/**
 * Render Jobs domain service.
 *
 * Public interface over the durable render-job model (ADR-025 §5): idempotent
 * enqueue, bounded atomic claim, completion, and retry-aware failure. This slice
 * (CR-6b) exposes the model only — no producer or driver yet (CR-6c).
 */
export interface IRenderJobsService {
  /** Enqueue a render job. Idempotent on `input.dedupeKey`. */
  enqueue(input: EnqueueRenderJobInput): Promise<PlatformResult<RenderJob>>
  getJob(id: RenderJobId): Promise<PlatformResult<RenderJob | null>>
  listByRun(engagementRunId: EngagementRunId): Promise<PlatformResult<RenderJob[]>>
  /** Atomically claim up to `limit` pending jobs (pending → running). */
  claimPending(limit: number): Promise<PlatformResult<RenderJob[]>>
  markCompleted(
    id: RenderJobId,
    resultDeliverableId: DeliverableId
  ): Promise<PlatformResult<RenderJob | null>>
  /** Record a failed attempt; retries until the attempt cap, then terminal failed. */
  markFailed(id: RenderJobId, error: string): Promise<PlatformResult<RenderJob | null>>
}

export class RenderJobsService implements IRenderJobsService {
  constructor(private readonly repo: IRenderJobsRepository) {}

  async enqueue(input: EnqueueRenderJobInput): Promise<PlatformResult<RenderJob>> {
    try {
      const job = await this.repo.enqueue(input)
      logger.info('[RENDER_JOBS] Job enqueued', {
        engagementRunId: input.engagementRunId,
        kind: input.kind,
      })
      return ok(job)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async getJob(id: RenderJobId): Promise<PlatformResult<RenderJob | null>> {
    try {
      return ok(await this.repo.findById(id))
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async listByRun(engagementRunId: EngagementRunId): Promise<PlatformResult<RenderJob[]>> {
    try {
      return ok(await this.repo.listByRun(engagementRunId))
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async claimPending(limit: number): Promise<PlatformResult<RenderJob[]>> {
    try {
      return ok(await this.repo.claimPending(limit))
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async markCompleted(
    id: RenderJobId,
    resultDeliverableId: DeliverableId
  ): Promise<PlatformResult<RenderJob | null>> {
    try {
      return ok(await this.repo.markCompleted(id, resultDeliverableId))
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async markFailed(id: RenderJobId, error: string): Promise<PlatformResult<RenderJob | null>> {
    try {
      return ok(await this.repo.markFailed(id, error, RENDER_JOB_MAX_ATTEMPTS))
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }
}

/**
 * Singleton render-jobs service. Defaults to the in-memory repository; the platform
 * bootstrap swaps in the Supabase repository at startup via
 * _configureRenderJobsRepository().
 */
export let renderJobsService: IRenderJobsService = new RenderJobsService(
  new InMemoryRenderJobsRepository()
)

/** Configure the render-jobs repository at startup. Internal use only. */
export function _configureRenderJobsRepository(repo: IRenderJobsRepository): void {
  renderJobsService = new RenderJobsService(repo)
}
