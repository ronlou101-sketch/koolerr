import type { PublishJobId } from '@/shared/types'
import type { IPublishJobsRepository } from './repository'
import type { EnqueuePublishJobInput, PublishJob, PublishResult } from './types'

/** Retry backoff: capped linear (attempt × 60s). */
function backoffMs(attempt: number): number {
  return Math.min(attempt, 5) * 60_000
}

/** In-memory publish-jobs repository (tests + default before bootstrap). */
export class InMemoryPublishJobsRepository implements IPublishJobsRepository {
  private readonly jobs = new Map<string, PublishJob>()
  private seq = 0

  private isActiveOrPublished(j: PublishJob): boolean {
    return j.status === 'pending' || j.status === 'processing' || j.status === 'published'
  }

  async enqueue(input: EnqueuePublishJobInput, idempotencyKey: string): Promise<PublishJob> {
    // Idempotency: return any existing active/published job for the tuple.
    for (const j of this.jobs.values()) {
      if (
        j.organizationId === input.organizationId &&
        j.deliverableId === input.deliverableId &&
        j.channelConnectionId === input.channelConnectionId &&
        this.isActiveOrPublished(j)
      ) {
        return j
      }
    }
    const now = new Date()
    const job: PublishJob = {
      id: `pub_${++this.seq}` as PublishJobId,
      organizationId: input.organizationId,
      tenantId: input.tenantId,
      deliverableId: input.deliverableId,
      channelConnectionId: input.channelConnectionId,
      provider: input.provider ?? 'youtube',
      status: 'pending',
      idempotencyKey,
      attemptCount: 0,
      availableAt: now,
      startedAt: null,
      completedAt: null,
      externalVideoId: null,
      externalUrl: null,
      privacyStatus: input.privacyStatus ?? 'unlisted',
      uploadSessionUrl: null,
      uploadContentLength: null,
      errorCode: null,
      errorMessage: null,
      createdAt: now,
      updatedAt: now,
    }
    this.jobs.set(job.id, job)
    return job
  }

  async findById(id: PublishJobId): Promise<PublishJob | null> {
    return this.jobs.get(id) ?? null
  }

  async claimPending(limit: number): Promise<PublishJob[]> {
    const now = Date.now()
    const eligible = [...this.jobs.values()]
      .filter(
        (j) =>
          (j.status === 'pending' && j.availableAt.getTime() <= now) ||
          (j.status === 'processing' &&
            j.startedAt !== null &&
            j.startedAt.getTime() < now - 900_000)
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(0, limit)
    return eligible.map((j) => {
      const claimed: PublishJob = {
        ...j,
        status: 'processing',
        startedAt: new Date(),
        updatedAt: new Date(),
      }
      this.jobs.set(j.id, claimed)
      return claimed
    })
  }

  async markProcessing(id: PublishJobId): Promise<PublishJob | null> {
    const j = this.jobs.get(id)
    if (!j) return null
    const updated: PublishJob = {
      ...j,
      status: 'processing',
      startedAt: new Date(),
      updatedAt: new Date(),
    }
    this.jobs.set(id, updated)
    return updated
  }

  async saveUploadSession(
    id: PublishJobId,
    uploadSessionUrl: string,
    uploadContentLength: number
  ): Promise<void> {
    const j = this.jobs.get(id)
    if (!j) return
    this.jobs.set(id, { ...j, uploadSessionUrl, uploadContentLength, updatedAt: new Date() })
  }

  async markPublished(id: PublishJobId, result: PublishResult): Promise<PublishJob | null> {
    const j = this.jobs.get(id)
    if (!j) return null
    const updated: PublishJob = {
      ...j,
      status: 'published',
      externalVideoId: result.externalVideoId,
      externalUrl: result.externalUrl,
      privacyStatus: result.privacyStatus,
      completedAt: new Date(),
      errorCode: null,
      errorMessage: null,
      updatedAt: new Date(),
    }
    this.jobs.set(id, updated)
    return updated
  }

  async markFailed(
    id: PublishJobId,
    errorCode: string,
    errorMessage: string,
    maxAttempts: number
  ): Promise<PublishJob | null> {
    const j = this.jobs.get(id)
    if (!j) return null
    const attemptCount = j.attemptCount + 1
    const terminal = attemptCount >= maxAttempts
    const updated: PublishJob = {
      ...j,
      attemptCount,
      status: terminal ? 'failed' : 'pending',
      availableAt: terminal ? j.availableAt : new Date(Date.now() + backoffMs(attemptCount)),
      completedAt: terminal ? new Date() : null,
      errorCode,
      errorMessage,
      updatedAt: new Date(),
    }
    this.jobs.set(id, updated)
    return updated
  }
}
