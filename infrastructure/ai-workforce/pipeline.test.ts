import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { BusinessProfile } from '@/domains/ai-workforce/research'
import type { AIWorkforcePipelineContext } from './pipeline'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/domains/ai-workforce/research', () => ({
  researchDepartment: { conductResearch: vi.fn() },
}))
vi.mock('@/domains/ai-workforce/strategy', () => ({
  strategyDepartment: { developStrategy: vi.fn() },
}))
vi.mock('@/domains/ai-workforce/creative', () => ({
  creativeDepartment: { createBrief: vi.fn() },
}))
vi.mock('@/domains/ai-workforce/video-production', () => ({
  videoProductionDepartment: { planProduction: vi.fn() },
  buildSkippedVideoProductionBrief: (creativeBrief: unknown) => ({
    productionPlan: 'Video production was skipped for this run.',
    sourceCreativeBrief: creativeBrief,
  }),
}))
vi.mock('@/domains/ai-workforce/publishing', () => ({
  publishingDepartment: { preparePackages: vi.fn() },
}))
vi.mock('@/domains/ai-workforce/approval', () => ({
  approvalDepartment: { reviewPackages: vi.fn() },
}))
vi.mock('@/domains/ai-workforce/delivery', () => ({
  deliveryDepartment: { prepareDelivery: vi.fn() },
}))
vi.mock('@/domains/business-brain', () => ({
  businessBrainService: { storeMemory: vi.fn().mockResolvedValue({ ok: true, value: {} }) },
}))
vi.mock('@/domains/workforce-engine', () => ({
  workforceEngineService: {
    updateEngagementRunStatus: vi.fn().mockResolvedValue({ ok: true, value: {} }),
  },
}))
vi.mock('@/domains/deliverables', () => ({
  deliverablesService: { storeDeliverable: vi.fn().mockResolvedValue({ ok: true, value: {} }) },
}))
vi.mock('@/shared/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn() },
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TEST_PROFILE: BusinessProfile = {
  businessName: 'Sunshine HVAC',
  businessCategory: 'HVAC Services',
  location: 'Phoenix, AZ',
  website: 'https://sunshinehvac.com',
  serviceArea: 'Greater Phoenix',
  notes: 'Primary service: AC repair. Target audience: Homeowners 35-65.',
}

const TEST_CTX: AIWorkforcePipelineContext = {
  tenantId: 'tenant_test' as AIWorkforcePipelineContext['tenantId'],
  organizationId: 'org_test' as AIWorkforcePipelineContext['organizationId'],
  workforceId: 'workforce_test' as AIWorkforcePipelineContext['workforceId'],
  engagementRunId: 'run_test' as AIWorkforcePipelineContext['engagementRunId'],
}

const RESEARCH_BRIEF = {
  id: 'rb_1',
  businessName: 'Sunshine HVAC',
  audience: 'Homeowners',
  keyInsights: [],
}
const STRATEGY_BRIEF = { id: 'sb_1', targetPlatforms: ['Facebook'], contentPillars: [] }
const CREATIVE_BRIEF = { id: 'cb_1', adCopy: 'Great copy', visualGuidelines: '' }
const VIDEO_BRIEF = { id: 'vb_1', scripts: [], shotList: [] }
const PUBLISHING_JOB = {
  id: 'pj_1',
  status: 'completed',
  packages: [],
  videoProductionBrief: VIDEO_BRIEF,
  attempts: 1,
  employeeId: 'e1',
  providerId: 'openai',
  createdAt: new Date(),
  updatedAt: new Date(),
}
const APPROVAL_DECISION = { id: 'ad_1', approved: true, feedback: 'Approved' }
const DELIVERY_PACKAGE = { id: 'dp_1', finalPackages: [], summary: 'All done' }

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('runAIWorkforcePipeline()', () => {
  let researchMock: ReturnType<typeof vi.fn>
  let strategyMock: ReturnType<typeof vi.fn>
  let creativeMock: ReturnType<typeof vi.fn>
  let videoMock: ReturnType<typeof vi.fn>
  let publishingMock: ReturnType<typeof vi.fn>
  let approvalMock: ReturnType<typeof vi.fn>
  let deliveryMock: ReturnType<typeof vi.fn>
  let storeMemoryMock: ReturnType<typeof vi.fn>
  let updateStatusMock: ReturnType<typeof vi.fn>
  let storeDeliverableMock: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()

    const researchMod = await import('@/domains/ai-workforce/research')
    const strategyMod = await import('@/domains/ai-workforce/strategy')
    const creativeMod = await import('@/domains/ai-workforce/creative')
    const videoMod = await import('@/domains/ai-workforce/video-production')
    const publishingMod = await import('@/domains/ai-workforce/publishing')
    const approvalMod = await import('@/domains/ai-workforce/approval')
    const deliveryMod = await import('@/domains/ai-workforce/delivery')
    const brainMod = await import('@/domains/business-brain')
    const workforceMod = await import('@/domains/workforce-engine')
    const deliverablesMod = await import('@/domains/deliverables')

    researchMock = vi.mocked(researchMod.researchDepartment.conductResearch)
    strategyMock = vi.mocked(strategyMod.strategyDepartment.developStrategy)
    creativeMock = vi.mocked(creativeMod.creativeDepartment.createBrief)
    videoMock = vi.mocked(videoMod.videoProductionDepartment.planProduction)
    publishingMock = vi.mocked(publishingMod.publishingDepartment.preparePackages)
    approvalMock = vi.mocked(approvalMod.approvalDepartment.reviewPackages)
    deliveryMock = vi.mocked(deliveryMod.deliveryDepartment.prepareDelivery)
    storeMemoryMock = vi.mocked(brainMod.businessBrainService.storeMemory)
    updateStatusMock = vi.mocked(workforceMod.workforceEngineService.updateEngagementRunStatus)
    storeDeliverableMock = vi.mocked(deliverablesMod.deliverablesService.storeDeliverable)
  })

  function setupHappyPath() {
    researchMock.mockResolvedValue({ ok: true, value: { brief: RESEARCH_BRIEF } })
    strategyMock.mockResolvedValue({ ok: true, value: { strategyBrief: STRATEGY_BRIEF } })
    creativeMock.mockResolvedValue({ ok: true, value: { creativeBrief: CREATIVE_BRIEF } })
    videoMock.mockResolvedValue({ ok: true, value: { videoProductionBrief: VIDEO_BRIEF } })
    publishingMock.mockResolvedValue({ ok: true, value: PUBLISHING_JOB })
    approvalMock.mockResolvedValue({ ok: true, value: { approvalDecision: APPROVAL_DECISION } })
    deliveryMock.mockResolvedValue({ ok: true, value: { deliveryPackage: DELIVERY_PACKAGE } })
  }

  it('calls all 7 departments in sequence on happy path', async () => {
    setupHappyPath()
    const { runAIWorkforcePipeline } = await import('./pipeline')
    await runAIWorkforcePipeline(TEST_CTX, TEST_PROFILE, { retryBackoffMs: 0 })

    expect(researchMock).toHaveBeenCalledOnce()
    expect(strategyMock).toHaveBeenCalledOnce()
    expect(creativeMock).toHaveBeenCalledOnce()
    expect(videoMock).toHaveBeenCalledOnce()
    expect(publishingMock).toHaveBeenCalledOnce()
    expect(approvalMock).toHaveBeenCalledOnce()
    expect(deliveryMock).toHaveBeenCalledOnce()
  })

  it('passes profile to research department with brand-researcher preference', async () => {
    setupHappyPath()
    const { runAIWorkforcePipeline } = await import('./pipeline')
    await runAIWorkforcePipeline(TEST_CTX, TEST_PROFILE, { retryBackoffMs: 0 })

    expect(researchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        profile: TEST_PROFILE,
        preferredEmployee: 'brand-researcher',
        engagementRunId: TEST_CTX.engagementRunId,
      })
    )
  })

  it('threads research brief into strategy request', async () => {
    setupHappyPath()
    const { runAIWorkforcePipeline } = await import('./pipeline')
    await runAIWorkforcePipeline(TEST_CTX, TEST_PROFILE, { retryBackoffMs: 0 })

    expect(strategyMock).toHaveBeenCalledWith(
      expect.objectContaining({ researchBrief: RESEARCH_BRIEF })
    )
  })

  it('stores a deliverable with business name in title on completion', async () => {
    setupHappyPath()
    const { runAIWorkforcePipeline } = await import('./pipeline')
    await runAIWorkforcePipeline(TEST_CTX, TEST_PROFILE, { retryBackoffMs: 0 })

    expect(storeDeliverableMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'report',
        title: expect.stringContaining('Sunshine HVAC'),
        engagementRunId: TEST_CTX.engagementRunId,
      })
    )
  })

  it('marks engagement run as completed on success', async () => {
    setupHappyPath()
    const { runAIWorkforcePipeline } = await import('./pipeline')
    await runAIWorkforcePipeline(TEST_CTX, TEST_PROFILE, { retryBackoffMs: 0 })

    expect(updateStatusMock).toHaveBeenCalledWith(expect.objectContaining({ status: 'completed' }))
  })

  it('records progress memories for each completed step', async () => {
    setupHappyPath()
    const { runAIWorkforcePipeline } = await import('./pipeline')
    await runAIWorkforcePipeline(TEST_CTX, TEST_PROFILE, { retryBackoffMs: 0 })

    const calls = storeMemoryMock.mock.calls
    const completedSteps = calls
      .map((c) => c[0].memory.content)
      .filter((c) => (c as { status: string }).status === 'completed')
      .map((c) => (c as { step: string }).step)

    expect(completedSteps).toContain('research')
    expect(completedSteps).toContain('strategy')
    expect(completedSteps).toContain('delivery')
  })

  it('stops pipeline and marks run failed when research fails', async () => {
    researchMock.mockResolvedValue({
      ok: false,
      error: { code: 'PROVIDER_NOT_CONFIGURED', message: 'No provider', retriable: false },
    })
    const { runAIWorkforcePipeline } = await import('./pipeline')
    await runAIWorkforcePipeline(TEST_CTX, TEST_PROFILE, { retryBackoffMs: 0 })

    expect(strategyMock).not.toHaveBeenCalled()
    expect(updateStatusMock).toHaveBeenCalledWith(expect.objectContaining({ status: 'failed' }))
  })

  it('stops pipeline at strategy and marks failed when strategy returns no brief', async () => {
    researchMock.mockResolvedValue({ ok: true, value: { brief: RESEARCH_BRIEF } })
    strategyMock.mockResolvedValue({ ok: true, value: { strategyBrief: undefined } })

    const { runAIWorkforcePipeline } = await import('./pipeline')
    await runAIWorkforcePipeline(TEST_CTX, TEST_PROFILE, { retryBackoffMs: 0 })

    expect(creativeMock).not.toHaveBeenCalled()
    expect(updateStatusMock).toHaveBeenCalledWith(expect.objectContaining({ status: 'failed' }))
  })

  it('records runId in relevanceScope of progress memories', async () => {
    setupHappyPath()
    const { runAIWorkforcePipeline } = await import('./pipeline')
    await runAIWorkforcePipeline(TEST_CTX, TEST_PROFILE, { retryBackoffMs: 0 })

    const firstProgressCall = storeMemoryMock.mock.calls[1]
    expect(firstProgressCall[0].memory.relevanceScope).toContain(TEST_CTX.engagementRunId)
  })

  // ── Video step is non-fatal (Milestone 6.1) ─────────────────────────────────

  it('continues to publishing when video plan generation fails', async () => {
    setupHappyPath()
    videoMock.mockResolvedValue({
      ok: false,
      error: { code: 'PROVIDER_NOT_CONFIGURED', message: 'No provider', retriable: false },
    })
    const { runAIWorkforcePipeline } = await import('./pipeline')
    await runAIWorkforcePipeline(TEST_CTX, TEST_PROFILE, { retryBackoffMs: 0 })

    expect(publishingMock).toHaveBeenCalledOnce()
    expect(approvalMock).toHaveBeenCalledOnce()
    expect(deliveryMock).toHaveBeenCalledOnce()
  })

  it('marks the run completed even when video is skipped', async () => {
    setupHappyPath()
    videoMock.mockResolvedValue({
      ok: false,
      error: { code: 'PROVIDER_NOT_CONFIGURED', message: 'No provider', retriable: false },
    })
    const { runAIWorkforcePipeline } = await import('./pipeline')
    await runAIWorkforcePipeline(TEST_CTX, TEST_PROFILE, { retryBackoffMs: 0 })

    expect(updateStatusMock).toHaveBeenCalledWith(expect.objectContaining({ status: 'completed' }))
    expect(updateStatusMock).not.toHaveBeenCalledWith(expect.objectContaining({ status: 'failed' }))
  })

  it('records a skipped progress memory for the video step on failure', async () => {
    setupHappyPath()
    videoMock.mockResolvedValue({
      ok: false,
      error: { code: 'PROVIDER_NOT_CONFIGURED', message: 'No provider', retriable: false },
    })
    const { runAIWorkforcePipeline } = await import('./pipeline')
    await runAIWorkforcePipeline(TEST_CTX, TEST_PROFILE, { retryBackoffMs: 0 })

    const skippedVideo = storeMemoryMock.mock.calls
      .map((c) => c[0].memory.content as { step: string; status: string })
      .find((c) => c.step === 'video' && c.status === 'skipped')
    expect(skippedVideo).toBeDefined()
  })

  it('hands a fallback video brief to publishing when video is skipped', async () => {
    setupHappyPath()
    videoMock.mockResolvedValue({
      ok: false,
      error: { code: 'PROVIDER_NOT_CONFIGURED', message: 'No provider', retriable: false },
    })
    const { runAIWorkforcePipeline } = await import('./pipeline')
    await runAIWorkforcePipeline(TEST_CTX, TEST_PROFILE, { retryBackoffMs: 0 })

    const publishingArg = publishingMock.mock.calls[0][0]
    expect(publishingArg.videoProductionBrief).toBeDefined()
    expect(publishingArg.videoProductionBrief.productionPlan).toContain('skipped')
  })

  // ── Per-department retry & failure surface (Milestone 6.2) ───────────────────

  it('retries a failed department and continues when a later attempt succeeds', async () => {
    setupHappyPath()
    researchMock
      .mockResolvedValueOnce({
        ok: false,
        error: { code: 'TIMEOUT', message: 'Transient timeout', retriable: true },
      })
      .mockResolvedValue({ ok: true, value: { brief: RESEARCH_BRIEF } })

    const { runAIWorkforcePipeline } = await import('./pipeline')
    await runAIWorkforcePipeline(TEST_CTX, TEST_PROFILE, { retryBackoffMs: 0 })

    expect(researchMock).toHaveBeenCalledTimes(2)
    expect(strategyMock).toHaveBeenCalledOnce()
    expect(updateStatusMock).toHaveBeenCalledWith(expect.objectContaining({ status: 'completed' }))
  })

  it('retries a failing department up to the attempt limit before failing the run', async () => {
    researchMock.mockResolvedValue({
      ok: false,
      error: { code: 'PROVIDER_NOT_CONFIGURED', message: 'No provider', retriable: false },
    })
    const { runAIWorkforcePipeline } = await import('./pipeline')
    await runAIWorkforcePipeline(TEST_CTX, TEST_PROFILE, { retryBackoffMs: 0 })

    expect(researchMock).toHaveBeenCalledTimes(3)
    expect(updateStatusMock).toHaveBeenCalledWith(expect.objectContaining({ status: 'failed' }))
    expect(strategyMock).not.toHaveBeenCalled()
  })

  it('calls a department exactly once when it succeeds on the first attempt', async () => {
    setupHappyPath()
    const { runAIWorkforcePipeline } = await import('./pipeline')
    await runAIWorkforcePipeline(TEST_CTX, TEST_PROFILE, { retryBackoffMs: 0 })

    expect(researchMock).toHaveBeenCalledOnce()
  })

  it('retries a mid-pipeline department (publishing) before succeeding', async () => {
    setupHappyPath()
    publishingMock
      .mockResolvedValueOnce({
        ok: false,
        error: { code: 'TIMEOUT', message: 'Rate limited', retriable: true },
      })
      .mockResolvedValue({ ok: true, value: PUBLISHING_JOB })

    const { runAIWorkforcePipeline } = await import('./pipeline')
    await runAIWorkforcePipeline(TEST_CTX, TEST_PROFILE, { retryBackoffMs: 0 })

    expect(publishingMock).toHaveBeenCalledTimes(2)
    expect(approvalMock).toHaveBeenCalledOnce()
    expect(updateStatusMock).toHaveBeenCalledWith(expect.objectContaining({ status: 'completed' }))
  })

  it('retries the video step before skipping it', async () => {
    setupHappyPath()
    videoMock.mockResolvedValue({
      ok: false,
      error: { code: 'PROVIDER_NOT_CONFIGURED', message: 'No provider', retriable: false },
    })
    const { runAIWorkforcePipeline } = await import('./pipeline')
    await runAIWorkforcePipeline(TEST_CTX, TEST_PROFILE, { retryBackoffMs: 0 })

    expect(videoMock).toHaveBeenCalledTimes(3)
    expect(updateStatusMock).toHaveBeenCalledWith(expect.objectContaining({ status: 'completed' }))
  })

  it('records failedAtDepartment on permanent failure', async () => {
    strategyMock.mockResolvedValue({
      ok: false,
      error: { code: 'PROVIDER_NOT_CONFIGURED', message: 'Strategy down', retriable: false },
    })
    researchMock.mockResolvedValue({ ok: true, value: { brief: RESEARCH_BRIEF } })

    const { runAIWorkforcePipeline } = await import('./pipeline')
    await runAIWorkforcePipeline(TEST_CTX, TEST_PROFILE, { retryBackoffMs: 0 })

    const failed = storeMemoryMock.mock.calls
      .map((c) => c[0].memory.content as { status: string; failedAtDepartment?: string })
      .find((c) => c.status === 'failed')
    expect(failed?.failedAtDepartment).toBe('strategy')
  })

  it('records a human-readable failureReason on permanent failure', async () => {
    strategyMock.mockResolvedValue({
      ok: false,
      error: { code: 'PROVIDER_NOT_CONFIGURED', message: 'Strategy down', retriable: false },
    })
    researchMock.mockResolvedValue({ ok: true, value: { brief: RESEARCH_BRIEF } })

    const { runAIWorkforcePipeline } = await import('./pipeline')
    await runAIWorkforcePipeline(TEST_CTX, TEST_PROFILE, { retryBackoffMs: 0 })

    const failed = storeMemoryMock.mock.calls
      .map((c) => c[0].memory.content as { status: string; failureReason?: string })
      .find((c) => c.status === 'failed')
    expect(failed?.failureReason).toBe('Strategy down')
  })

  it('does not mark the run failed when every department eventually succeeds', async () => {
    setupHappyPath()
    creativeMock
      .mockResolvedValueOnce({
        ok: false,
        error: { code: 'TIMEOUT', message: 'blip', retriable: true },
      })
      .mockResolvedValue({ ok: true, value: { creativeBrief: CREATIVE_BRIEF } })

    const { runAIWorkforcePipeline } = await import('./pipeline')
    await runAIWorkforcePipeline(TEST_CTX, TEST_PROFILE, { retryBackoffMs: 0 })

    expect(updateStatusMock).not.toHaveBeenCalledWith(expect.objectContaining({ status: 'failed' }))
  })
})
