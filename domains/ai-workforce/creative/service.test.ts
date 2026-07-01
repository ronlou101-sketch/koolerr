import { describe, expect, it, vi } from 'vitest'
import type { IModelGateway, GatewayResponse } from '@/shared/model-gateway'
import type { ModelProvider } from '@/shared/types'
import { CreativeDepartmentService } from './service'
import { buildCreativePrompt, parseCreativeBrief } from './prompt'
import type { CreativeRequest } from './types'
import type { StrategyBrief } from '../strategy/types'
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

const TEST_STRATEGY_BRIEF: StrategyBrief = {
  brandPositioning:
    "Sunrise Plumbing is Austin's most reliable same-day plumber for homeowners who value transparency.",
  coreMessaging:
    'We fix it right the first time. Same-day service, upfront pricing, licensed professionals.',
  targetAudience: 'Austin homeowners aged 30–55 who need reliable, affordable plumbing.',
  customerPersonas: [
    {
      name: 'The Busy Homeowner',
      description: 'Dual-income family that needs fast, reliable service.',
      painPoints: ['No time to wait', 'Worried about being overcharged'],
      goals: ['Get the problem fixed fast', 'Know the price upfront'],
    },
  ],
  contentPillars: ['Trust & Transparency', 'Education & Tips', 'Social Proof', 'Local Community'],
  monthlyContentCalendar: [
    { week: 1, theme: 'Trust Building', topics: ['Meet the team', 'Testimonial'] },
    { week: 2, theme: 'Education', topics: ['Signs you need a plumber', 'Tips'] },
    { week: 3, theme: 'Social Proof', topics: ['Before and after', 'Review spotlight'] },
    { week: 4, theme: 'Offers & CTAs', topics: ['Free estimate', 'Maintenance plan'] },
  ],
  weeklyPostingSchedule: {
    monday: 'Educational tip',
    tuesday: 'Customer testimonial',
    wednesday: 'Behind-the-scenes',
    thursday: 'Before/after',
    friday: 'Special offer',
  },
  videoConcepts: [
    'Same-day service: call at 8am, fixed by noon',
    '5 signs your pipes need attention',
    'Transparent pricing walkthrough',
  ],
  reelHooks: [
    '"We got the call at 7am and the pipe was fixed before noon…"',
    '"Here\'s what plumbers don\'t want you to know about pricing…"',
    '"Austin homeowners: this ONE thing prevents 80% of emergency calls"',
  ],
  scriptOutlines: [
    'Hook: overflowing pipe → Problem: homeowner panic → Solution: Sunrise → Result: same day',
    'Hook: reveal price upfront → Compare: competitors hide fees → Proof → CTA',
    'Hook: "I thought I needed a full repipe" → Discovery: $50 fix → Trust moment',
  ],
  captionIdeas: [
    "Same-day service is not a promise. It's our standard. #AustinPlumber",
    'We fixed this in 45 minutes. No upselling. No surprises.',
    'Your drain is sending you signals. Are you listening?',
  ],
  ctaLibrary: [
    'Call now for a free estimate',
    'Book online in 60 seconds',
    'Get your drain cleared today',
    'DM us for a free quote',
  ],
  hashtagRecommendations: [
    '#AustinPlumber',
    '#PlumberAustin',
    '#AustinHomeowner',
    '#EmergencyPlumber',
    '#SunrisePlumbing',
  ],
  campaignIdeas: [
    '"Before It Bursts" winter preparedness campaign',
    '"New Home, No Worries" campaign',
    '"5-Star Service" review generation campaign',
  ],
  offerRecommendations: [
    'Free whole-home drain inspection',
    '10% off for first-time customers',
    'Annual maintenance plan: $149/year',
  ],
  creativeDirection:
    'Warm, trustworthy, and professional. Real team members, real homes. Colors: deep blue and gold.',
  productionNotes:
    'All video shot in real Austin homes. Voice-over like a knowledgeable neighbor. Reels 15-30s.',
  successMetrics: [
    'Inbound call volume: +25% in 90 days',
    'Website conversion rate: 4%+',
    'Google review count: +20 in 60 days',
  ],
  generatedAt: new Date('2026-06-30T00:00:00Z'),
  sourceResearchBrief: TEST_RESEARCH_BRIEF,
}

const TEST_REQUEST: CreativeRequest = {
  tenantId: 'tenant_test' as ReturnType<typeof String> as never,
  organizationId: 'org_test' as ReturnType<typeof String> as never,
  workforceId: 'wf_test' as ReturnType<typeof String> as never,
  engagementRunId: 'run_test' as ReturnType<typeof String> as never,
  strategyBrief: TEST_STRATEGY_BRIEF,
}

const VALID_CREATIVE_JSON = JSON.stringify({
  visualStyle:
    'Warm and professional with deep blue and gold tones. Clean cinematography with natural Austin home settings. Authentic, not staged.',
  brandingGuidelines:
    'Logo always in the top-left corner on video. Primary blue (#1B4F8A) for text overlays. Gold accent (#D4A017) for CTAs. Never distort or recolor the logo.',
  avatarDirection:
    'Professional male or female spokesperson in a clean blue polo. Warm, knowledgeable tone — like a trusted neighbor. Direct eye contact. Austin, TX backdrop.',
  voiceDirection:
    'Conversational and confident. Medium pace. Warm and approachable, not corporate. Slight Texas warmth. Clear enunciation on pricing and guarantees.',
  shotList: [
    'Wide establishing shot — Austin residential neighborhood, morning light, 3s',
    'Close-up — plumber hands fixing pipe, focused determination, 2s',
    'Over-shoulder shot — plumber explaining to homeowner, trust moment, 3s',
  ],
  storyboard: [
    'Scene 1: [0-3s] Hook — shot of burst pipe, dramatic but reassuring VO: "We got there in 90 minutes"',
    'Scene 2: [3-10s] Problem — homeowner stress, phone call to Sunrise, dispatcher answers immediately',
    'Scene 3: [10-25s] Solution — technician arrives, explains issue, fixes pipe, shows receipt',
    'Scene 4: [25-30s] CTA — Sunrise logo, phone number, "Call now for a free estimate"',
  ],
  scenePrompts: [
    'Cinematic wide shot of Austin suburban home exterior, morning golden hour, plumber van arriving in driveway, warm neighborhood atmosphere, photorealistic',
    'Close-up macro shot of professional plumber hands fixing copper pipe joint, droplets of water, sharp focus, dramatic side lighting, 4K quality',
    'Medium shot of smiling plumber explaining repair to relieved Austin homeowner at kitchen sink, warm interior lighting, trust and professionalism',
  ],
  imagePrompts: [
    'Professional plumber in Sunrise Plumbing blue polo standing confidently in front of Austin home, golden hour lighting, deep blue and gold brand colors, photorealistic',
    'Before and after split image: left shows burst pipe water damage, right shows clean new pipe installation, bright clean lighting',
    'Close-up of Sunrise Plumbing work van exterior with logo, Austin skyline in background, blue sky, professional photography style',
  ],
  videoPrompts: [
    'Spokesperson script: "Hi, I\'m [Name] from Sunrise Plumbing. Austin homeowners trust us because we show up the same day and never surprise you with hidden fees. Call us now for your free estimate." Deliver in warm, confident tone, direct to camera.',
    'Spokesperson script: "Did you know most plumbing emergencies could have been prevented? Here are the 5 warning signs to look for in your home." Deliver as an educator, use hand gestures naturally.',
    'Spokesperson script: "We just fixed this homeowner\'s pipe in 45 minutes — and saved them $800 compared to what the other company quoted." Deliver with pride and authenticity.',
  ],
  hookVariations: [
    '"We got the call at 7am and had it fixed before noon — here\'s how we do it"',
    '"Most Austin homeowners don\'t know their pipes are about to fail. Here\'s what to look for"',
    '"We showed up when three other plumbers said they couldn\'t — same day, upfront price"',
  ],
  thumbnailIdeas: [
    'Split screen: flooded kitchen left vs. fixed pipe right. Bold text: "45 MINUTES". Blue overlay with gold CTA button. Triggers fear-to-relief emotion.',
    'Smiling plumber holding thumbs up in front of Austin home. Text overlay: "SAME DAY". High contrast. Conveys reliability and local pride.',
    'Close-up of receipt showing $0 hidden fees. Text: "TRANSPARENT PRICING". Gold highlight on the total. Builds trust with budget-conscious homeowners.',
  ],
  bRollIdeas: [
    'Time-lapse of Austin skyline from sunrise to midday — establishes local identity',
    'Slow-motion close-up of water flowing cleanly from repaired tap — symbolizes problem solved',
    'Drone shot flying over Austin residential neighborhood — reinforces local, community focus',
  ],
  musicDirection:
    'Upbeat but professional acoustic guitar with light percussion. 110-120 BPM. Warm Texas feel. Energetic enough to maintain attention, calm enough to build trust. No lyrics.',
  motionGraphics:
    'Clean sans-serif lower thirds in deep blue with white text. Gold animated underline on key claims. Subtle slide-in transitions. Phone number appears in gold in final 5 seconds.',
  callToAction:
    'Call Sunrise Plumbing now — (512) 000-0000. Displayed in bold gold text on deep blue background for final 5 seconds of every video.',
  editingInstructions:
    'Jump cuts every 2-3 seconds to maintain TikTok/Reels pacing. Color grade: warm tones, slightly boosted saturation. Audio: VO at -3dB, music bed at -18dB. Export: 1080x1920 for Reels, 1920x1080 for YouTube.',
  publishingAssets: [
    'Instagram Reel: 1080x1920, 30s, MP4, H.264, for brand awareness and local reach',
    'TikTok video: 1080x1920, 30s, MP4, for discovery and viral hook testing',
    'YouTube Short: 1080x1920, 60s max, MP4, for SEO and long-tail discovery',
  ],
})

// ── Mock gateway factory ───────────────────────────────────────────────────────

function makeGateway(responseContent: string, provider: ModelProvider = 'openai'): IModelGateway {
  return {
    invoke: vi.fn().mockResolvedValue({
      content: responseContent,
      provider,
      model: 'gpt-4o',
      tokensUsed: 2400,
      latencyMs: 240,
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

// ── buildCreativePrompt ───────────────────────────────────────────────────────

describe('buildCreativePrompt()', () => {
  it('includes business name and category from the strategy brief', () => {
    const prompt = buildCreativePrompt(TEST_STRATEGY_BRIEF)
    expect(prompt).toContain('Sunrise Plumbing')
    expect(prompt).toContain('Plumbing Services')
  })

  it('surfaces key strategy sections in the prompt', () => {
    const prompt = buildCreativePrompt(TEST_STRATEGY_BRIEF)
    expect(prompt).toContain('Warm, trustworthy, and professional') // creativeDirection
    expect(prompt).toContain('Trust & Transparency') // contentPillars
    expect(prompt).toContain('Same-day service') // videoConcepts
  })

  it('includes all 17 output field names in the schema', () => {
    const prompt = buildCreativePrompt(TEST_STRATEGY_BRIEF)
    const fields = [
      'visualStyle',
      'brandingGuidelines',
      'avatarDirection',
      'voiceDirection',
      'shotList',
      'storyboard',
      'scenePrompts',
      'imagePrompts',
      'videoPrompts',
      'hookVariations',
      'thumbnailIdeas',
      'bRollIdeas',
      'musicDirection',
      'motionGraphics',
      'callToAction',
      'editingInstructions',
      'publishingAssets',
    ]
    for (const field of fields) {
      expect(prompt).toContain(field)
    }
  })

  it('includes HeyGen and Higgsfield as production targets in the prompt', () => {
    const prompt = buildCreativePrompt(TEST_STRATEGY_BRIEF)
    expect(prompt).toContain('HeyGen')
    expect(prompt).toContain('Higgsfield')
  })
})

// ── parseCreativeBrief ────────────────────────────────────────────────────────

describe('parseCreativeBrief()', () => {
  it('parses a valid JSON response into a CreativeBrief', () => {
    const brief = parseCreativeBrief(VALID_CREATIVE_JSON, TEST_STRATEGY_BRIEF)
    expect(brief.visualStyle).toContain('blue and gold')
    expect(brief.shotList).toHaveLength(3)
    expect(brief.storyboard).toHaveLength(4)
    expect(brief.scenePrompts).toHaveLength(3)
    expect(brief.imagePrompts).toHaveLength(3)
    expect(brief.videoPrompts).toHaveLength(3)
    expect(brief.hookVariations).toHaveLength(3)
    expect(brief.thumbnailIdeas).toHaveLength(3)
    expect(brief.bRollIdeas).toHaveLength(3)
    expect(brief.publishingAssets).toHaveLength(3)
    expect(brief.generatedAt).toBeInstanceOf(Date)
    expect(brief.sourceStrategyBrief).toBe(TEST_STRATEGY_BRIEF)
  })

  it('strips markdown code fences before parsing', () => {
    const wrapped = '```json\n' + VALID_CREATIVE_JSON + '\n```'
    const brief = parseCreativeBrief(wrapped, TEST_STRATEGY_BRIEF)
    expect(brief.visualStyle).toBeTruthy()
  })

  it('throws when response is not valid JSON', () => {
    expect(() =>
      parseCreativeBrief('I cannot generate a creative brief at this time.', TEST_STRATEGY_BRIEF)
    ).toThrow('non-JSON')
  })

  it('throws when a required string field is missing', () => {
    const incomplete = JSON.parse(VALID_CREATIVE_JSON) as Record<string, unknown>
    delete incomplete.visualStyle
    expect(() => parseCreativeBrief(JSON.stringify(incomplete), TEST_STRATEGY_BRIEF)).toThrow(
      'visualStyle'
    )
  })

  it('throws when a required array field is empty', () => {
    const incomplete = JSON.parse(VALID_CREATIVE_JSON) as Record<string, unknown>
    incomplete.shotList = []
    expect(() => parseCreativeBrief(JSON.stringify(incomplete), TEST_STRATEGY_BRIEF)).toThrow(
      'shotList'
    )
  })

  it('throws when videoPrompts is missing', () => {
    const incomplete = JSON.parse(VALID_CREATIVE_JSON) as Record<string, unknown>
    delete incomplete.videoPrompts
    expect(() => parseCreativeBrief(JSON.stringify(incomplete), TEST_STRATEGY_BRIEF)).toThrow(
      'videoPrompts'
    )
  })

  it('throws when scenePrompts is missing', () => {
    const incomplete = JSON.parse(VALID_CREATIVE_JSON) as Record<string, unknown>
    delete incomplete.scenePrompts
    expect(() => parseCreativeBrief(JSON.stringify(incomplete), TEST_STRATEGY_BRIEF)).toThrow(
      'scenePrompts'
    )
  })

  it('throws when callToAction is missing', () => {
    const incomplete = JSON.parse(VALID_CREATIVE_JSON) as Record<string, unknown>
    delete incomplete.callToAction
    expect(() => parseCreativeBrief(JSON.stringify(incomplete), TEST_STRATEGY_BRIEF)).toThrow(
      'callToAction'
    )
  })
})

// ── CreativeDepartmentService ─────────────────────────────────────────────────

describe('CreativeDepartmentService', () => {
  describe('createBrief()', () => {
    it('returns a completed job with a CreativeBrief on success', async () => {
      const service = new CreativeDepartmentService(makeGateway(VALID_CREATIVE_JSON))
      const result = await service.createBrief(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.value.status).toBe('completed')
      expect(result.value.creativeBrief).toBeDefined()
      expect(result.value.creativeBrief!.shotList).toHaveLength(3)
      expect(result.value.creativeBrief!.scenePrompts).toHaveLength(3)
      expect(result.value.strategyBrief).toBe(TEST_STRATEGY_BRIEF)
      expect(result.value.attempts).toBe(1)
    })

    it('records the provider that produced the result', async () => {
      const service = new CreativeDepartmentService(makeGateway(VALID_CREATIVE_JSON, 'openai'))
      const result = await service.createBrief(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.providerId).toBe('openai')
    })

    it('uses the preferred employee when specified', async () => {
      const service = new CreativeDepartmentService(makeGateway(VALID_CREATIVE_JSON))
      const result = await service.createBrief({
        ...TEST_REQUEST,
        preferredEmployee: 'creative-video-director',
      })

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.employeeId).toBe('creative-video-director')
    })

    it('retries on transient failure and succeeds on second attempt', async () => {
      let callCount = 0
      const gateway: IModelGateway = {
        invoke: vi.fn().mockImplementation(async () => {
          callCount++
          if (callCount === 1) throw new Error('upstream timeout')
          return {
            content: VALID_CREATIVE_JSON,
            provider: 'openai' as ModelProvider,
            model: 'gpt-4o',
            tokensUsed: 2400,
            latencyMs: 240,
          }
        }),
        registeredProviders: () => ['openai'],
      }

      const service = new CreativeDepartmentService(gateway)
      const result = await service.createBrief(TEST_REQUEST)

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
            content: VALID_CREATIVE_JSON,
            provider: 'anthropic' as ModelProvider,
            model: 'claude-haiku-4-5-20251001',
            tokensUsed: 2400,
            latencyMs: 240,
          }
        }),
        registeredProviders: () => ['anthropic'],
      }

      const service = new CreativeDepartmentService(gateway)
      const result = await service.createBrief(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.providerId).toBe('anthropic')
    })

    it('returns MAX_RETRIES_EXCEEDED when all providers and retries fail', async () => {
      const service = new CreativeDepartmentService(
        makeFailingGateway('upstream service unavailable')
      )
      const result = await service.createBrief(TEST_REQUEST)

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error.code).toBe('MAX_RETRIES_EXCEEDED')
      expect(result.error.retriable).toBe(false)
    })

    it('returns PROVIDER_NOT_CONFIGURED when no provider is available', async () => {
      const service = new CreativeDepartmentService(
        makeFailingGateway('No provider available. Requested: "openai"')
      )
      const result = await service.createBrief(TEST_REQUEST)

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error.code).toBe('PROVIDER_NOT_CONFIGURED')
    })

    it('returns INVALID_RESPONSE when the provider returns non-JSON', async () => {
      const service = new CreativeDepartmentService(
        makeGateway('I am unable to produce a creative brief.')
      )
      const result = await service.createBrief(TEST_REQUEST)

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error.code).toBe('INVALID_RESPONSE')
    })

    it('preserves the strategy brief on the job', async () => {
      const service = new CreativeDepartmentService(makeGateway(VALID_CREATIVE_JSON))
      const result = await service.createBrief(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.strategyBrief.brandPositioning).toBe(TEST_STRATEGY_BRIEF.brandPositioning)
    })

    it('defaults to creative-director when no preferred employee is set', async () => {
      const service = new CreativeDepartmentService(makeGateway(VALID_CREATIVE_JSON))
      const result = await service.createBrief(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.employeeId).toBe('creative-director')
    })
  })

  describe('getJob()', () => {
    it('returns the job by ID after completion', async () => {
      const service = new CreativeDepartmentService(makeGateway(VALID_CREATIVE_JSON))
      const result = await service.createBrief(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return

      const retrieved = service.getJob(result.value.id)
      expect(retrieved).toBeDefined()
      expect(retrieved!.id).toBe(result.value.id)
      expect(retrieved!.status).toBe('completed')
    })

    it('returns undefined for an unknown job ID', () => {
      const service = new CreativeDepartmentService(makeGateway(VALID_CREATIVE_JSON))
      expect(service.getJob('nonexistent')).toBeUndefined()
    })
  })

  describe('listJobs()', () => {
    it('returns all jobs across multiple requests', async () => {
      const service = new CreativeDepartmentService(makeGateway(VALID_CREATIVE_JSON))

      await service.createBrief(TEST_REQUEST)
      await service.createBrief(TEST_REQUEST)

      expect(service.listJobs()).toHaveLength(2)
    })

    it('returns an empty array when no jobs have been run', () => {
      const service = new CreativeDepartmentService(makeGateway(VALID_CREATIVE_JSON))
      expect(service.listJobs()).toEqual([])
    })
  })
})
