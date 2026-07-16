import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { DogfoodingCreative } from '@/domains/dogfooding'
import type { DogfoodingPipelineInput } from './pipeline'

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/shared/model-gateway', () => ({
  modelGateway: { invoke: vi.fn() },
}))

vi.mock('@/domains/deliverables', () => ({
  deliverablesService: { storeDeliverable: vi.fn() },
}))

vi.mock('@/domains/business-brain', () => ({
  businessBrainService: { storeMemory: vi.fn().mockResolvedValue({ ok: true, value: {} }) },
}))

vi.mock('@/shared/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// ---------------------------------------------------------------------------
// Import under test (after mocks are declared)
// ---------------------------------------------------------------------------

import { generateVideoScripts } from './pipeline'
import { modelGateway } from '@/shared/model-gateway'
import { deliverablesService } from '@/domains/deliverables'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TEST_INPUT: DogfoodingPipelineInput = {
  tenantId: 'tenant_test' as DogfoodingPipelineInput['tenantId'],
  organizationId: 'org_test' as DogfoodingPipelineInput['organizationId'],
  workforceId: 'wf_test' as DogfoodingPipelineInput['workforceId'],
  engagementRunId: 'run_test_42' as DogfoodingPipelineInput['engagementRunId'],
  objective: {
    id: 'obj_1',
    organizationId: 'org_test' as DogfoodingPipelineInput['organizationId'],
    title: 'Q3 Brand Awareness',
    description: 'Grow brand recognition among SaaS founders',
    goalType: 'brand_awareness',
    targetAudience: 'SaaS founders',
    successMetrics: ['+20% awareness'],
    budgetCents: 500000,
    status: 'active',
    engagementRunId: 'run_test_42',
    createdAt: new Date('2026-07-01'),
    updatedAt: new Date('2026-07-01'),
  },
}

function makeVideoCreative(
  id: string,
  prompt = 'Introduce Koolerr as the AI workforce platform'
): DogfoodingCreative {
  return {
    id,
    organizationId: 'org_test' as DogfoodingPipelineInput['organizationId'],
    campaignId: 'campaign_abc',
    engagementRunId: 'run_test_42',
    digitalEmployeeId: 'marketing-creative-director',
    modelProvider: 'openai',
    type: 'video',
    prompt,
    assetUrl: null,
    thumbnailUrl: null,
    metadata: { concept: 'AI workforce demo', adFormat: 'landscape', angle: 'pain-point' },
    status: 'planned',
    approvalNote: null,
    approvedAt: null,
    publishStatus: 'unpublished',
    createdAt: new Date('2026-07-01'),
    updatedAt: new Date('2026-07-01'),
  }
}

const MOCK_SCRIPT_JSON = JSON.stringify({
  title: 'Pain-Point Hook — 45s',
  script:
    'Still hiring humans for marketing? Koolerr gives you an AI workforce that writes, designs, and publishes your content 24/7. Join 500+ businesses that replaced their content teams. Start today at koolerr.com.',
  platform: 'facebook',
  estimatedDurationSec: 45,
})

function mockSuccessfulInvoke() {
  vi.mocked(modelGateway.invoke).mockResolvedValue({
    content: MOCK_SCRIPT_JSON,
    provider: 'openai',
    model: 'gpt-4o',
    tokensUsed: 120,
    latencyMs: 800,
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('generateVideoScripts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(deliverablesService.storeDeliverable).mockResolvedValue({
      ok: true,
      value: {
        id: 'deliverable_1' as never,
        organizationId: 'org_test' as never,
        engagementRunId: 'run_test_42' as never,
        type: 'video_script',
        title: 'Pain-Point Hook — 45s',
        content: {},
        status: 'draft',
        version: 1,
        attributedTo: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
  })

  it('does nothing when videoCreatives is empty', async () => {
    await generateVideoScripts({
      input: TEST_INPUT,
      campaignName: 'Q3 Awareness',
      messagingPillars: ['AI power', 'Speed'],
      videoCreatives: [],
    })

    expect(modelGateway.invoke).not.toHaveBeenCalled()
    expect(deliverablesService.storeDeliverable).not.toHaveBeenCalled()
  })

  it('invokes the model gateway once per video creative', async () => {
    mockSuccessfulInvoke()

    await generateVideoScripts({
      input: TEST_INPUT,
      campaignName: 'Q3 Awareness',
      messagingPillars: ['AI power'],
      videoCreatives: [makeVideoCreative('c1'), makeVideoCreative('c2')],
    })

    expect(modelGateway.invoke).toHaveBeenCalledTimes(2)
  })

  it('stores a Deliverable owned by engagementRunId, not campaignId', async () => {
    mockSuccessfulInvoke()

    await generateVideoScripts({
      input: TEST_INPUT,
      campaignName: 'Q3 Awareness',
      messagingPillars: ['AI power'],
      videoCreatives: [makeVideoCreative('creative_99')],
    })

    expect(deliverablesService.storeDeliverable).toHaveBeenCalledOnce()
    const call = vi.mocked(deliverablesService.storeDeliverable).mock.calls[0][0]

    // Ownership is through engagementRunId, not through a campaign
    expect(call.engagementRunId).toBe('run_test_42')
    expect(call.organizationId).toBe('org_test')
    expect(call).not.toHaveProperty('campaignId')
  })

  it('stores deliverable with type video_script', async () => {
    mockSuccessfulInvoke()

    await generateVideoScripts({
      input: TEST_INPUT,
      campaignName: 'Q3 Awareness',
      messagingPillars: [],
      videoCreatives: [makeVideoCreative('c1')],
    })

    const call = vi.mocked(deliverablesService.storeDeliverable).mock.calls[0][0]
    expect(call.type).toBe('video_script')
  })

  it('stores parsed script fields and creativeId in deliverable content', async () => {
    mockSuccessfulInvoke()

    await generateVideoScripts({
      input: TEST_INPUT,
      campaignName: 'Q3 Awareness',
      messagingPillars: [],
      videoCreatives: [makeVideoCreative('creative_xyz')],
    })

    const call = vi.mocked(deliverablesService.storeDeliverable).mock.calls[0][0]
    expect(call.content).toMatchObject({
      script:
        'Still hiring humans for marketing? Koolerr gives you an AI workforce that writes, designs, and publishes your content 24/7. Join 500+ businesses that replaced their content teams. Start today at koolerr.com.',
      platform: 'facebook',
      estimatedDurationSec: 45,
      creativeId: 'creative_xyz',
    })
    expect(call.title).toBe('Pain-Point Hook — 45s')
  })

  it('attributes the deliverable to the video-producer digital employee', async () => {
    mockSuccessfulInvoke()

    await generateVideoScripts({
      input: TEST_INPUT,
      campaignName: 'Q3 Awareness',
      messagingPillars: [],
      videoCreatives: [makeVideoCreative('c1')],
    })

    const call = vi.mocked(deliverablesService.storeDeliverable).mock.calls[0][0]
    expect(call.attributedTo).toContain('video-producer')
  })

  it('falls back to raw content when model returns non-JSON', async () => {
    vi.mocked(modelGateway.invoke).mockResolvedValue({
      content: 'Stop hiring people. Start Koolerr today.',
      provider: 'openai',
      model: 'gpt-4o',
      tokensUsed: 20,
      latencyMs: 200,
    })

    await generateVideoScripts({
      input: TEST_INPUT,
      campaignName: 'Fallback Campaign',
      messagingPillars: [],
      videoCreatives: [makeVideoCreative('c1')],
    })

    const call = vi.mocked(deliverablesService.storeDeliverable).mock.calls[0][0]
    expect(call.type).toBe('video_script')
    expect(call.content).toMatchObject({
      script: 'Stop hiring people. Start Koolerr today.',
      platform: 'facebook',
      estimatedDurationSec: 45,
    })
  })

  it('skips a failing creative and continues with the next', async () => {
    vi.mocked(modelGateway.invoke)
      .mockRejectedValueOnce(new Error('Provider timeout'))
      .mockResolvedValueOnce({
        content: MOCK_SCRIPT_JSON,
        provider: 'openai',
        model: 'gpt-4o',
        tokensUsed: 120,
        latencyMs: 800,
      })

    await expect(
      generateVideoScripts({
        input: TEST_INPUT,
        campaignName: 'Q3 Awareness',
        messagingPillars: [],
        videoCreatives: [makeVideoCreative('c_fail'), makeVideoCreative('c_ok')],
      })
    ).resolves.toBeUndefined()

    // First creative failed, second succeeded → one deliverable stored
    expect(deliverablesService.storeDeliverable).toHaveBeenCalledOnce()
    const call = vi.mocked(deliverablesService.storeDeliverable).mock.calls[0][0]
    expect(call.content).toMatchObject({ creativeId: 'c_ok' })
  })

  it('uses campaign name as fallback title when model JSON is missing title', async () => {
    vi.mocked(modelGateway.invoke).mockResolvedValue({
      content: JSON.stringify({
        script: 'Hello from Koolerr.',
        platform: 'instagram',
        estimatedDurationSec: 30,
      }),
      provider: 'openai',
      model: 'gpt-4o',
      tokensUsed: 50,
      latencyMs: 300,
    })

    await generateVideoScripts({
      input: TEST_INPUT,
      campaignName: 'My Campaign',
      messagingPillars: [],
      videoCreatives: [makeVideoCreative('c1')],
    })

    const call = vi.mocked(deliverablesService.storeDeliverable).mock.calls[0][0]
    expect(call.title).toBe('Spokesperson Script — My Campaign')
  })
})
