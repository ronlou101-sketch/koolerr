import type {
  DeliverableId,
  EngagementRunId,
  OrganizationId,
  RenderJobId,
  TenantId,
} from '@/shared/types'

/**
 * Render Jobs — durable model (ADR-025 §5).
 *
 * A render job is one media asset to be produced for an engagement run, tracked
 * durably so it is idempotent (deduped), resumable, retryable, and claimable with
 * bounded concurrency. This slice (CR-6b) defines the model and its service only —
 * nothing produces or drives jobs yet (CR-6c). The job stores the render input
 * (`prompt`) so a worker can render without re-deriving it.
 */

export type RenderJobKind = 'video' | 'image'

export type RenderJobStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface RenderJob {
  id: RenderJobId
  organizationId: OrganizationId
  tenantId: TenantId
  engagementRunId: EngagementRunId
  kind: RenderJobKind
  /** Source `video_script` deliverable for a video job; null for a prompt-only image job. */
  sourceDeliverableId: DeliverableId | null
  /** The render input: the spoken script (video) or the image prompt (image). */
  prompt: string
  status: RenderJobStatus
  attempts: number
  /** Produced `video`/`image` deliverable id, set on completion. */
  resultDeliverableId: DeliverableId | null
  error: string | null
  /** Idempotency key — a duplicate enqueue with the same key is a no-op. */
  dedupeKey: string
  createdAt: Date
  updatedAt: Date
  /** Set when a worker claims the job; supports future stale-claim recovery. */
  claimedAt: Date | null
}

/** Input for enqueuing a render job. Idempotent on `dedupeKey`. */
export interface EnqueueRenderJobInput {
  organizationId: OrganizationId
  tenantId: TenantId
  engagementRunId: EngagementRunId
  kind: RenderJobKind
  sourceDeliverableId?: DeliverableId | null
  prompt: string
  dedupeKey: string
}
