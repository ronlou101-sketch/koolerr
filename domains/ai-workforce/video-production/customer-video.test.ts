import { describe, expect, it, vi } from 'vitest'
import type { IModelGateway } from '@/shared/model-gateway'
import type { OrganizationId, TenantId, WorkforceId, EngagementRunId } from '@/shared/types'
import { VideoProductionDepartmentService } from './service'
import { buildCustomerVideoScriptPrompt } from './prompt'

vi.mock('@/shared/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))
vi.mock('@/shared/trust', () => ({
  trustEngine: { registerRule: vi.fn(), evaluate: vi.fn(() => ({ allowed: true })) },
}))

const REQ = {
  tenantId: 'tenant_1' as TenantId,
  organizationId: 'org_1' as OrganizationId,
  workforceId: 'wf_1' as WorkforceId,
  engagementRunId: 'assist_1' as EngagementRunId,
  description: 'Promote our spring cleaning special with a friendly tone.',
  targetDurationSec: 60,
  tone: 'friendly',
  cta: 'Book today',
}

describe('buildCustomerVideoScriptPrompt', () => {
  it('embeds the description, tone, cta, target duration and a word budget', () => {
    const p = buildCustomerVideoScriptPrompt({
      description: 'Announce a 20% discount',
      tone: 'energetic',
      cta: 'Call now',
      targetDurationSec: 60,
      businessName: 'Acme',
    })
    expect(p).toContain('Announce a 20% discount')
    expect(p).toContain('energetic')
    expect(p).toContain('Call now')
    expect(p).toContain('Acme')
    expect(p).toContain('60') // target duration
    expect(p).toContain('150 words') // 60 * 2.5
    expect(p).toContain('estimatedDurationSec')
  })
})

describe('writeCustomerVideoScript', () => {
  it('returns a parsed script from the gateway JSON response', async () => {
    const gateway = {
      invoke: vi.fn(async () => ({
        content: JSON.stringify({
          title: 'Spring Special',
          script: 'Hi, spring is here and we have a deal for you.',
          platform: 'facebook',
          estimatedDurationSec: 60,
        }),
      })),
    } as unknown as IModelGateway
    const svc = new VideoProductionDepartmentService(gateway)

    const r = await svc.writeCustomerVideoScript(REQ)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.title).toBe('Spring Special')
      expect(r.value.script).toContain('spring is here')
      expect(r.value.estimatedDurationSec).toBe(60)
    }
    // Passes the org's real workforce + run marker to the gateway.
    expect(gateway.invoke).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org_1',
        workforceId: 'wf_1',
        action: 'write_video_script',
      })
    )
  })

  it('treats a plain-text response as the script (lenient parse)', async () => {
    const gateway = {
      invoke: vi.fn(async () => ({ content: 'Just some spoken words for the video.' })),
    } as unknown as IModelGateway
    const svc = new VideoProductionDepartmentService(gateway)
    const r = await svc.writeCustomerVideoScript(REQ)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.script).toContain('spoken words')
  })

  it('fails gracefully when every provider errors', async () => {
    const gateway = {
      invoke: vi.fn(async () => {
        throw new Error('provider down')
      }),
    } as unknown as IModelGateway
    const svc = new VideoProductionDepartmentService(gateway)
    const r = await svc.writeCustomerVideoScript(REQ)
    expect(r.ok).toBe(false)
  })
})
