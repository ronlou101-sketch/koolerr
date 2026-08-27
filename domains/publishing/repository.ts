import type { PublishJobId } from '@/shared/types'
import type { EnqueuePublishJobInput, PublishJob, PublishResult } from './types'

/**
 * Publish-jobs repository contract. Idempotent enqueue (one active/published job
 * per org+deliverable+connection), atomic bounded claim, and terminal/retry
 * transitions. Every method is org-scoped at the data layer or keyed by the
 * job's own id (which is org-owned).
 */
export interface IPublishJobsRepository {
  /**
   * Enqueue a publish job, idempotent on (org, deliverable, connection): if an
   * active ('pending'/'processing') or already-'published' job exists for the
   * tuple, that existing job is returned instead of inserting a duplicate.
   */
  enqueue(input: EnqueuePublishJobInput, idempotencyKey: string): Promise<PublishJob>
  findById(id: PublishJobId): Promise<PublishJob | null>
  /** Atomically claim up to `limit` due jobs (pending→processing, + stale reclaim). */
  claimPending(limit: number): Promise<PublishJob[]>
  /** Force a job to 'processing' (sets started_at). */
  markProcessing(id: PublishJobId): Promise<PublishJob | null>
  /**
   * Persist the provider resumable-upload session URL AND the uploaded asset's
   * total byte length for crash-safe recovery. Written BEFORE the first byte is
   * uploaded so a retry can probe (a wildcard-range status query over that length)
   * and recover an already-completed upload instead of creating a duplicate video.
   */
  saveUploadSession(
    id: PublishJobId,
    uploadSessionUrl: string,
    uploadContentLength: number
  ): Promise<void>
  /** Terminal success: store provider result, status 'published'. */
  markPublished(id: PublishJobId, result: PublishResult): Promise<PublishJob | null>
  /** Retry-aware failure: back to 'pending' with backoff until maxAttempts, then 'failed'. */
  markFailed(
    id: PublishJobId,
    errorCode: string,
    errorMessage: string,
    maxAttempts: number
  ): Promise<PublishJob | null>
}
