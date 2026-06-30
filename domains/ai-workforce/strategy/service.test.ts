import { describe, expect, it, vi } from 'vitest'
import type { IModelGateway, GatewayResponse } from '@/shared/model-gateway'
import type { ModelProvider } from '@/shared/types'
import { StrategyDepartmentService } from './service'
import { buildStrategyPrompt, parseStrategyBrief } from './prompt'
import type { StrategyRequest } from './types'
import type { ResearchBrief } from '../research/types'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TEST_RESEARCH_BRIEF: ResearchBrief = {
  companyOverview: 'Sunrise Plumbing is a trusted local plumber in Austin, TX.',
  industryOverview: 'The plumbing industry in Austin is growing rapidly.',
  localMarketAnalysis: 'Austin has strong demand for residential plumbing services.',
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
  generatedAt: new Date('2026-06-30T00:00:00Z'),
  sourceProfile: {
    businessName: 'Sunrise Plumbing',
    businessCategory: 'Plumbing Services',
    location: 'Austin, TX',
    website: 'https://sunriseplumbing.com',
  },
}

const TEST_REQUEST: StrategyRequest = {
  tenantId: 'tenant_test' as ReturnType<typeof String> as never,
  organizationId: 'org_test' as ReturnType<typeof String> as never,
  workforceId: 'wf_test' as ReturnType<typeof String> as never,
  engagementRunId: 'run_test' as ReturnType<typeof String> as never,
  researchBrief: TEST_RESEARCH_BRIEF,
}

const VALID_STRATEGY_JSON = JSON.stringify({
  brandPositioning:
    "Sunrise Plumbing is Austin's most reliable same-day plumber for homeowners who value transparency and trust.",
  coreMessaging:
    'We fix it right the first time. Sunrise Plumbing delivers same-day service, upfront pricing, and licensed professionals who treat your home like their own.',
  targetAudience:
    'Austin homeowners aged 30-55 who need reliable, affordable plumbing and value punctuality and transparent pricing.',
  customerPersonas: [
    {
      name: 'The Busy Homeowner',
      description:
        'A dual-income family that needs fast, reliable service without scheduling hassle.',
      painPoints: ['No time to wait all day', 'Worried about being overcharged'],
      goals: ['Get the problem fixed fast', 'Know the price upfront'],
    },
    {
      name: 'The New Homeowner',
      description:
        'Recently purchased their first home and dealing with unexpected plumbing issues.',
      painPoints: ['Unfamiliar with costs', 'Scared of being taken advantage of'],
      goals: ['Find a trustworthy plumber', "Understand what they're paying for"],
    },
  ],
  contentPillars: ['Trust & Transparency', 'Education & Tips', 'Social Proof', 'Local Community'],
  monthlyContentCalendar: [
    {
      week: 1,
      theme: 'Trust Building',
      topics: ['Meet the team', 'License and insurance explainer', 'Customer testimonial'],
    },
    {
      week: 2,
      theme: 'Education',
      topics: ['Signs you need a plumber', 'Maintenance tips', 'Common mistakes'],
    },
    {
      week: 3,
      theme: 'Social Proof',
      topics: ['Before and after', 'Customer review spotlight', 'Case study'],
    },
    {
      week: 4,
      theme: 'Offers & CTAs',
      topics: ['Free estimate promotion', 'Maintenance plan intro', 'Emergency service reminder'],
    },
  ],
  weeklyPostingSchedule: {
    monday: 'Educational tip or FAQ',
    tuesday: 'Customer testimonial or review',
    wednesday: 'Behind-the-scenes or team content',
    thursday: 'Before/after transformation',
    friday: 'Special offer or promotion',
    saturday: 'Community content or local Austin feature',
    sunday: 'Week in review or motivational content',
  },
  videoConcepts: [
    'Same-day service: call at 8am, fixed by noon — real customer story',
    '5 signs your pipes need attention before they burst',
    'Transparent pricing walkthrough: what you pay and why',
  ],
  reelHooks: [
    '"We got the call at 7am and the pipe was fixed before noon…"',
    '"Here\'s what plumbers don\'t want you to know about pricing…"',
    '"Austin homeowners: this ONE thing prevents 80% of emergency calls"',
  ],
  scriptOutlines: [
    'Hook: show overflowing pipe → Problem: homeowner panic → Solution: Sunrise Plumbing arrives → Result: fixed same day',
    'Hook: reveal price upfront → Compare: competitors hide fees → Proof: customer receipt shown → CTA: get your free estimate',
    'Hook: "I thought I needed a full repipe" → Discovery: only needed a $50 fix → Trust moment: honesty saved them money',
  ],
  captionIdeas: [
    "Same-day service is not a promise. It's our standard. 🔧 #AustinPlumber",
    "We fixed this in 45 minutes. No upselling. No surprises. That's the Sunrise way.",
    'Your drain is sending you signals. Are you listening? 👇 Swipe to see the warning signs.',
  ],
  ctaLibrary: [
    'Call now for a free estimate — (512) 000-0000',
    'Book online in 60 seconds at sunriseplumbing.com',
    'Get your drain cleared today — same-day slots available',
    'DM us for a free quote — we respond in minutes',
  ],
  hashtagRecommendations: [
    '#AustinPlumber',
    '#PlumberAustin',
    '#AustinHomeowner',
    '#EmergencyPlumber',
    '#SunrisePlumbing',
  ],
  campaignIdeas: [
    '"Before It Bursts" winter preparedness campaign (October–November)',
    '"New Home, No Worries" campaign targeting recent Austin home buyers',
    '"5-Star Service" review generation campaign with incentive',
  ],
  offerRecommendations: [
    'Free whole-home drain inspection with any service call',
    '10% off for first-time customers (mention this post)',
    'Annual maintenance plan: $149/year for 2 inspections + priority scheduling',
  ],
  creativeDirection:
    'Warm, trustworthy, and professional. Use real team members, real homes, and real customer moments. Avoid stock photography. Colors: deep blue and gold to signal trust and premium quality.',
  productionNotes:
    'All video should be shot in real Austin homes, not studios. Voice-over should sound like a knowledgeable neighbor, not a corporate spokesperson. Reels should be 15-30 seconds. Long-form videos 60-90 seconds maximum.',
  successMetrics: [
    'Inbound call volume: target +25% in 90 days',
    'Website conversion rate: target 4%+ from social traffic',
    'Google review count: target +20 reviews in 60 days',
  ],
})

// ── Mock gateway factory ───────────────────────────────────────────────────────

function makeGateway(responseContent: string, provider: ModelProvider = 'openai'): IModelGateway {
  return {
    invoke: vi.fn().mockResolvedValue({
      content: responseContent,
      provider,
      model: 'gpt-4o',
      tokensUsed: 1200,
      latencyMs: 180,
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

// ── buildStrategyPrompt ───────────────────────────────────────────────────────

describe('buildStrategyPrompt()', () => {
  it('includes business name and location from the research brief', () => {
    const prompt = buildStrategyPrompt(TEST_RESEARCH_BRIEF)
    expect(prompt).toContain('Sunrise Plumbing')
    expect(prompt).toContain('Austin, TX')
  })

  it('surfaces key research sections in the prompt', () => {
    const prompt = buildStrategyPrompt(TEST_RESEARCH_BRIEF)
    expect(prompt).toContain('ABC Plumbing') // competitor
    expect(prompt).toContain('Austin plumber near me') // SEO
    expect(prompt).toContain('Same-day service guarantee') // marketing angle
  })

  it('includes all 18 output field names in the schema', () => {
    const prompt = buildStrategyPrompt(TEST_RESEARCH_BRIEF)
    const fields = [
      'brandPositioning',
      'coreMessaging',
      'targetAudience',
      'customerPersonas',
      'contentPillars',
      'monthlyContentCalendar',
      'weeklyPostingSchedule',
      'videoConcepts',
      'reelHooks',
      'scriptOutlines',
      'captionIdeas',
      'ctaLibrary',
      'hashtagRecommendations',
      'campaignIdeas',
      'offerRecommendations',
      'creativeDirection',
      'productionNotes',
      'successMetrics',
    ]
    for (const field of fields) {
      expect(prompt).toContain(field)
    }
  })
})

// ── parseStrategyBrief ────────────────────────────────────────────────────────

describe('parseStrategyBrief()', () => {
  it('parses a valid JSON response into a StrategyBrief', () => {
    const brief = parseStrategyBrief(VALID_STRATEGY_JSON, TEST_RESEARCH_BRIEF)
    expect(brief.brandPositioning).toContain('Sunrise Plumbing')
    expect(brief.contentPillars).toHaveLength(4)
    expect(brief.customerPersonas).toHaveLength(2)
    expect(brief.monthlyContentCalendar).toHaveLength(4)
    expect(brief.weeklyPostingSchedule.monday).toBeTruthy()
    expect(brief.successMetrics).toHaveLength(3)
    expect(brief.generatedAt).toBeInstanceOf(Date)
    expect(brief.sourceResearchBrief).toBe(TEST_RESEARCH_BRIEF)
  })

  it('strips markdown code fences before parsing', () => {
    const wrapped = '```json\n' + VALID_STRATEGY_JSON + '\n```'
    const brief = parseStrategyBrief(wrapped, TEST_RESEARCH_BRIEF)
    expect(brief.brandPositioning).toBeTruthy()
  })

  it('throws when response is not valid JSON', () => {
    expect(() =>
      parseStrategyBrief('Sorry, I cannot help with that.', TEST_RESEARCH_BRIEF)
    ).toThrow('non-JSON')
  })

  it('throws when a required string field is missing', () => {
    const incomplete = JSON.parse(VALID_STRATEGY_JSON) as Record<string, unknown>
    delete incomplete.brandPositioning
    expect(() => parseStrategyBrief(JSON.stringify(incomplete), TEST_RESEARCH_BRIEF)).toThrow(
      'brandPositioning'
    )
  })

  it('throws when a required array field is empty', () => {
    const incomplete = JSON.parse(VALID_STRATEGY_JSON) as Record<string, unknown>
    incomplete.contentPillars = []
    expect(() => parseStrategyBrief(JSON.stringify(incomplete), TEST_RESEARCH_BRIEF)).toThrow(
      'contentPillars'
    )
  })

  it('throws when customerPersonas is missing', () => {
    const incomplete = JSON.parse(VALID_STRATEGY_JSON) as Record<string, unknown>
    delete incomplete.customerPersonas
    expect(() => parseStrategyBrief(JSON.stringify(incomplete), TEST_RESEARCH_BRIEF)).toThrow(
      'customerPersonas'
    )
  })

  it('throws when weeklyPostingSchedule is missing', () => {
    const incomplete = JSON.parse(VALID_STRATEGY_JSON) as Record<string, unknown>
    delete incomplete.weeklyPostingSchedule
    expect(() => parseStrategyBrief(JSON.stringify(incomplete), TEST_RESEARCH_BRIEF)).toThrow(
      'weeklyPostingSchedule'
    )
  })
})

// ── StrategyDepartmentService ─────────────────────────────────────────────────

describe('StrategyDepartmentService', () => {
  describe('developStrategy()', () => {
    it('returns a completed job with a StrategyBrief on success', async () => {
      const service = new StrategyDepartmentService(makeGateway(VALID_STRATEGY_JSON))
      const result = await service.developStrategy(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.value.status).toBe('completed')
      expect(result.value.strategyBrief).toBeDefined()
      expect(result.value.strategyBrief!.contentPillars).toHaveLength(4)
      expect(result.value.strategyBrief!.customerPersonas).toHaveLength(2)
      expect(result.value.researchBrief).toBe(TEST_RESEARCH_BRIEF)
      expect(result.value.attempts).toBe(1)
    })

    it('records the provider that produced the result', async () => {
      const service = new StrategyDepartmentService(makeGateway(VALID_STRATEGY_JSON, 'openai'))
      const result = await service.developStrategy(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.providerId).toBe('openai')
    })

    it('uses the preferred employee when specified', async () => {
      const service = new StrategyDepartmentService(makeGateway(VALID_STRATEGY_JSON))
      const result = await service.developStrategy({
        ...TEST_REQUEST,
        preferredEmployee: 'senior-copywriter',
      })

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.employeeId).toBe('senior-copywriter')
    })

    it('retries on transient failure and succeeds on second attempt', async () => {
      let callCount = 0
      const gateway: IModelGateway = {
        invoke: vi.fn().mockImplementation(async () => {
          callCount++
          if (callCount === 1) throw new Error('upstream timeout')
          return {
            content: VALID_STRATEGY_JSON,
            provider: 'openai' as ModelProvider,
            model: 'gpt-4o',
            tokensUsed: 1200,
            latencyMs: 200,
          }
        }),
        registeredProviders: () => ['openai'],
      }

      const service = new StrategyDepartmentService(gateway)
      const result = await service.developStrategy(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.attempts).toBe(2)
      expect(result.value.status).toBe('completed')
    })

    it('falls back to anthropic when openai is not configured', async () => {
      let callCount = 0
      const gateway: IModelGateway = {
        invoke: vi.fn().mockImplementation(async (req) => {
          callCount++
          if (req.provider === 'openai') throw new Error('OPENAI_API_KEY is not set')
          return {
            content: VALID_STRATEGY_JSON,
            provider: 'anthropic' as ModelProvider,
            model: 'claude-haiku-4-5-20251001',
            tokensUsed: 1200,
            latencyMs: 200,
          }
        }),
        registeredProviders: () => ['anthropic'],
      }

      const service = new StrategyDepartmentService(gateway)
      const result = await service.developStrategy(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.providerId).toBe('anthropic')
    })

    it('returns MAX_RETRIES_EXCEEDED when all providers and retries fail', async () => {
      const service = new StrategyDepartmentService(
        makeFailingGateway('upstream service unavailable')
      )
      const result = await service.developStrategy(TEST_REQUEST)

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error.code).toBe('MAX_RETRIES_EXCEEDED')
      expect(result.error.retriable).toBe(false)
    })

    it('returns PROVIDER_NOT_CONFIGURED when no provider is available', async () => {
      const service = new StrategyDepartmentService(
        makeFailingGateway('No provider available. Requested: "openai"')
      )
      const result = await service.developStrategy(TEST_REQUEST)

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error.code).toBe('PROVIDER_NOT_CONFIGURED')
    })

    it('returns INVALID_RESPONSE when the provider returns non-JSON', async () => {
      const service = new StrategyDepartmentService(
        makeGateway('I am unable to produce a strategy.')
      )
      const result = await service.developStrategy(TEST_REQUEST)

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error.code).toBe('INVALID_RESPONSE')
    })

    it('preserves the research brief on the job', async () => {
      const service = new StrategyDepartmentService(makeGateway(VALID_STRATEGY_JSON))
      const result = await service.developStrategy(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.researchBrief.companyOverview).toBe(TEST_RESEARCH_BRIEF.companyOverview)
    })
  })

  describe('getJob()', () => {
    it('returns the job by ID after completion', async () => {
      const service = new StrategyDepartmentService(makeGateway(VALID_STRATEGY_JSON))
      const result = await service.developStrategy(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return

      const retrieved = service.getJob(result.value.id)
      expect(retrieved).toBeDefined()
      expect(retrieved!.id).toBe(result.value.id)
      expect(retrieved!.status).toBe('completed')
    })

    it('returns undefined for an unknown job ID', () => {
      const service = new StrategyDepartmentService(makeGateway(VALID_STRATEGY_JSON))
      expect(service.getJob('nonexistent')).toBeUndefined()
    })
  })

  describe('listJobs()', () => {
    it('returns all jobs across multiple requests', async () => {
      const service = new StrategyDepartmentService(makeGateway(VALID_STRATEGY_JSON))

      await service.developStrategy(TEST_REQUEST)
      await service.developStrategy(TEST_REQUEST)

      expect(service.listJobs()).toHaveLength(2)
    })

    it('returns an empty array when no jobs have been run', () => {
      const service = new StrategyDepartmentService(makeGateway(VALID_STRATEGY_JSON))
      expect(service.listJobs()).toEqual([])
    })
  })
})
