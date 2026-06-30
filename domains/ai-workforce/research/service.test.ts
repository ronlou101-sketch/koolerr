import { describe, expect, it, vi } from 'vitest'
import type { IModelGateway, GatewayResponse } from '@/shared/model-gateway'
import type { ModelProvider } from '@/shared/types'
import { ResearchDepartmentService } from './service'
import { buildResearchPrompt, parseResearchBrief } from './prompt'
import type { BusinessProfile, ResearchRequest } from './types'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TEST_PROFILE: BusinessProfile = {
  businessName: 'Sunrise Plumbing',
  businessCategory: 'Plumbing Services',
  location: 'Austin, TX',
  website: 'https://sunriseplumbing.com',
  serviceArea: 'Greater Austin Area',
}

const TEST_REQUEST: ResearchRequest = {
  tenantId: 'tenant_test' as ReturnType<typeof String> as never,
  organizationId: 'org_test' as ReturnType<typeof String> as never,
  workforceId: 'wf_test' as ReturnType<typeof String> as never,
  engagementRunId: 'run_test' as ReturnType<typeof String> as never,
  profile: TEST_PROFILE,
}

const VALID_BRIEF_JSON = JSON.stringify({
  companyOverview: 'Sunrise Plumbing is a trusted local plumber in Austin, TX.',
  industryOverview: 'The plumbing industry in Austin is growing.',
  localMarketAnalysis: 'Austin has strong demand for residential plumbing.',
  competitorAnalysis: ['ABC Plumbing', 'Quick Fix Plumbers', 'Austin Drain Pros'],
  customerPainPoints: ['High prices', 'Long wait times', 'Unreliable scheduling'],
  frequentlyAskedQuestions: [
    'How much does a pipe repair cost?',
    'Do you offer emergency services?',
    'Are you licensed?',
  ],
  seoOpportunities: ['Austin plumber near me', 'emergency plumber Austin', 'pipe repair Austin'],
  highPerformingContentTopics: [
    'How to prevent pipe bursts in winter',
    'Signs you need a plumber',
    'DIY vs professional plumbing',
  ],
  trendingSocialMediaIdeas: [
    'Before/after pipe repair videos',
    'Customer testimonial clips',
    'Plumbing tip of the week',
  ],
  recommendedMarketingAngles: [
    'Same-day service guarantee',
    'Family-owned and trusted',
    'Transparent pricing',
  ],
  recommendedOffers: ['Free estimate', '10% off first service', 'Annual maintenance plan'],
  recommendedCallsToAction: [
    'Call now for a free estimate',
    'Book online in 60 seconds',
    'Get your drain cleared today',
  ],
})

// ── Mock gateway factory ───────────────────────────────────────────────────────

function makeGateway(responseContent: string, provider: ModelProvider = 'manus'): IModelGateway {
  return {
    invoke: vi.fn().mockResolvedValue({
      content: responseContent,
      provider,
      model: 'manus-research-1',
      tokensUsed: 500,
      latencyMs: 120,
    } satisfies GatewayResponse),
    registeredProviders: () => [provider],
  }
}

function makeFailingGateway(error: string): IModelGateway {
  return {
    invoke: vi.fn().mockRejectedValue(new Error(error)),
    registeredProviders: () => [],
  }
}

// ── buildResearchPrompt ───────────────────────────────────────────────────────

describe('buildResearchPrompt()', () => {
  it('includes all required business profile fields', () => {
    const prompt = buildResearchPrompt(TEST_PROFILE)
    expect(prompt).toContain('Sunrise Plumbing')
    expect(prompt).toContain('Plumbing Services')
    expect(prompt).toContain('Austin, TX')
    expect(prompt).toContain('sunriseplumbing.com')
    expect(prompt).toContain('Greater Austin Area')
  })

  it('omits optional fields when not provided', () => {
    const minimal: BusinessProfile = {
      businessName: 'Test Co',
      businessCategory: 'Retail',
      location: 'Dallas, TX',
    }
    const prompt = buildResearchPrompt(minimal)
    expect(prompt).not.toContain('Website:')
    expect(prompt).not.toContain('Service Area:')
  })

  it('includes all 12 output field names', () => {
    const prompt = buildResearchPrompt(TEST_PROFILE)
    const fields = [
      'companyOverview',
      'industryOverview',
      'localMarketAnalysis',
      'competitorAnalysis',
      'customerPainPoints',
      'frequentlyAskedQuestions',
      'seoOpportunities',
      'highPerformingContentTopics',
      'trendingSocialMediaIdeas',
      'recommendedMarketingAngles',
      'recommendedOffers',
      'recommendedCallsToAction',
    ]
    for (const field of fields) {
      expect(prompt).toContain(field)
    }
  })
})

// ── parseResearchBrief ────────────────────────────────────────────────────────

describe('parseResearchBrief()', () => {
  it('parses a valid JSON response into a ResearchBrief', () => {
    const brief = parseResearchBrief(VALID_BRIEF_JSON, TEST_PROFILE)
    expect(brief.companyOverview).toContain('Sunrise Plumbing')
    expect(brief.competitorAnalysis).toHaveLength(3)
    expect(brief.seoOpportunities).toHaveLength(3)
    expect(brief.sourceProfile).toEqual(TEST_PROFILE)
    expect(brief.generatedAt).toBeInstanceOf(Date)
  })

  it('strips markdown code fences before parsing', () => {
    const wrapped = '```json\n' + VALID_BRIEF_JSON + '\n```'
    const brief = parseResearchBrief(wrapped, TEST_PROFILE)
    expect(brief.companyOverview).toBeTruthy()
  })

  it('throws when response is not valid JSON', () => {
    expect(() => parseResearchBrief('This is plain text, not JSON.', TEST_PROFILE)).toThrow(
      'non-JSON'
    )
  })

  it('throws when a required string field is missing', () => {
    const incomplete = JSON.parse(VALID_BRIEF_JSON) as Record<string, unknown>
    delete incomplete.companyOverview
    expect(() => parseResearchBrief(JSON.stringify(incomplete), TEST_PROFILE)).toThrow(
      'companyOverview'
    )
  })

  it('throws when a required array field is empty', () => {
    const incomplete = JSON.parse(VALID_BRIEF_JSON) as Record<string, unknown>
    incomplete.competitorAnalysis = []
    expect(() => parseResearchBrief(JSON.stringify(incomplete), TEST_PROFILE)).toThrow(
      'competitorAnalysis'
    )
  })
})

// ── ResearchDepartmentService ─────────────────────────────────────────────────

describe('ResearchDepartmentService', () => {
  describe('conductResearch()', () => {
    it('returns a completed job with a ResearchBrief on success', async () => {
      const service = new ResearchDepartmentService(makeGateway(VALID_BRIEF_JSON))
      const result = await service.conductResearch(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.value.status).toBe('completed')
      expect(result.value.brief).toBeDefined()
      expect(result.value.brief!.competitorAnalysis).toHaveLength(3)
      expect(result.value.profile).toEqual(TEST_PROFILE)
      expect(result.value.attempts).toBe(1)
    })

    it('records the provider that produced the result', async () => {
      const service = new ResearchDepartmentService(makeGateway(VALID_BRIEF_JSON, 'manus'))
      const result = await service.conductResearch(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.providerId).toBe('manus')
    })

    it('uses the preferred employee when specified', async () => {
      const service = new ResearchDepartmentService(makeGateway(VALID_BRIEF_JSON))
      const result = await service.conductResearch({
        ...TEST_REQUEST,
        preferredEmployee: 'brand-researcher',
      })

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.employeeId).toBe('brand-researcher')
    })

    it('retries on transient failure and succeeds on second attempt', async () => {
      let callCount = 0
      const gateway: IModelGateway = {
        invoke: vi.fn().mockImplementation(async () => {
          callCount++
          if (callCount === 1) throw new Error('upstream timeout')
          return {
            content: VALID_BRIEF_JSON,
            provider: 'manus' as ModelProvider,
            model: 'manus-research-1',
            tokensUsed: 500,
            latencyMs: 100,
          }
        }),
        registeredProviders: () => ['manus'],
      }

      const service = new ResearchDepartmentService(gateway)
      const result = await service.conductResearch(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.attempts).toBe(2)
      expect(result.value.status).toBe('completed')
    })

    it('falls back to OpenAI when Manus is not configured', async () => {
      let callCount = 0
      const gateway: IModelGateway = {
        invoke: vi.fn().mockImplementation(async (req) => {
          callCount++
          if (req.provider === 'manus') throw new Error('MANUS_API_KEY is not set')
          return {
            content: VALID_BRIEF_JSON,
            provider: 'openai' as ModelProvider,
            model: 'gpt-4o',
            tokensUsed: 500,
            latencyMs: 100,
          }
        }),
        registeredProviders: () => ['openai'],
      }

      const service = new ResearchDepartmentService(gateway)
      const result = await service.conductResearch(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.providerId).toBe('openai')
    })

    it('returns MAX_RETRIES_EXCEEDED when all providers and retries fail', async () => {
      const service = new ResearchDepartmentService(
        makeFailingGateway('upstream service unavailable')
      )
      const result = await service.conductResearch(TEST_REQUEST)

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error.code).toBe('MAX_RETRIES_EXCEEDED')
      expect(result.error.retriable).toBe(false)
    })

    it('returns PROVIDER_NOT_CONFIGURED when no provider is available', async () => {
      const service = new ResearchDepartmentService(
        makeFailingGateway('No provider available. Requested: "manus"')
      )
      const result = await service.conductResearch(TEST_REQUEST)

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error.code).toBe('PROVIDER_NOT_CONFIGURED')
    })

    it('returns INVALID_RESPONSE when the provider returns non-JSON', async () => {
      const service = new ResearchDepartmentService(
        makeGateway('I am sorry, I cannot help with that.')
      )
      const result = await service.conductResearch(TEST_REQUEST)

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error.code).toBe('INVALID_RESPONSE')
    })
  })

  describe('getJob()', () => {
    it('returns the job by ID after completion', async () => {
      const service = new ResearchDepartmentService(makeGateway(VALID_BRIEF_JSON))
      const result = await service.conductResearch(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return

      const retrieved = service.getJob(result.value.id)
      expect(retrieved).toBeDefined()
      expect(retrieved!.id).toBe(result.value.id)
      expect(retrieved!.status).toBe('completed')
    })

    it('returns undefined for an unknown job ID', () => {
      const service = new ResearchDepartmentService(makeGateway(VALID_BRIEF_JSON))
      expect(service.getJob('nonexistent')).toBeUndefined()
    })
  })

  describe('listJobs()', () => {
    it('returns all jobs across multiple requests', async () => {
      const service = new ResearchDepartmentService(makeGateway(VALID_BRIEF_JSON))

      await service.conductResearch(TEST_REQUEST)
      await service.conductResearch({
        ...TEST_REQUEST,
        profile: { ...TEST_PROFILE, businessName: 'Other Co' },
      })

      expect(service.listJobs()).toHaveLength(2)
    })

    it('returns an empty array when no jobs have been run', () => {
      const service = new ResearchDepartmentService(makeGateway(VALID_BRIEF_JSON))
      expect(service.listJobs()).toEqual([])
    })
  })
})
