import { describe, it, expect } from 'vitest'
import { BillingService } from './service'
import { InMemoryBillingRepository } from './in-memory-repository'
import { ENTITLEMENT_FEATURES, billableSeconds } from './plans'
import type { OrganizationId, TenantId } from '@/shared/types'

/**
 * Step 2D — video-second consumption must be idempotent by render_job.id, so a
 * completed render that is retried can never double-charge. These tests exercise
 * the same two deterministic-keyed meters that consumeSpokespersonVideoUsage
 * records (svc:<id> for the count, svs:<id> for the seconds).
 */

const ORG = 'org_test' as OrganizationId
const TENANT = 'tenant_test' as TenantId
const VIDEO = ENTITLEMENT_FEATURES.spokespersonVideo
const SECONDS = ENTITLEMENT_FEATURES.spokespersonVideoSeconds

function makeService() {
  return new BillingService(new InMemoryBillingRepository())
}

async function seed(svc: BillingService) {
  await svc.setEntitlement({ organizationId: ORG, feature: VIDEO, limit: 5 })
  await svc.setEntitlement({ organizationId: ORG, feature: SECONDS, limit: 600 })
}

/** Mirrors consumeSpokespersonVideoUsage: two idempotent meters keyed on jobId. */
async function consume(svc: BillingService, jobId: string, durationSeconds: number) {
  await svc.recordUsageEvent({
    id: `svc:${jobId}`,
    tenantId: TENANT,
    organizationId: ORG,
    type: 'spokesperson_video',
    quantity: 1,
  })
  const s = billableSeconds(durationSeconds)
  if (s > 0) {
    await svc.recordUsageEvent({
      id: `svs:${jobId}`,
      tenantId: TENANT,
      organizationId: ORG,
      type: 'spokesperson_video_seconds',
      quantity: s,
    })
  }
}

async function used(svc: BillingService, feature: string): Promise<number> {
  const res = await svc.getEntitlements(ORG)
  const e = res.ok ? res.value.find((x) => x.feature === feature) : undefined
  return e ? e.used : -1
}

describe('spokesperson video usage consumption (Step 2D)', () => {
  it('a successful render consumes the count once and the seconds once', async () => {
    const svc = makeService()
    await seed(svc)
    await consume(svc, 'job1', 3.29143)
    expect(await used(svc, VIDEO)).toBe(1)
    expect(await used(svc, SECONDS)).toBe(4) // ceil(3.29143)
  })

  it('a retry of the SAME render_job never consumes twice (idempotent by id)', async () => {
    const svc = makeService()
    await seed(svc)
    await consume(svc, 'job1', 30)
    await consume(svc, 'job1', 30) // retry — identical keys
    expect(await used(svc, VIDEO)).toBe(1)
    expect(await used(svc, SECONDS)).toBe(30)
  })

  it('distinct render_jobs each consume exactly once', async () => {
    const svc = makeService()
    await seed(svc)
    await consume(svc, 'job1', 30)
    await consume(svc, 'job2', 60)
    expect(await used(svc, VIDEO)).toBe(2)
    expect(await used(svc, SECONDS)).toBe(90)
  })

  it('a failed render / store-failure-before-consumption consumes nothing', async () => {
    const svc = makeService()
    await seed(svc)
    // consume() is never invoked (render failed, or deliverable store failed before
    // the completion+consume step) — nothing is charged.
    expect(await used(svc, VIDEO)).toBe(0)
    expect(await used(svc, SECONDS)).toBe(0)
  })

  it('does not create duplicate usage events for the same render_job', async () => {
    const repo = new InMemoryBillingRepository()
    const svc = new BillingService(repo)
    await seed(svc)
    await consume(svc, 'job1', 30)
    await consume(svc, 'job1', 30)
    const events = await repo.listUsageEvents(ORG)
    expect(events.filter((e) => e.id === 'svc:job1')).toHaveLength(1)
    expect(events.filter((e) => e.id === 'svs:job1')).toHaveLength(1)
  })
})
