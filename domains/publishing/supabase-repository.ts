import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  ChannelConnectionId,
  DeliverableId,
  OrganizationId,
  PublishJobId,
  TenantId,
} from '@/shared/types'
import type { IPublishJobsRepository } from './repository'
import type {
  EnqueuePublishJobInput,
  PublishJob,
  PublishJobStatus,
  PublishPrivacyStatus,
  PublishProvider,
  PublishResult,
} from './types'

const MAX_BACKOFF_MINUTES = 5

interface PublishJobRow {
  id: string
  organization_id: string
  tenant_id: string
  deliverable_id: string
  channel_connection_id: string
  provider: string
  status: string
  idempotency_key: string
  attempt_count: number
  available_at: string
  started_at: string | null
  completed_at: string | null
  external_video_id: string | null
  external_url: string | null
  privacy_status: string
  upload_session_url: string | null
  // bigint may arrive from postgrest as a number or a string; coerced in mapJob.
  upload_content_length: number | string | null
  error_code: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

function mapJob(row: PublishJobRow): PublishJob {
  return {
    id: row.id as PublishJobId,
    organizationId: row.organization_id as OrganizationId,
    tenantId: row.tenant_id as TenantId,
    deliverableId: row.deliverable_id as DeliverableId,
    channelConnectionId: row.channel_connection_id as ChannelConnectionId,
    provider: row.provider as PublishProvider,
    status: row.status as PublishJobStatus,
    idempotencyKey: row.idempotency_key,
    attemptCount: row.attempt_count,
    availableAt: new Date(row.available_at),
    startedAt: row.started_at ? new Date(row.started_at) : null,
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
    externalVideoId: row.external_video_id,
    externalUrl: row.external_url,
    privacyStatus: row.privacy_status as PublishPrivacyStatus,
    uploadSessionUrl: row.upload_session_url,
    uploadContentLength:
      row.upload_content_length == null ? null : Number(row.upload_content_length),
    errorCode: row.error_code,
    errorMessage: row.error_message,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

/**
 * Supabase publish-jobs repository. Idempotent enqueue relies on the partial
 * unique index (org, deliverable, connection) WHERE status active/published;
 * claim uses the claim_publish_jobs() RPC (FOR UPDATE SKIP LOCKED). All lookups
 * are keyed by the org-owned job id or scoped by organization_id.
 */
export class SupabasePublishJobsRepository implements IPublishJobsRepository {
  constructor(private readonly client: SupabaseClient) {}

  private async findActiveForTuple(input: EnqueuePublishJobInput): Promise<PublishJob | null> {
    const { data, error } = await this.client
      .from('publish_jobs')
      .select('*')
      .eq('organization_id', input.organizationId)
      .eq('deliverable_id', input.deliverableId)
      .eq('channel_connection_id', input.channelConnectionId)
      .in('status', ['pending', 'processing', 'published'])
      .maybeSingle()
    if (error) throw new Error(`[PUBLISH_JOBS_REPO] tuple lookup failed: ${error.message}`)
    return data ? mapJob(data as PublishJobRow) : null
  }

  async enqueue(input: EnqueuePublishJobInput, idempotencyKey: string): Promise<PublishJob> {
    // Fast path: return an existing active/published job for the tuple.
    const existing = await this.findActiveForTuple(input)
    if (existing) return existing

    const now = new Date().toISOString()
    const row: PublishJobRow = {
      id: `pub_${crypto.randomUUID()}`,
      organization_id: input.organizationId,
      tenant_id: input.tenantId,
      deliverable_id: input.deliverableId,
      channel_connection_id: input.channelConnectionId,
      provider: input.provider ?? 'youtube',
      status: 'pending',
      idempotency_key: idempotencyKey,
      attempt_count: 0,
      available_at: now,
      started_at: null,
      completed_at: null,
      external_video_id: null,
      external_url: null,
      privacy_status: input.privacyStatus ?? 'unlisted',
      upload_session_url: null,
      upload_content_length: null,
      error_code: null,
      error_message: null,
      created_at: now,
      updated_at: now,
    }
    const { data, error } = await this.client.from('publish_jobs').insert(row).select().single()
    if (error) {
      // Race: another request inserted the active job between our check and insert
      // (partial unique index violation) → return the winner idempotently.
      if (error.code === '23505') {
        const winner = await this.findActiveForTuple(input)
        if (winner) return winner
      }
      throw new Error(`[PUBLISH_JOBS_REPO] enqueue failed: ${error.message}`)
    }
    return mapJob(data as PublishJobRow)
  }

  async findById(id: PublishJobId): Promise<PublishJob | null> {
    const { data, error } = await this.client
      .from('publish_jobs')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error(`[PUBLISH_JOBS_REPO] findById failed: ${error.message}`)
    return data ? mapJob(data as PublishJobRow) : null
  }

  async claimPending(limit: number): Promise<PublishJob[]> {
    const { data, error } = await this.client.rpc('claim_publish_jobs', { p_limit: limit })
    if (error) throw new Error(`[PUBLISH_JOBS_REPO] claimPending failed: ${error.message}`)
    return (data as PublishJobRow[]).map(mapJob)
  }

  async markProcessing(id: PublishJobId): Promise<PublishJob | null> {
    const { data, error } = await this.client
      .from('publish_jobs')
      .update({
        status: 'processing',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .maybeSingle()
    if (error) throw new Error(`[PUBLISH_JOBS_REPO] markProcessing failed: ${error.message}`)
    return data ? mapJob(data as PublishJobRow) : null
  }

  async saveUploadSession(
    id: PublishJobId,
    uploadSessionUrl: string,
    uploadContentLength: number
  ): Promise<void> {
    const { error } = await this.client
      .from('publish_jobs')
      .update({
        upload_session_url: uploadSessionUrl,
        upload_content_length: uploadContentLength,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    if (error) throw new Error(`[PUBLISH_JOBS_REPO] saveUploadSession failed: ${error.message}`)
  }

  async markPublished(id: PublishJobId, result: PublishResult): Promise<PublishJob | null> {
    const now = new Date().toISOString()
    const { data, error } = await this.client
      .from('publish_jobs')
      .update({
        status: 'published',
        external_video_id: result.externalVideoId,
        external_url: result.externalUrl,
        privacy_status: result.privacyStatus,
        completed_at: now,
        error_code: null,
        error_message: null,
        updated_at: now,
      })
      .eq('id', id)
      .select()
      .maybeSingle()
    if (error) throw new Error(`[PUBLISH_JOBS_REPO] markPublished failed: ${error.message}`)
    return data ? mapJob(data as PublishJobRow) : null
  }

  async markFailed(
    id: PublishJobId,
    errorCode: string,
    errorMessage: string,
    maxAttempts: number
  ): Promise<PublishJob | null> {
    const current = await this.findById(id)
    if (!current) return null
    const attemptCount = current.attemptCount + 1
    const terminal = attemptCount >= maxAttempts
    const now = new Date()
    const backoffMinutes = Math.min(attemptCount, MAX_BACKOFF_MINUTES)
    const availableAt = terminal
      ? current.availableAt.toISOString()
      : new Date(now.getTime() + backoffMinutes * 60_000).toISOString()
    const { data, error } = await this.client
      .from('publish_jobs')
      .update({
        attempt_count: attemptCount,
        status: terminal ? 'failed' : 'pending',
        available_at: availableAt,
        completed_at: terminal ? now.toISOString() : null,
        error_code: errorCode,
        error_message: errorMessage,
        updated_at: now.toISOString(),
      })
      .eq('id', id)
      .select()
      .maybeSingle()
    if (error) throw new Error(`[PUBLISH_JOBS_REPO] markFailed failed: ${error.message}`)
    return data ? mapJob(data as PublishJobRow) : null
  }
}
