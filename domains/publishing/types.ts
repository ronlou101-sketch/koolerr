import type {
  ChannelConnectionId,
  DeliverableId,
  OrganizationId,
  PublishJobId,
  TenantId,
} from '@/shared/types'

/**
 * Publishing domain — durable customer publish jobs (Step 3D-2A). A publish job
 * tracks one approved video deliverable being published to a connected channel
 * (YouTube first) and stores the provider result. Publishing execution (upload)
 * is Step 3D-2B; this module is the durable model + eligibility only.
 */

export type PublishProvider = 'youtube'

/** pending → processing → published | failed (mirrors render_jobs claim pattern). */
export type PublishJobStatus = 'pending' | 'processing' | 'published' | 'failed'

export type PublishPrivacyStatus = 'private' | 'unlisted' | 'public'

export interface PublishJob {
  id: PublishJobId
  organizationId: OrganizationId
  tenantId: TenantId
  deliverableId: DeliverableId
  channelConnectionId: ChannelConnectionId
  provider: PublishProvider
  status: PublishJobStatus
  idempotencyKey: string
  attemptCount: number
  availableAt: Date
  startedAt: Date | null
  completedAt: Date | null
  externalVideoId: string | null
  externalUrl: string | null
  privacyStatus: PublishPrivacyStatus
  /**
   * YouTube resumable upload session URL, persisted BEFORE any bytes are sent so
   * an interrupted upload can be probed + recovered on retry (never re-uploaded).
   * Null until the driver first initiates an upload session for this job.
   */
  uploadSessionUrl: string | null
  /**
   * Total byte length of the asset uploaded in `uploadSessionUrl`'s session,
   * persisted together with it so the recovery probe can send Google's documented
   * wildcard-range status query WITHOUT re-fetching the (possibly-expired) source
   * asset. Null whenever `uploadSessionUrl` is null.
   */
  uploadContentLength: number | null
  errorCode: string | null
  errorMessage: string | null
  createdAt: Date
  updatedAt: Date
}

export interface EnqueuePublishJobInput {
  organizationId: OrganizationId
  tenantId: TenantId
  deliverableId: DeliverableId
  channelConnectionId: ChannelConnectionId
  provider?: PublishProvider // defaults to 'youtube'
  privacyStatus?: PublishPrivacyStatus // defaults to 'unlisted'
}

/** Provider result recorded when a job publishes successfully (Step 3D-2B). */
export interface PublishResult {
  externalVideoId: string
  externalUrl: string
  privacyStatus: PublishPrivacyStatus
}

/** Deterministic idempotency key for a publish request. */
export function publishIdempotencyKey(
  organizationId: string,
  deliverableId: string,
  channelConnectionId: string
): string {
  return `${organizationId}:${deliverableId}:${channelConnectionId}`
}
