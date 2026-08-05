import type { DeliverableId, EngagementRunId, RenderJobId } from '@/shared/types'
import type { IRenderJobsRepository } from './repository'
import type { EnqueueRenderJobInput, RenderJob } from './types'

/**
 * In-memory render-jobs repository — the default (dev/test) implementation and the
 * unit-test target for the durable model's semantics. Claiming is single-threaded
 * here (no real concurrency); the Supabase repository provides the atomic claim.
 */
export class InMemoryRenderJobsRepository implements IRenderJobsRepository {
  private readonly jobs = new Map<RenderJobId, RenderJob>()
  private readonly byDedupe = new Map<string, RenderJobId>()
  private seq = 0

  async enqueue(input: EnqueueRenderJobInput): Promise<RenderJob> {
    const existingId = this.byDedupe.get(input.dedupeKey)
    if (existingId) return this.jobs.get(existingId)!

    const now = new Date()
    // Deterministic id (no Math.random / Date.now): monotonic per repository instance.
    const id = `render_job_${++this.seq}` as RenderJobId
    const job: RenderJob = {
      id,
      organizationId: input.organizationId,
      tenantId: input.tenantId,
      engagementRunId: input.engagementRunId,
      kind: input.kind,
      sourceDeliverableId: input.sourceDeliverableId ?? null,
      prompt: input.prompt,
      status: 'pending',
      attempts: 0,
      resultDeliverableId: null,
      error: null,
      dedupeKey: input.dedupeKey,
      createdAt: now,
      updatedAt: now,
      claimedAt: null,
    }
    this.jobs.set(id, job)
    this.byDedupe.set(input.dedupeKey, id)
    return job
  }

  async findById(id: RenderJobId): Promise<RenderJob | null> {
    return this.jobs.get(id) ?? null
  }

  async listByRun(engagementRunId: EngagementRunId): Promise<RenderJob[]> {
    return [...this.jobs.values()].filter((j) => j.engagementRunId === engagementRunId)
  }

  async claimPending(limit: number): Promise<RenderJob[]> {
    const claimed: RenderJob[] = []
    for (const job of this.jobs.values()) {
      if (claimed.length >= limit) break
      if (job.status !== 'pending') continue
      job.status = 'running'
      job.claimedAt = new Date()
      job.updatedAt = new Date()
      claimed.push(job)
    }
    return claimed
  }

  async markCompleted(
    id: RenderJobId,
    resultDeliverableId: DeliverableId
  ): Promise<RenderJob | null> {
    const job = this.jobs.get(id)
    if (!job) return null
    job.status = 'completed'
    job.resultDeliverableId = resultDeliverableId
    job.error = null
    job.updatedAt = new Date()
    return job
  }

  async markFailed(id: RenderJobId, error: string, maxAttempts: number): Promise<RenderJob | null> {
    const job = this.jobs.get(id)
    if (!job) return null
    job.attempts += 1
    job.error = error
    job.status = job.attempts >= maxAttempts ? 'failed' : 'pending'
    job.claimedAt = null
    job.updatedAt = new Date()
    return job
  }
}
