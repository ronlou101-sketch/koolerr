import { beforeEach, describe, expect, it } from 'vitest'

import type {
  DeliverableId,
  EngagementRunId,
  OrganizationId,
  RenderJobId,
  TenantId,
} from '@/shared/types'
import { InMemoryRenderJobsRepository } from './in-memory-repository'
import { RenderJobsService, RENDER_JOB_MAX_ATTEMPTS } from './service'
import type { EnqueueRenderJobInput } from './types'

const ORG = 'org_test' as OrganizationId
const TENANT = 'tenant_test' as TenantId
const RUN = 'run_test' as EngagementRunId
const OTHER_RUN = 'run_other' as EngagementRunId

function makeInput(overrides: Partial<EnqueueRenderJobInput> = {}): EnqueueRenderJobInput {
  return {
    organizationId: ORG,
    tenantId: TENANT,
    engagementRunId: RUN,
    kind: 'video',
    sourceDeliverableId: 'del_script_1' as DeliverableId,
    prompt: 'Say hello to our customers.',
    dedupeKey: `${RUN}:video:del_script_1`,
    ...overrides,
  }
}

describe('RenderJobsService', () => {
  let service: RenderJobsService

  beforeEach(() => {
    service = new RenderJobsService(new InMemoryRenderJobsRepository())
  })

  it('enqueues a pending job with the render input', async () => {
    const result = await service.enqueue(makeInput())
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.status).toBe('pending')
    expect(result.value.attempts).toBe(0)
    expect(result.value.kind).toBe('video')
    expect(result.value.prompt).toBe('Say hello to our customers.')
    expect(result.value.resultDeliverableId).toBeNull()
  })

  it('is idempotent on dedupeKey: a duplicate enqueue returns the same job', async () => {
    const first = await service.enqueue(makeInput())
    const second = await service.enqueue(makeInput({ prompt: 'different text, same key' }))
    expect(first.ok && second.ok).toBe(true)
    if (!first.ok || !second.ok) return
    expect(second.value.id).toBe(first.value.id)
    expect(second.value.prompt).toBe('Say hello to our customers.') // original wins

    const listed = await service.listByRun(RUN)
    expect(listed.ok && listed.value.length).toBe(1)
  })

  it('claimPending claims up to the limit and transitions pending → running', async () => {
    await service.enqueue(makeInput({ dedupeKey: 'k1' }))
    await service.enqueue(makeInput({ dedupeKey: 'k2' }))
    await service.enqueue(makeInput({ dedupeKey: 'k3' }))

    const claimed = await service.claimPending(2)
    expect(claimed.ok).toBe(true)
    if (!claimed.ok) return
    expect(claimed.value).toHaveLength(2)
    expect(claimed.value.every((j) => j.status === 'running')).toBe(true)
    expect(claimed.value.every((j) => j.claimedAt !== null)).toBe(true)

    // A second claim only picks up the remaining pending job (running not reclaimed).
    const again = await service.claimPending(5)
    expect(again.ok && again.value).toHaveLength(1)
  })

  it('markCompleted sets the result deliverable and completed status', async () => {
    const enq = await service.enqueue(makeInput())
    if (!enq.ok) throw new Error('enqueue failed')

    const done = await service.markCompleted(enq.value.id, 'del_video_1' as DeliverableId)
    expect(done.ok).toBe(true)
    if (!done.ok || !done.value) return
    expect(done.value.status).toBe('completed')
    expect(done.value.resultDeliverableId).toBe('del_video_1')
  })

  it('markFailed retries to pending until the attempt cap, then terminal failed', async () => {
    const enq = await service.enqueue(makeInput())
    if (!enq.ok) throw new Error('enqueue failed')
    const id = enq.value.id

    for (let attempt = 1; attempt < RENDER_JOB_MAX_ATTEMPTS; attempt++) {
      const r = await service.markFailed(id, `boom ${attempt}`)
      expect(r.ok).toBe(true)
      if (!r.ok || !r.value) return
      expect(r.value.attempts).toBe(attempt)
      expect(r.value.status).toBe('pending') // still retryable
    }

    const final = await service.markFailed(id, 'boom final')
    expect(final.ok).toBe(true)
    if (!final.ok || !final.value) return
    expect(final.value.attempts).toBe(RENDER_JOB_MAX_ATTEMPTS)
    expect(final.value.status).toBe('failed') // terminal
  })

  it('listByRun scopes jobs to the engagement run', async () => {
    await service.enqueue(makeInput({ dedupeKey: 'a', engagementRunId: RUN }))
    await service.enqueue(makeInput({ dedupeKey: 'b', engagementRunId: OTHER_RUN }))

    const forRun = await service.listByRun(RUN)
    expect(forRun.ok && forRun.value).toHaveLength(1)
    if (forRun.ok) expect(forRun.value[0].engagementRunId).toBe(RUN)
  })

  it('getJob returns null for an unknown id', async () => {
    const result = await service.getJob('render_job_missing' as RenderJobId)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toBeNull()
  })
})
