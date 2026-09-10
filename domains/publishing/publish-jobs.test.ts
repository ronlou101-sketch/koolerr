import { describe, expect, it } from 'vitest'
import { ok } from '@/shared/types'
import type {
  ChannelConnectionId,
  Deliverable,
  DeliverableId,
  DeliverableStatus,
  DeliverableType,
  OrganizationId,
  PlatformResult,
  TenantId,
} from '@/shared/types'
import type { ChannelConnection } from '@/domains/channels'
import { PublishJobsService } from './service'
import { InMemoryPublishJobsRepository } from './in-memory-repository'
import { assertPublishable } from './eligibility'
import type { EnqueuePublishJobInput } from './types'

const ORG = 'org_1' as OrganizationId
const OTHER_ORG = 'org_2' as OrganizationId
const TENANT = 'tenant_1' as TenantId
const DELIV = 'deliv_1' as DeliverableId
const CONN = 'chan_1' as ChannelConnectionId

function deliverable(
  over: Partial<Deliverable> & { type?: DeliverableType; status?: DeliverableStatus } = {}
): Deliverable {
  return {
    id: DELIV,
    organizationId: ORG,
    type: 'video',
    status: 'approved',
    title: 'Test video',
    content: { videoUrl: 'https://files2.heygen.ai/x.mp4' },
    ...over,
  } as Deliverable
}

function connection(over: Partial<ChannelConnection> = {}): ChannelConnection {
  return {
    id: CONN,
    organizationId: ORG,
    tenantId: TENANT,
    channel: 'youtube',
    externalAccountId: 'yt_1',
    externalAccountName: 'My Channel',
    encryptedAccessToken: 'v1.x',
    encryptedRefreshToken: 'v1.y',
    tokenExpiresAt: new Date(Date.now() + 3_600_000),
    scopes: [],
    status: 'connected',
    connectedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  } as ChannelConnection
}

const input: EnqueuePublishJobInput = {
  organizationId: ORG,
  tenantId: TENANT,
  deliverableId: DELIV,
  channelConnectionId: CONN,
}

function makeService(
  d: Deliverable | null,
  c: ChannelConnection | null,
  repo = new InMemoryPublishJobsRepository()
) {
  return new PublishJobsService(repo, {
    getDeliverable: async (): Promise<PlatformResult<Deliverable>> =>
      d
        ? ok(d)
        : ({
            ok: false,
            error: { code: 'NOT_FOUND', message: 'x' },
          } as PlatformResult<Deliverable>),
    getConnection: async () => ok(c),
  })
}

describe('publish eligibility (assertPublishable)', () => {
  it('accepts an approved video with a connected, org-owned connection', () => {
    expect(
      assertPublishable({
        organizationId: ORG,
        channelConnectionId: CONN,
        deliverable: deliverable(),
        connection: connection(),
      }).ok
    ).toBe(true)
  })
  it('rejects a non-video deliverable', () => {
    const r = assertPublishable({
      organizationId: ORG,
      channelConnectionId: CONN,
      deliverable: deliverable({ type: 'image' }),
      connection: connection(),
    })
    expect(r.ok).toBe(false)
  })
  it('rejects a draft (not approved) video', () => {
    const r = assertPublishable({
      organizationId: ORG,
      channelConnectionId: CONN,
      deliverable: deliverable({ status: 'draft' }),
      connection: connection(),
    })
    expect(r.ok).toBe(false)
  })
  it('rejects a cross-org deliverable', () => {
    const r = assertPublishable({
      organizationId: ORG,
      channelConnectionId: CONN,
      deliverable: deliverable({ organizationId: OTHER_ORG }),
      connection: connection(),
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.code).toBe('TENANT_ISOLATION_VIOLATION')
  })
  it('rejects a cross-org / mismatched channel connection', () => {
    const r = assertPublishable({
      organizationId: ORG,
      channelConnectionId: CONN,
      deliverable: deliverable(),
      connection: connection({ organizationId: OTHER_ORG }),
    })
    expect(r.ok).toBe(false)
  })
  it('rejects a disconnected connection', () => {
    const r = assertPublishable({
      organizationId: ORG,
      channelConnectionId: CONN,
      deliverable: deliverable(),
      connection: connection({ status: 'expired' }),
    })
    expect(r.ok).toBe(false)
  })
})

describe('PublishJobsService.enqueue (eligibility + idempotency)', () => {
  it('enqueues one pending job for an approved video', async () => {
    const svc = makeService(deliverable(), connection())
    const r = await svc.enqueue(input)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.status).toBe('pending')
      expect(r.value.provider).toBe('youtube')
      expect(r.value.privacyStatus).toBe('unlisted')
    }
  })

  it('rejects enqueue for a non-video', async () => {
    const svc = makeService(deliverable({ type: 'blog_post' }), connection())
    expect((await svc.enqueue(input)).ok).toBe(false)
  })

  it('rejects enqueue for a draft video', async () => {
    const svc = makeService(deliverable({ status: 'draft' }), connection())
    expect((await svc.enqueue(input)).ok).toBe(false)
  })

  it('is idempotent — a duplicate request returns the SAME job (no duplicate upload)', async () => {
    const repo = new InMemoryPublishJobsRepository()
    const svc = makeService(deliverable(), connection(), repo)
    const a = await svc.enqueue(input)
    const b = await svc.enqueue(input)
    expect(a.ok && b.ok).toBe(true)
    if (a.ok && b.ok) expect(a.value.id).toBe(b.value.id)
  })
})

describe('publish job claiming + transitions', () => {
  it('claim moves pending → processing and a second claim does not re-claim it', async () => {
    const repo = new InMemoryPublishJobsRepository()
    const svc = makeService(deliverable(), connection(), repo)
    await svc.enqueue(input)
    const first = await svc.claimPending(5)
    expect(first.ok && first.value.length).toBe(1)
    if (first.ok) expect(first.value[0].status).toBe('processing')
    const second = await svc.claimPending(5)
    expect(second.ok && second.value.length).toBe(0) // already processing, not stale
  })

  it('markPublished stores the provider result and terminal status', async () => {
    const repo = new InMemoryPublishJobsRepository()
    const svc = makeService(deliverable(), connection(), repo)
    const enq = await svc.enqueue(input)
    if (!enq.ok) throw new Error('enqueue failed')
    const r = await svc.markPublished(enq.value.id, {
      externalVideoId: 'yt_vid_123',
      externalUrl: 'https://www.youtube.com/watch?v=yt_vid_123',
      privacyStatus: 'unlisted',
    })
    expect(r.ok).toBe(true)
    if (r.ok && r.value) {
      expect(r.value.status).toBe('published')
      expect(r.value.externalVideoId).toBe('yt_vid_123')
      expect(r.value.externalUrl).toContain('youtube.com')
      expect(r.value.completedAt).not.toBeNull()
    }
  })

  it('markFailed retries until the cap, then goes terminal failed', async () => {
    const repo = new InMemoryPublishJobsRepository()
    const svc = makeService(deliverable(), connection(), repo)
    const enq = await svc.enqueue(input)
    if (!enq.ok) throw new Error('enqueue failed')
    const id = enq.value.id
    const f1 = await svc.markFailed(id, 'UPLOAD_ERROR', 'boom')
    if (f1.ok && f1.value) expect(f1.value.status).toBe('pending') // attempt 1 → retry
    const f2 = await svc.markFailed(id, 'UPLOAD_ERROR', 'boom')
    if (f2.ok && f2.value) expect(f2.value.status).toBe('pending') // attempt 2 → retry
    const f3 = await svc.markFailed(id, 'UPLOAD_ERROR', 'boom')
    if (f3.ok && f3.value) {
      expect(f3.value.status).toBe('failed') // attempt 3 → terminal
      expect(f3.value.attemptCount).toBe(3)
    }
  })

  it('after a job fails terminally, a fresh enqueue is allowed (new job)', async () => {
    const repo = new InMemoryPublishJobsRepository()
    const svc = makeService(deliverable(), connection(), repo)
    const enq = await svc.enqueue(input)
    if (!enq.ok) throw new Error('enqueue failed')
    await svc.markFailed(enq.value.id, 'E', 'e')
    await svc.markFailed(enq.value.id, 'E', 'e')
    await svc.markFailed(enq.value.id, 'E', 'e') // terminal failed
    const again = await svc.enqueue(input)
    expect(again.ok).toBe(true)
    if (again.ok) expect(again.value.id).not.toBe(enq.value.id) // a new job, not the failed one
  })

  it('saveUploadSession persists BOTH the session URL and content length (B2 recovery state)', async () => {
    const repo = new InMemoryPublishJobsRepository()
    const svc = makeService(deliverable(), connection(), repo)
    const enq = await svc.enqueue(input)
    if (!enq.ok) throw new Error('enqueue failed')

    // Both null on a fresh job.
    expect(enq.value.uploadSessionUrl).toBeNull()
    expect(enq.value.uploadContentLength).toBeNull()

    const saved = await svc.saveUploadSession(
      enq.value.id,
      'https://www.googleapis.com/upload/youtube/v3/videos?upload_id=S1',
      4096
    )
    expect(saved.ok).toBe(true)

    const after = await svc.getJob(enq.value.id)
    expect(after.ok).toBe(true)
    if (after.ok && after.value) {
      expect(after.value.uploadSessionUrl).toBe(
        'https://www.googleapis.com/upload/youtube/v3/videos?upload_id=S1'
      )
      expect(after.value.uploadContentLength).toBe(4096)
    }
  })
})
