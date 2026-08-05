import type { DeliverableId, EngagementRunId, RenderJobId } from '@/shared/types'
import type { EnqueueRenderJobInput, RenderJob } from './types'

/**
 * Render Jobs Repository Interface (ADR-025 §5, ADR-004).
 *
 * Storage contract for the durable render-job model. `enqueue` is idempotent on
 * `dedupeKey`; `claimPending` transitions a bounded set of pending jobs to running
 * atomically (no double-claim); `markFailed` implements retry (back to pending
 * until the attempt cap, then terminal failed).
 */
export interface IRenderJobsRepository {
  /** Idempotent create: returns the existing job when `dedupeKey` already exists. */
  enqueue(input: EnqueueRenderJobInput): Promise<RenderJob>
  findById(id: RenderJobId): Promise<RenderJob | null>
  listByRun(engagementRunId: EngagementRunId): Promise<RenderJob[]>
  /** Atomically claim up to `limit` pending jobs (pending → running). */
  claimPending(limit: number): Promise<RenderJob[]>
  markCompleted(id: RenderJobId, resultDeliverableId: DeliverableId): Promise<RenderJob | null>
  /**
   * Record a failed attempt. Increments `attempts`; if it reaches `maxAttempts`
   * the job is terminal `failed`, otherwise it returns to `pending` (resumable).
   */
  markFailed(id: RenderJobId, error: string, maxAttempts: number): Promise<RenderJob | null>
}
