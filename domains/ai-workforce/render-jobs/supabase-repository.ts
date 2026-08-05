import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  DeliverableId,
  EngagementRunId,
  OrganizationId,
  RenderJobId,
  TenantId,
} from '@/shared/types'
import type { IRenderJobsRepository } from './repository'
import type { EnqueueRenderJobInput, RenderJob, RenderJobKind, RenderJobStatus } from './types'

// ---------------------------------------------------------------------------
// Database row type — mirrors the schema in migration 024 (render_jobs)
// ---------------------------------------------------------------------------

interface RenderJobRow {
  id: string
  organization_id: string
  tenant_id: string
  engagement_run_id: string
  kind: string
  source_deliverable_id: string | null
  prompt: string
  status: string
  attempts: number
  result_deliverable_id: string | null
  error: string | null
  dedupe_key: string
  created_at: string
  updated_at: string
  claimed_at: string | null
}

function mapRenderJob(row: RenderJobRow): RenderJob {
  return {
    id: row.id as RenderJobId,
    organizationId: row.organization_id as OrganizationId,
    tenantId: row.tenant_id as TenantId,
    engagementRunId: row.engagement_run_id as EngagementRunId,
    kind: row.kind as RenderJobKind,
    sourceDeliverableId: (row.source_deliverable_id as DeliverableId | null) ?? null,
    prompt: row.prompt,
    status: row.status as RenderJobStatus,
    attempts: row.attempts,
    resultDeliverableId: (row.result_deliverable_id as DeliverableId | null) ?? null,
    error: row.error,
    dedupeKey: row.dedupe_key,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    claimedAt: row.claimed_at ? new Date(row.claimed_at) : null,
  }
}

// ---------------------------------------------------------------------------
// Repository implementation
// ---------------------------------------------------------------------------

export class SupabaseRenderJobsRepository implements IRenderJobsRepository {
  constructor(private readonly client: SupabaseClient) {}

  async enqueue(input: EnqueueRenderJobInput): Promise<RenderJob> {
    const now = new Date().toISOString()
    const row: RenderJobRow = {
      id: `render_job_${crypto.randomUUID()}`,
      organization_id: input.organizationId,
      tenant_id: input.tenantId,
      engagement_run_id: input.engagementRunId,
      kind: input.kind,
      source_deliverable_id: input.sourceDeliverableId ?? null,
      prompt: input.prompt,
      status: 'pending',
      attempts: 0,
      result_deliverable_id: null,
      error: null,
      dedupe_key: input.dedupeKey,
      created_at: now,
      updated_at: now,
      claimed_at: null,
    }

    // Idempotent: a conflicting dedupe_key inserts nothing; the existing job is returned.
    const { data, error } = await this.client
      .from('render_jobs')
      .upsert(row, { onConflict: 'dedupe_key', ignoreDuplicates: true })
      .select()
      .maybeSingle()
    if (error) throw new Error(`[RENDER_JOBS_REPO] enqueue failed: ${error.message}`)
    if (data) return mapRenderJob(data as RenderJobRow)

    const existing = await this.client
      .from('render_jobs')
      .select()
      .eq('dedupe_key', input.dedupeKey)
      .single()
    if (existing.error || !existing.data) {
      throw new Error(
        `[RENDER_JOBS_REPO] enqueue conflict fetch failed: ${existing.error?.message}`
      )
    }
    return mapRenderJob(existing.data as RenderJobRow)
  }

  async findById(id: RenderJobId): Promise<RenderJob | null> {
    const { data, error } = await this.client
      .from('render_jobs')
      .select()
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error(`[RENDER_JOBS_REPO] findById failed: ${error.message}`)
    return data ? mapRenderJob(data as RenderJobRow) : null
  }

  async listByRun(engagementRunId: EngagementRunId): Promise<RenderJob[]> {
    const { data, error } = await this.client
      .from('render_jobs')
      .select()
      .eq('engagement_run_id', engagementRunId)
    if (error) throw new Error(`[RENDER_JOBS_REPO] listByRun failed: ${error.message}`)
    return (data as RenderJobRow[]).map(mapRenderJob)
  }

  async claimPending(limit: number): Promise<RenderJob[]> {
    // Atomic bounded claim via the claim_render_jobs() SQL function (FOR UPDATE
    // SKIP LOCKED) — the only concurrency-safe path (ADR-025 §5).
    const { data, error } = await this.client.rpc('claim_render_jobs', { p_limit: limit })
    if (error) throw new Error(`[RENDER_JOBS_REPO] claimPending failed: ${error.message}`)
    return (data as RenderJobRow[]).map(mapRenderJob)
  }

  async markCompleted(
    id: RenderJobId,
    resultDeliverableId: DeliverableId
  ): Promise<RenderJob | null> {
    const { data, error } = await this.client
      .from('render_jobs')
      .update({
        status: 'completed',
        result_deliverable_id: resultDeliverableId,
        error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .maybeSingle()
    if (error) throw new Error(`[RENDER_JOBS_REPO] markCompleted failed: ${error.message}`)
    return data ? mapRenderJob(data as RenderJobRow) : null
  }

  async markFailed(id: RenderJobId, error: string, maxAttempts: number): Promise<RenderJob | null> {
    // Called by the single worker that claimed the job. Fetch to compute the next
    // attempt count and terminal-vs-retry status, then update.
    const current = await this.findById(id)
    if (!current) return null
    const attempts = current.attempts + 1
    const status: RenderJobStatus = attempts >= maxAttempts ? 'failed' : 'pending'

    const { data, error: updateError } = await this.client
      .from('render_jobs')
      .update({
        attempts,
        status,
        error,
        claimed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .maybeSingle()
    if (updateError) throw new Error(`[RENDER_JOBS_REPO] markFailed failed: ${updateError.message}`)
    return data ? mapRenderJob(data as RenderJobRow) : null
  }
}
