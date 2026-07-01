import { describe, expect, it, vi } from 'vitest'
import type { IModelGateway, GatewayResponse } from '@/shared/model-gateway'
import type { ModelProvider } from '@/shared/types'
import { PublishingDepartmentService } from './service'
import { buildPublishingPrompt, parsePublishingPackages } from './prompt'
import type { PublishingRequest } from './types'
import { SUPPORTED_PLATFORMS } from './types'
import type { VideoProductionBrief } from '../video-production/types'
import type { CreativeBrief } from '../creative/types'
import type { StrategyBrief } from '../strategy/types'
import type { ResearchBrief } from '../research/types'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TEST_RESEARCH_BRIEF: ResearchBrief = {
  companyOverview: 'Sunrise Plumbing is a trusted local plumber in Austin, TX.',
  industryOverview: 'The plumbing industry in Austin is growing rapidly.',
  localMarketAnalysis: 'Austin has strong demand for residential plumbing services.',
  competitorAnalysis: ['ABC Plumbing', 'Quick Fix Plumbers'],
  customerPainPoints: ['High prices', 'Long wait times'],
  frequentlyAskedQuestions: ['How much does a repair cost?', 'Do you offer emergency services?'],
  seoOpportunities: ['Austin plumber near me', 'emergency plumber Austin'],
  highPerformingContentTopics: ['How to prevent pipe bursts', 'Signs you need a plumber'],
  trendingSocialMediaIdeas: ['Before/after pipe repair videos', 'Customer testimonial clips'],
  recommendedMarketingAngles: ['Same-day service guarantee', 'Transparent pricing'],
  recommendedOffers: ['Free estimate', '10% off first service'],
  recommendedCallsToAction: ['Call now for a free estimate', 'Book online in 60 seconds'],
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
  coreMessaging: 'We fix it right the first time. Same-day service, upfront pricing.',
  targetAudience: 'Austin homeowners aged 30–55.',
  customerPersonas: [
    {
      name: 'The Busy Homeowner',
      description: 'Dual-income family that needs fast, reliable service.',
      painPoints: ['No time to wait'],
      goals: ['Get the problem fixed fast'],
    },
  ],
  contentPillars: ['Trust', 'Education', 'Social Proof'],
  monthlyContentCalendar: [{ week: 1, theme: 'Trust Building', topics: ['Meet the team'] }],
  weeklyPostingSchedule: { monday: 'Educational tip', tuesday: 'Testimonial' },
  videoConcepts: ['Same-day service story', '5 warning signs'],
  reelHooks: ['"Fixed before noon…"', '"What plumbers hide…"'],
  scriptOutlines: ['Hook → Problem → Solution → CTA'],
  captionIdeas: ['Same-day is our standard. #AustinPlumber', 'Fixed in 45 minutes.'],
  ctaLibrary: ['Call now for a free estimate', 'Book online in 60 seconds'],
  hashtagRecommendations: ['#AustinPlumber', '#PlumberAustin', '#SunrisePlumbing'],
  campaignIdeas: ['"Before It Bursts" campaign'],
  offerRecommendations: ['Free inspection', '10% off first service'],
  creativeDirection: 'Warm, trustworthy, professional. Deep blue and gold.',
  productionNotes: 'Real Austin homes. 15-30s reels.',
  successMetrics: ['Inbound calls +25%', 'Conversion rate 4%+'],
  generatedAt: new Date('2026-06-30T00:00:00Z'),
  sourceResearchBrief: TEST_RESEARCH_BRIEF,
}

const TEST_CREATIVE_BRIEF: CreativeBrief = {
  visualStyle: 'Warm professional with deep blue and gold tones.',
  brandingGuidelines: 'Logo top-left. Blue (#1B4F8A) for text. Gold (#D4A017) for CTAs.',
  avatarDirection: 'Blue polo spokesperson. Warm neighbor tone.',
  voiceDirection: 'Conversational and confident. Medium pace.',
  shotList: ['Wide establishing shot', 'Close-up pipe repair', 'Over-shoulder explanation'],
  storyboard: ['Scene 1: Hook', 'Scene 2: Problem', 'Scene 3: Solution', 'Scene 4: CTA'],
  scenePrompts: ['Austin home exterior', 'Pipe repair close-up', 'Plumber and homeowner'],
  imagePrompts: ['Plumber in blue polo', 'Before/after split', 'Work van with logo'],
  videoPrompts: ['Spokesperson intro', 'Warning signs', '45-minute fix story'],
  hookVariations: ['"Fixed before noon"', '"Pipes about to fail"', '"We showed up"'],
  thumbnailIdeas: ['45 MINUTES split screen', 'SAME DAY plumber', 'TRANSPARENT PRICING receipt'],
  bRollIdeas: ['Austin skyline time-lapse', 'Slow-motion repaired tap', 'Drone neighborhood'],
  musicDirection: 'Upbeat acoustic guitar, 110-120 BPM.',
  motionGraphics: 'Clean sans-serif lower thirds in deep blue.',
  callToAction: 'Call Sunrise Plumbing — (512) 000-0000.',
  editingInstructions: 'Jump cuts every 2-3s. Warm colour grade.',
  publishingAssets: ['Instagram Reel: 1080x1920', 'TikTok: 1080x1920', 'YouTube Short: 1080x1920'],
  generatedAt: new Date('2026-06-30T00:00:00Z'),
  sourceStrategyBrief: TEST_STRATEGY_BRIEF,
}

const TEST_VIDEO_BRIEF: VideoProductionBrief = {
  productionPlan:
    'Produce three Sunrise Plumbing video assets: hero Reel, TikTok variant, YouTube Short.',
  renderSettings: '1080x1920 portrait, H.264, 30fps, CRF 18.',
  estimatedRuntime: '4h 30m total: HeyGen 1h 15m, Higgsfield 1h 45m, post-processing 1h 30m.',
  renderQueue: [
    'Job 1: HeyGen — spokesperson intro, 30s, HIGH priority',
    'Job 2: Higgsfield — Austin neighborhood, 3s loop, HIGH priority',
    'Job 3: ElevenLabs — voice-over track A, 12s, MEDIUM priority',
  ],
  sceneTimeline: [
    'Scene 1: [0:00-0:03] Hook — HeyGen avatar, voice-over track A',
    'Scene 2: [0:03-0:10] Problem — Higgsfield B-roll, music bed',
    'Scene 3: [0:10-0:25] Solution — HeyGen spokesperson, Higgsfield overlay',
    'Scene 4: [0:25-0:30] CTA — logo, phone number',
  ],
  avatarAssignments: [
    'Scene 1&3: avatar-sunrise-blue-polo, confident warm delivery',
    'Scene 4: same avatar, pointing to phone number',
    'TikTok version: avatar-sunrise-casual, faster pacing',
  ],
  voiceAssignments: [
    'Track A: warm-texas-male, hook text, pace 0.95',
    'Track B: warm-texas-male, solution text, pace 1.0',
    'Track C: warm-texas-male, CTA text, pace 0.9 enthusiastic',
  ],
  cameraMovements: [
    'Scene 1: static wide 2s then slow push-in 20% zoom',
    'Scene 2: slow pan right 0.3x speed',
    'Scene 3: handheld slight shake then smooth cut to static',
  ],
  motionEffects: [
    '"SAME DAY SERVICE" caption slide-in from left at 0:00',
    '"UPFRONT PRICING" lower third slide-up at 0:12',
    'Phone number type-on at 0:26',
  ],
  transitions: [
    'Scene 1→2: J-cut at 0:03',
    'Scene 2→3: cross dissolve 12 frames',
    'Scene 3→4: hard cut at 0:25 on music accent',
  ],
  captionTimeline: [
    'Caption 1: [0:00-0:03] SAME DAY SERVICE — center-top, 60px bold white',
    'Caption 2: [0:10-0:20] Fixed in 45 Minutes — lower third, Sunrise blue bar',
    'Caption 3: [0:25-0:30] Call (512) 000-0000 — center gold typewriter',
  ],
  bRollTimeline: [
    'B-roll 1: [0:00-0:03] burst pipe overlay 50% opacity',
    'B-roll 2: [0:03-0:10] Austin neighborhood full screen',
    'B-roll 3: [0:10-0:20] pipe repair close-up cutaway 5s',
  ],
  musicTimeline: [
    'Cue 1: [0:00-0:30] acoustic guitar at -18dB throughout',
    'Cue 2: [0:25-0:30] music swell +4dB under CTA',
    'Cue 3: [0:29-0:30] final guitar strum accent at -12dB',
  ],
  assetManifest: [
    'spokesperson-hero-30s.mp4 — HeyGen export, 1080x1920, 30fps',
    'broll-package-higgsfield.zip — 3 clips at 1080x1920',
    'voiceover-package-elevenlabs.zip — 3 tracks WAV 44.1kHz',
  ],
  qualityChecklist: [
    'QC-001: Brand colours match #1B4F8A and #D4A017',
    'QC-002: Logo top-left, min 48px height, no distortion',
    'QC-003: Audio VO at -3dBFS, music at -18dBFS, -14 LUFS',
  ],
  exportTargets: [
    'sunrise-plumbing-reel-v1.mp4 — Instagram Reel, 1080x1920, 30fps, max 90MB',
    'sunrise-plumbing-tiktok-v1.mp4 — TikTok, 1080x1920, 30fps, max 72MB',
    'sunrise-plumbing-short-v1.mp4 — YouTube Short, 1080x1920, 30fps, max 256MB',
  ],
  approvalChecklist: [
    'Approval 1: Creative Director brand alignment review',
    'Approval 2: Business owner script and claim accuracy',
    'Approval 3: QA Lead technical sign-off',
  ],
  generatedAt: new Date('2026-06-30T00:00:00Z'),
  sourceCreativeBrief: TEST_CREATIVE_BRIEF,
}

const TEST_REQUEST: PublishingRequest = {
  tenantId: 'tenant_test' as ReturnType<typeof String> as never,
  organizationId: 'org_test' as ReturnType<typeof String> as never,
  workforceId: 'wf_test' as ReturnType<typeof String> as never,
  engagementRunId: 'run_test' as ReturnType<typeof String> as never,
  videoProductionBrief: TEST_VIDEO_BRIEF,
}

function makePackage(platform: string) {
  return {
    platform,
    title: `Sunrise Plumbing — Same-Day Service (${platform})`,
    caption: `We got the call at 7am and had it fixed before noon. That's the Sunrise standard. #AustinPlumber`,
    hashtags: ['#AustinPlumber', '#SunrisePlumbing', '#SameDayService'],
    callToAction: 'Call (512) 000-0000 for a free estimate',
    thumbnailReference: 'thumbnail-same-day-01.jpg',
    videoReference: `sunrise-plumbing-${platform}-v1.mp4`,
    publishDate: '2026-07-08',
    publishTime: '09:00',
    timezone: 'America/Chicago',
    audience: `Austin homeowners 30-55 interested in home services (${platform} targeting)`,
    category: 'Home Services',
    tags: ['plumbing', 'austin', 'home-services'],
    schedulingInstructions: `Schedule on ${platform} for Tuesday 9am CST for peak engagement`,
    publishingChecklist: [
      `Verify video renders correctly on ${platform}`,
      'Confirm caption character limit is not exceeded',
      'Approve thumbnail before scheduling',
    ],
    platformMetadata: `{"platform":"${platform}","ad_account_id":"act_123456","page_id":"789","targeting":{"location":"Austin TX","age_min":30,"age_max":55}}`,
    approvalRequired: true,
    deliveryAssets: [`sunrise-plumbing-${platform}-v1.mp4`, 'thumbnail-same-day-01.jpg'],
  }
}

const VALID_PUBLISHING_JSON = JSON.stringify({
  packages: [
    {
      ...makePackage('facebook'),
      title: 'Sunrise Plumbing — Same-Day Plumbing Service in Austin, TX',
      caption: `We got the call at 7am and had it fixed before noon. That's the Sunrise Plumbing standard — same-day service, upfront pricing, and a team you can trust.\n\nIf you're an Austin homeowner dealing with a plumbing emergency or just need a reliable professional, we've got you covered.\n\n📞 Call (512) 000-0000 for your FREE estimate.\n\nComment "ESTIMATE" below and we'll reach out!`,
    },
    {
      ...makePackage('instagram'),
      caption: `Same-day. Every time. 🔧\n\nGot the call at 7am. Fixed before noon. That's how we do it at Sunrise Plumbing.\n\nUpfront pricing. No surprises. Austin's most trusted plumber.\n\n📞 (512) 000-0000 — link in bio for your free estimate`,
      videoReference: 'sunrise-plumbing-reel-v1.mp4',
    },
    {
      ...makePackage('tiktok'),
      caption: `We showed up when 3 other plumbers said they couldn't 🛠️ #AustinPlumber #SameDay #Plumbing`,
      hashtags: ['#AustinPlumber', '#SameDay', '#Plumbing'],
      videoReference: 'sunrise-plumbing-tiktok-v1.mp4',
    },
    {
      ...makePackage('youtube-shorts'),
      title: "We Fixed This Austin Home's Pipe in 45 Minutes #Shorts",
      caption: `Same-day plumbing service in Austin, TX. Sunrise Plumbing shows up when others won't.\n\n🔧 Call (512) 000-0000 for a FREE estimate\n🌐 sunriseplumbing.com\n\n#AustinPlumber #PlumbingTips #HomeRepair #Shorts`,
      videoReference: 'sunrise-plumbing-short-v1.mp4',
    },
    {
      ...makePackage('linkedin'),
      title: 'How Sunrise Plumbing Delivers Same-Day Service Every Time',
      caption: `At Sunrise Plumbing, same-day service isn't a promise — it's our operating model.\n\nWhen Austin homeowners call us at 7am with an emergency, we show up. That's not luck. That's process.\n\nFor Austin-area property managers and homeowners who need a reliable, licensed plumber: reach out.\n\n📞 (512) 000-0000 | sunriseplumbing.com`,
      hashtags: ['#AustinBusiness', '#HomeServices', '#Plumbing'],
    },
    {
      ...makePackage('google-business-profile'),
      title: 'Same-Day Plumbing Service Available Now in Austin, TX',
      caption: `Need an Austin plumber today? Sunrise Plumbing offers same-day service with upfront pricing and no hidden fees. Licensed, insured, and trusted by Austin homeowners since 2010. Call (512) 000-0000 for your free estimate or book online at sunriseplumbing.com. We service all Austin neighborhoods including South Congress, Mueller, Round Rock, and Cedar Park.`,
      hashtags: [],
      callToAction: 'Call Now',
    },
  ],
})

// ── Mock gateway factory ───────────────────────────────────────────────────────

function makeGateway(responseContent: string, provider: ModelProvider = 'openai'): IModelGateway {
  return {
    invoke: vi.fn().mockResolvedValue({
      content: responseContent,
      provider,
      model: 'gpt-4o',
      tokensUsed: 4800,
      latencyMs: 420,
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

// ── buildPublishingPrompt ─────────────────────────────────────────────────────

describe('buildPublishingPrompt()', () => {
  it('includes business name from the video production brief chain', () => {
    const prompt = buildPublishingPrompt(TEST_VIDEO_BRIEF)
    expect(prompt).toContain('Sunrise Plumbing')
    expect(prompt).toContain('Austin, TX')
  })

  it('surfaces key production and strategy sections in the prompt', () => {
    const prompt = buildPublishingPrompt(TEST_VIDEO_BRIEF)
    expect(prompt).toContain('Same-day service, upfront pricing') // coreMessaging
    expect(prompt).toContain('#AustinPlumber') // hashtagRecommendations
    expect(prompt).toContain('sunrise-plumbing-reel-v1.mp4') // exportTargets
  })

  it('includes all 6 platform names in the prompt', () => {
    const prompt = buildPublishingPrompt(TEST_VIDEO_BRIEF)
    for (const platform of SUPPORTED_PLATFORMS) {
      expect(prompt).toContain(platform)
    }
  })

  it('includes all 18 PublishingPackage field names in the schema', () => {
    const prompt = buildPublishingPrompt(TEST_VIDEO_BRIEF)
    const fields = [
      'platform',
      'title',
      'caption',
      'hashtags',
      'callToAction',
      'thumbnailReference',
      'videoReference',
      'publishDate',
      'publishTime',
      'timezone',
      'audience',
      'category',
      'tags',
      'schedulingInstructions',
      'publishingChecklist',
      'platformMetadata',
      'approvalRequired',
      'deliveryAssets',
    ]
    for (const field of fields) {
      expect(prompt).toContain(field)
    }
  })

  it('includes platform-specific hints for each platform', () => {
    const prompt = buildPublishingPrompt(TEST_VIDEO_BRIEF)
    expect(prompt).toContain('Google Business Profile') // GBP hint label
    expect(prompt).toContain('YouTube Shorts') // YouTube hint label
    expect(prompt).toContain('LinkedIn') // LinkedIn hint label
  })
})

// ── parsePublishingPackages ───────────────────────────────────────────────────

describe('parsePublishingPackages()', () => {
  it('parses a valid JSON response into an array of PublishingPackages', () => {
    const packages = parsePublishingPackages(VALID_PUBLISHING_JSON, TEST_VIDEO_BRIEF)
    expect(packages).toHaveLength(6)
    expect(packages.map((p) => p.platform)).toContain('facebook')
    expect(packages.map((p) => p.platform)).toContain('instagram')
    expect(packages.map((p) => p.platform)).toContain('tiktok')
    expect(packages.map((p) => p.platform)).toContain('youtube-shorts')
    expect(packages.map((p) => p.platform)).toContain('linkedin')
    expect(packages.map((p) => p.platform)).toContain('google-business-profile')
  })

  it('all packages have required string fields', () => {
    const packages = parsePublishingPackages(VALID_PUBLISHING_JSON, TEST_VIDEO_BRIEF)
    for (const pkg of packages) {
      expect(typeof pkg.title).toBe('string')
      expect(typeof pkg.caption).toBe('string')
      expect(typeof pkg.callToAction).toBe('string')
      expect(typeof pkg.publishDate).toBe('string')
      expect(typeof pkg.publishTime).toBe('string')
      expect(typeof pkg.timezone).toBe('string')
      expect(typeof pkg.platformMetadata).toBe('string')
    }
  })

  it('all packages have required array fields', () => {
    const packages = parsePublishingPackages(VALID_PUBLISHING_JSON, TEST_VIDEO_BRIEF)
    for (const pkg of packages) {
      expect(Array.isArray(pkg.publishingChecklist)).toBe(true)
      expect(pkg.publishingChecklist.length).toBeGreaterThan(0)
      expect(Array.isArray(pkg.deliveryAssets)).toBe(true)
      expect(pkg.deliveryAssets.length).toBeGreaterThan(0)
    }
  })

  it('all packages have approvalRequired as a boolean', () => {
    const packages = parsePublishingPackages(VALID_PUBLISHING_JSON, TEST_VIDEO_BRIEF)
    for (const pkg of packages) {
      expect(typeof pkg.approvalRequired).toBe('boolean')
    }
  })

  it('strips markdown code fences before parsing', () => {
    const wrapped = '```json\n' + VALID_PUBLISHING_JSON + '\n```'
    const packages = parsePublishingPackages(wrapped, TEST_VIDEO_BRIEF)
    expect(packages).toHaveLength(6)
  })

  it('throws when response is not valid JSON', () => {
    expect(() =>
      parsePublishingPackages(
        'I cannot produce publishing packages at this time.',
        TEST_VIDEO_BRIEF
      )
    ).toThrow('non-JSON')
  })

  it('throws when packages array is missing', () => {
    expect(() =>
      parsePublishingPackages(JSON.stringify({ result: 'ok' }), TEST_VIDEO_BRIEF)
    ).toThrow('packages')
  })

  it('throws when packages array is empty', () => {
    expect(() =>
      parsePublishingPackages(JSON.stringify({ packages: [] }), TEST_VIDEO_BRIEF)
    ).toThrow('packages')
  })

  it('throws when a package is missing a required string field', () => {
    const bad = JSON.parse(VALID_PUBLISHING_JSON) as { packages: Record<string, unknown>[] }
    delete bad.packages[0].title
    expect(() => parsePublishingPackages(JSON.stringify(bad), TEST_VIDEO_BRIEF)).toThrow('title')
  })

  it('throws when a required non-empty array field is empty', () => {
    const bad = JSON.parse(VALID_PUBLISHING_JSON) as { packages: Record<string, unknown>[] }
    bad.packages[1].publishingChecklist = []
    expect(() => parsePublishingPackages(JSON.stringify(bad), TEST_VIDEO_BRIEF)).toThrow(
      'publishingChecklist'
    )
  })

  it('throws when a required array field is missing entirely', () => {
    const bad = JSON.parse(VALID_PUBLISHING_JSON) as { packages: Record<string, unknown>[] }
    delete bad.packages[0].hashtags
    expect(() => parsePublishingPackages(JSON.stringify(bad), TEST_VIDEO_BRIEF)).toThrow('hashtags')
  })

  it('throws when a package is missing approvalRequired', () => {
    const bad = JSON.parse(VALID_PUBLISHING_JSON) as { packages: Record<string, unknown>[] }
    delete bad.packages[0].approvalRequired
    expect(() => parsePublishingPackages(JSON.stringify(bad), TEST_VIDEO_BRIEF)).toThrow(
      'approvalRequired'
    )
  })
})

// ── PublishingDepartmentService ───────────────────────────────────────────────

describe('PublishingDepartmentService', () => {
  describe('preparePackages()', () => {
    it('returns a completed job with all 6 platform packages on success', async () => {
      const service = new PublishingDepartmentService(makeGateway(VALID_PUBLISHING_JSON))
      const result = await service.preparePackages(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.value.status).toBe('completed')
      expect(result.value.packages).toHaveLength(6)
      expect(result.value.packages.map((p) => p.platform)).toContain('facebook')
      expect(result.value.packages.map((p) => p.platform)).toContain('tiktok')
      expect(result.value.videoProductionBrief).toBe(TEST_VIDEO_BRIEF)
      expect(result.value.attempts).toBe(1)
    })

    it('records the provider that produced the result', async () => {
      const service = new PublishingDepartmentService(makeGateway(VALID_PUBLISHING_JSON, 'openai'))
      const result = await service.preparePackages(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.providerId).toBe('openai')
    })

    it('defaults to delivery-manager when no preferred employee is set', async () => {
      const service = new PublishingDepartmentService(makeGateway(VALID_PUBLISHING_JSON))
      const result = await service.preparePackages(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.employeeId).toBe('delivery-manager')
    })

    it('uses delivery-manager when explicitly specified', async () => {
      const service = new PublishingDepartmentService(makeGateway(VALID_PUBLISHING_JSON))
      const result = await service.preparePackages({
        ...TEST_REQUEST,
        preferredEmployee: 'delivery-manager',
      })

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.employeeId).toBe('delivery-manager')
    })

    it('routes through openai first (delivery-manager primaryProvider is openai)', async () => {
      let capturedProvider: string | undefined
      const gateway: IModelGateway = {
        invoke: vi.fn().mockImplementation(async (req) => {
          capturedProvider = req.provider
          return {
            content: VALID_PUBLISHING_JSON,
            provider: req.provider as ModelProvider,
            model: 'gpt-4o',
            tokensUsed: 4800,
            latencyMs: 420,
          }
        }),
        registeredProviders: () => ['openai'],
      }

      const service = new PublishingDepartmentService(gateway)
      await service.preparePackages(TEST_REQUEST)

      expect(capturedProvider).toBe('openai')
    })

    it('retries on transient failure and succeeds on second attempt', async () => {
      let callCount = 0
      const gateway: IModelGateway = {
        invoke: vi.fn().mockImplementation(async () => {
          callCount++
          if (callCount === 1) throw new Error('upstream timeout')
          return {
            content: VALID_PUBLISHING_JSON,
            provider: 'openai' as ModelProvider,
            model: 'gpt-4o',
            tokensUsed: 4800,
            latencyMs: 420,
          }
        }),
        registeredProviders: () => ['openai'],
      }

      const service = new PublishingDepartmentService(gateway)
      const result = await service.preparePackages(TEST_REQUEST)

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
            content: VALID_PUBLISHING_JSON,
            provider: 'anthropic' as ModelProvider,
            model: 'claude-haiku-4-5-20251001',
            tokensUsed: 4800,
            latencyMs: 420,
          }
        }),
        registeredProviders: () => ['anthropic'],
      }

      const service = new PublishingDepartmentService(gateway)
      const result = await service.preparePackages(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.providerId).toBe('anthropic')
    })

    it('returns MAX_RETRIES_EXCEEDED when all providers and retries fail', async () => {
      const service = new PublishingDepartmentService(
        makeFailingGateway('upstream service unavailable')
      )
      const result = await service.preparePackages(TEST_REQUEST)

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error.code).toBe('MAX_RETRIES_EXCEEDED')
      expect(result.error.retriable).toBe(false)
    })

    it('returns PROVIDER_NOT_CONFIGURED when no provider is available', async () => {
      const service = new PublishingDepartmentService(
        makeFailingGateway('No provider available. Requested: "openai"')
      )
      const result = await service.preparePackages(TEST_REQUEST)

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error.code).toBe('PROVIDER_NOT_CONFIGURED')
    })

    it('returns INVALID_RESPONSE when the provider returns non-JSON', async () => {
      const service = new PublishingDepartmentService(
        makeGateway('I am unable to produce publishing packages.')
      )
      const result = await service.preparePackages(TEST_REQUEST)

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error.code).toBe('INVALID_RESPONSE')
    })

    it('preserves the video production brief on the job', async () => {
      const service = new PublishingDepartmentService(makeGateway(VALID_PUBLISHING_JSON))
      const result = await service.preparePackages(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.videoProductionBrief.productionPlan).toBe(TEST_VIDEO_BRIEF.productionPlan)
    })

    it('starts with an empty packages array', async () => {
      const service = new PublishingDepartmentService(makeFailingGateway('forced failure'))
      const result = await service.preparePackages(TEST_REQUEST)

      expect(result.ok).toBe(false)
      if (result.ok) return
      const stored = service.getJob(
        // The job is stored even on failure — retrieve it directly
        Array.from({ length: 0 }).length === 0 ? '' : ''
      )
      // Packages are empty on failure — verify through listJobs
      expect(service.listJobs()[0]?.packages).toEqual([])
    })
  })

  describe('getJob()', () => {
    it('returns the job by ID after completion', async () => {
      const service = new PublishingDepartmentService(makeGateway(VALID_PUBLISHING_JSON))
      const result = await service.preparePackages(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return

      const retrieved = service.getJob(result.value.id)
      expect(retrieved).toBeDefined()
      expect(retrieved!.id).toBe(result.value.id)
      expect(retrieved!.status).toBe('completed')
      expect(retrieved!.packages).toHaveLength(6)
    })

    it('returns undefined for an unknown job ID', () => {
      const service = new PublishingDepartmentService(makeGateway(VALID_PUBLISHING_JSON))
      expect(service.getJob('nonexistent')).toBeUndefined()
    })
  })

  describe('listJobs()', () => {
    it('returns all jobs across multiple requests', async () => {
      const service = new PublishingDepartmentService(makeGateway(VALID_PUBLISHING_JSON))

      await service.preparePackages(TEST_REQUEST)
      await service.preparePackages(TEST_REQUEST)

      expect(service.listJobs()).toHaveLength(2)
    })

    it('returns an empty array when no jobs have been run', () => {
      const service = new PublishingDepartmentService(makeGateway(VALID_PUBLISHING_JSON))
      expect(service.listJobs()).toEqual([])
    })
  })
})
