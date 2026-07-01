import { describe, expect, it, vi } from 'vitest'
import type { IModelGateway, GatewayResponse } from '@/shared/model-gateway'
import type { ModelProvider } from '@/shared/types'
import { DeliveryDepartmentService } from './service'
import { buildDeliveryPrompt, parseDeliveryPackage } from './prompt'
import type { DeliveryRequest } from './types'
import type { ApprovalDecision } from '../approval/types'
import type { PublishingJob, PublishingPackage } from '../publishing/types'
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
  generatedAt: new Date('2026-07-01T00:00:00Z'),
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
  videoConcepts: ['Same-day service story'],
  reelHooks: ['"Fixed before noon…"'],
  scriptOutlines: ['Hook → Problem → Solution → CTA'],
  captionIdeas: ['Same-day is our standard. #AustinPlumber'],
  ctaLibrary: ['Call now for a free estimate', 'Book online in 60 seconds'],
  hashtagRecommendations: ['#AustinPlumber', '#PlumberAustin', '#SunrisePlumbing'],
  campaignIdeas: ['"Before It Bursts" campaign'],
  offerRecommendations: ['Free inspection'],
  creativeDirection: 'Warm, trustworthy, professional. Deep blue and gold.',
  productionNotes: 'Real Austin homes. 15-30s reels.',
  successMetrics: ['Inbound calls +25%'],
  generatedAt: new Date('2026-07-01T00:00:00Z'),
  sourceResearchBrief: TEST_RESEARCH_BRIEF,
}

const TEST_CREATIVE_BRIEF: CreativeBrief = {
  visualStyle: 'Warm professional with deep blue and gold tones.',
  brandingGuidelines: 'Logo top-left. Blue (#1B4F8A) for text. Gold (#D4A017) for CTAs.',
  avatarDirection: 'Blue polo spokesperson. Warm neighbor tone.',
  voiceDirection: 'Conversational and confident. Medium pace.',
  shotList: ['Wide establishing shot', 'Close-up pipe repair'],
  storyboard: ['Scene 1: Hook', 'Scene 2: Problem', 'Scene 3: Solution', 'Scene 4: CTA'],
  scenePrompts: ['Austin home exterior', 'Pipe repair close-up'],
  imagePrompts: ['Plumber in blue polo', 'Before/after split'],
  videoPrompts: ['Spokesperson intro', 'Warning signs'],
  hookVariations: ['"Fixed before noon"', '"Pipes about to fail"'],
  thumbnailIdeas: ['45 MINUTES split screen', 'SAME DAY plumber'],
  bRollIdeas: ['Austin skyline time-lapse', 'Slow-motion repaired tap'],
  musicDirection: 'Upbeat acoustic guitar, 110-120 BPM.',
  motionGraphics: 'Clean sans-serif lower thirds in deep blue.',
  callToAction: 'Call Sunrise Plumbing — (512) 000-0000.',
  editingInstructions: 'Jump cuts every 2-3s. Warm colour grade.',
  publishingAssets: ['Instagram Reel: 1080x1920', 'TikTok: 1080x1920'],
  generatedAt: new Date('2026-07-01T00:00:00Z'),
  sourceStrategyBrief: TEST_STRATEGY_BRIEF,
}

const TEST_VIDEO_BRIEF: VideoProductionBrief = {
  productionPlan: 'Produce three Sunrise Plumbing video assets.',
  renderSettings: '1080x1920 portrait, H.264, 30fps, CRF 18.',
  estimatedRuntime: '4h 30m total.',
  renderQueue: ['Job 1: HeyGen — spokesperson intro, 30s'],
  sceneTimeline: ['Scene 1: [0:00-0:03] Hook', 'Scene 2: [0:03-0:10] Problem'],
  avatarAssignments: ['Scene 1: avatar-sunrise-blue-polo'],
  voiceAssignments: ['Track A: warm-texas-male'],
  cameraMovements: ['Scene 1: static wide 2s then slow push-in'],
  motionEffects: ['"SAME DAY SERVICE" caption slide-in at 0:00'],
  transitions: ['Scene 1→2: J-cut at 0:03'],
  captionTimeline: ['Caption 1: [0:00-0:03] SAME DAY SERVICE'],
  bRollTimeline: ['B-roll 1: [0:00-0:03] burst pipe overlay'],
  musicTimeline: ['Cue 1: [0:00-0:30] acoustic guitar at -18dB'],
  assetManifest: ['spokesperson-hero-30s.mp4 — HeyGen export'],
  qualityChecklist: ['QC-001: Brand colours match #1B4F8A and #D4A017'],
  exportTargets: [
    'sunrise-plumbing-reel-v1.mp4 — Instagram Reel',
    'sunrise-plumbing-tiktok-v1.mp4 — TikTok',
    'sunrise-plumbing-short-v1.mp4 — YouTube Short',
  ],
  approvalChecklist: ['Approval 1: Creative Director brand alignment review'],
  generatedAt: new Date('2026-07-01T00:00:00Z'),
  sourceCreativeBrief: TEST_CREATIVE_BRIEF,
}

function makePackage(platform: PublishingPackage['platform']): PublishingPackage {
  return {
    platform,
    title: `Sunrise Plumbing — Same-Day Service (${platform})`,
    caption: `We got the call at 7am and had it fixed before noon. That's the Sunrise standard. #AustinPlumber`,
    hashtags: platform === 'google-business-profile' ? [] : ['#AustinPlumber', '#SunrisePlumbing'],
    tags: ['plumbing', 'austin'],
    callToAction: 'Call (512) 000-0000 for a free estimate',
    audience: `Austin homeowners 30-55 (${platform})`,
    category: 'Home Services',
    thumbnailReference: 'thumbnail-same-day-01.jpg',
    videoReference: `sunrise-plumbing-${platform}-v1.mp4`,
    deliveryAssets: [`sunrise-plumbing-${platform}-v1.mp4`, 'thumbnail-same-day-01.jpg'],
    publishDate: '2026-07-08',
    publishTime: '09:00',
    timezone: 'America/Chicago',
    schedulingInstructions: `Schedule on ${platform} for Tuesday 9am CST`,
    platformMetadata: `{"platform":"${platform}"}`,
    approvalRequired: true,
    publishingChecklist: [`Verify video renders on ${platform}`, 'Confirm caption length'],
  }
}

const TEST_PUBLISHING_JOB: PublishingJob = {
  id: 'pub-job-test-001',
  status: 'completed',
  videoProductionBrief: TEST_VIDEO_BRIEF,
  packages: [
    makePackage('facebook'),
    makePackage('instagram'),
    makePackage('tiktok'),
    makePackage('youtube-shorts'),
    makePackage('linkedin'),
    makePackage('google-business-profile'),
  ],
  attempts: 1,
  employeeId: 'delivery-manager',
  providerId: 'openai',
  createdAt: new Date('2026-07-01T00:00:00Z'),
  updatedAt: new Date('2026-07-01T00:00:00Z'),
}

const TEST_APPROVAL_DECISION: ApprovalDecision = {
  overallDecision: 'APPROVED',
  confidence: 92,
  qualityScore: 88,
  readabilityScore: 91,
  readyForDelivery: true,
  criticalIssues: [],
  brandingIssues: [],
  complianceIssues: [],
  platformIssues: [],
  requiredChanges: [],
  revisionInstructions: 'No revisions required.',
  approvalNotes:
    'All six platform packages meet brand alignment, platform compliance, and quality standards. Ready for delivery.',
  approvedPackages: [
    'facebook',
    'instagram',
    'tiktok',
    'youtube-shorts',
    'linkedin',
    'google-business-profile',
  ],
  rejectedPackages: [],
  generatedAt: new Date('2026-07-01T00:00:00Z'),
  sourcePublishingJob: TEST_PUBLISHING_JOB,
}

const TEST_REQUEST: DeliveryRequest = {
  tenantId: 'tenant_test' as ReturnType<typeof String> as never,
  organizationId: 'org_test' as ReturnType<typeof String> as never,
  workforceId: 'wf_test' as ReturnType<typeof String> as never,
  engagementRunId: 'run_test' as ReturnType<typeof String> as never,
  approvalDecision: TEST_APPROVAL_DECISION,
}

// ── Fixtures — valid JSON response ────────────────────────────────────────────

const VALID_DELIVERY_JSON = JSON.stringify({
  customerSummary:
    'Your 6 social media content packages for Sunrise Plumbing are approved and ready for publishing. Each package includes a platform-optimised video, caption, scheduling instructions, and download links. Review the publishing instructions below and post on or after your recommended schedule date.',
  deliverables: [
    'Facebook video package — 30s spokesperson video with full caption, hashtags, and CTA',
    'Instagram Reel package — 30s reel with hook-optimised caption and hashtag set',
    'TikTok package — 30s short-form video with native CTA and trending audio guidance',
    'YouTube Shorts package — 30s short with channel-optimised title and description',
    'LinkedIn package — professional tone video with industry insight caption',
    'Google Business Profile package — local SEO-optimised post with CTA button',
  ],
  platformPackages: [
    "Facebook (Sunrise Plumbing): 'Same-Day Plumbing in Austin, TX' · 'We got the call at 7am…' · CTA: Call (512) 000-0000 · Schedule: 2026-07-08 09:00 America/Chicago",
    "Instagram: 'Sunrise Plumbing — Same-Day Service' · 'Same-day. Every time.' · CTA: Link in bio · Schedule: 2026-07-08 09:00 America/Chicago",
    "TikTok: 'We showed up when 3 others said they couldn\\'t' · '45 minutes. No upsell.' · CTA: Follow for tips · Schedule: 2026-07-08 09:45 America/Chicago",
    "YouTube Shorts: 'We Fixed This Pipe in 45 Minutes #Shorts' · 'Same-day plumbing in Austin…' · CTA: Subscribe · Schedule: 2026-07-08 09:45 America/Chicago",
    "LinkedIn: 'How Sunrise Plumbing Delivers Same-Day Service' · 'Same-day isn\\'t a promise — it\\'s our model.' · CTA: Visit sunriseplumbing.com · Schedule: 2026-07-08 09:30 America/Chicago",
    "Google Business Profile: 'Same-Day Plumbing Available Now in Austin, TX' · 'Licensed, insured, trusted.' · CTA: Call Now · Schedule: 2026-07-08 10:00 America/Chicago",
  ],
  downloadLinks: [
    'packages/sunrise-plumbing/facebook-package.zip',
    'packages/sunrise-plumbing/instagram-package.zip',
    'packages/sunrise-plumbing/tiktok-package.zip',
    'packages/sunrise-plumbing/youtube-shorts-package.zip',
    'packages/sunrise-plumbing/linkedin-package.zip',
    'packages/sunrise-plumbing/google-business-profile-package.zip',
  ],
  thumbnails: [
    'thumbnails/sunrise-plumbing/facebook-thumb.jpg',
    'thumbnails/sunrise-plumbing/instagram-thumb.jpg',
    'thumbnails/sunrise-plumbing/tiktok-thumb.jpg',
    'thumbnails/sunrise-plumbing/youtube-shorts-thumb.jpg',
    'thumbnails/sunrise-plumbing/linkedin-thumb.jpg',
    'thumbnails/sunrise-plumbing/google-business-profile-thumb.jpg',
  ],
  publishingInstructions: [
    'Facebook: Log in to your Facebook Business page, click Create Post, upload the video file from your Facebook package, paste the caption, and schedule for Tuesday 9:00 AM CST.',
    'Instagram: Open Instagram Creator Studio, select your account, upload the video as a Reel, paste the caption and hashtags, then schedule for Tuesday 9:00 AM CST.',
    'TikTok: Log in to TikTok Business Center, click Create, upload the video, paste the caption with hashtags, and schedule for Tuesday 9:45 AM CST.',
    'YouTube Shorts: Log in to YouTube Studio, click Upload, select the video, paste the title and description with #Shorts in the first line, set to Public, and publish Tuesday 9:45 AM CST.',
    'LinkedIn: From your LinkedIn Company Page, click Start a post, upload the video, paste the professional caption, and schedule for Tuesday 9:30 AM CST.',
    'Google Business Profile: Log in to Google Business Profile, click Add update, upload the video, paste the post text (no hashtags), select Call Now as your CTA button, and publish Tuesday 10:00 AM CST.',
  ],
  recommendedSchedule:
    'Post on Tuesday 2026-07-08 between 9:00–10:00 AM CST. Facebook and Instagram at 9:00 AM (peak homeowner browsing), LinkedIn at 9:30 AM (professional morning window), TikTok and YouTube Shorts at 9:45 AM, Google Business Profile at 10:00 AM.',
  approvalMetadata:
    'Approved by Koolerr QA Lead. Quality score: 88/100. Readability: 91/100. Confidence: 92%. All 6 platforms approved. No issues found. All packages meet brand alignment, platform compliance, and quality standards.',
})

// ── Mock gateway factories ─────────────────────────────────────────────────────

function makeGateway(responseContent: string, provider: ModelProvider = 'openai'): IModelGateway {
  return {
    invoke: vi.fn().mockResolvedValue({
      content: responseContent,
      provider,
      model: 'gpt-4o',
      tokensUsed: 1800,
      latencyMs: 260,
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

// ── buildDeliveryPrompt ───────────────────────────────────────────────────────

describe('buildDeliveryPrompt()', () => {
  it('includes business name from the approval decision chain', () => {
    const prompt = buildDeliveryPrompt(TEST_APPROVAL_DECISION)
    expect(prompt).toContain('Sunrise Plumbing')
    expect(prompt).toContain('Austin, TX')
  })

  it('includes the approval outcome and scores', () => {
    const prompt = buildDeliveryPrompt(TEST_APPROVAL_DECISION)
    expect(prompt).toContain('APPROVED')
    expect(prompt).toContain('88/100') // qualityScore
    expect(prompt).toContain('91/100') // readabilityScore
    expect(prompt).toContain('92%') // confidence
  })

  it('includes all 6 approved platform names', () => {
    const prompt = buildDeliveryPrompt(TEST_APPROVAL_DECISION)
    expect(prompt).toContain('facebook')
    expect(prompt).toContain('instagram')
    expect(prompt).toContain('tiktok')
    expect(prompt).toContain('youtube-shorts')
    expect(prompt).toContain('linkedin')
    expect(prompt).toContain('google-business-profile')
  })

  it('includes all required DeliveryPackage content field names in the schema', () => {
    const prompt = buildDeliveryPrompt(TEST_APPROVAL_DECISION)
    const fields = [
      'customerSummary',
      'deliverables',
      'platformPackages',
      'downloadLinks',
      'thumbnails',
      'publishingInstructions',
      'recommendedSchedule',
      'approvalMetadata',
    ]
    for (const field of fields) {
      expect(prompt).toContain(field)
    }
  })

  it('includes branding context from the strategy brief', () => {
    const prompt = buildDeliveryPrompt(TEST_APPROVAL_DECISION)
    expect(prompt).toContain('Call now for a free estimate') // ctaLibrary
    expect(prompt).toContain('#AustinPlumber') // hashtagRecommendations
  })

  it('surfaces the approval notes in the summary section', () => {
    const prompt = buildDeliveryPrompt(TEST_APPROVAL_DECISION)
    expect(prompt).toContain('All six platform packages meet brand alignment')
  })
})

// ── parseDeliveryPackage ──────────────────────────────────────────────────────

describe('parseDeliveryPackage()', () => {
  it('parses a valid JSON response into a DeliveryPackage', () => {
    const pkg = parseDeliveryPackage(VALID_DELIVERY_JSON, TEST_APPROVAL_DECISION)
    expect(pkg.customerSummary).toContain('Sunrise Plumbing')
    expect(pkg.deliverables).toHaveLength(6)
    expect(pkg.platformPackages).toHaveLength(6)
    expect(pkg.downloadLinks).toHaveLength(6)
    expect(pkg.thumbnails).toHaveLength(6)
    expect(pkg.publishingInstructions).toHaveLength(6)
    expect(pkg.recommendedSchedule).toBeTruthy()
    expect(pkg.approvalMetadata).toBeTruthy()
  })

  it('sets metadata fields correctly', () => {
    const pkg = parseDeliveryPackage(VALID_DELIVERY_JSON, TEST_APPROVAL_DECISION)
    expect(typeof pkg.packageId).toBe('string')
    expect(pkg.packageId.length).toBeGreaterThan(0)
    expect(pkg.status).toBe('ready')
    expect(pkg.readyForCustomer).toBe(true)
    expect(pkg.generatedAt).toBeInstanceOf(Date)
    expect(pkg.deliveredAt).toBeInstanceOf(Date)
    expect(pkg.sourceApprovalDecision).toBe(TEST_APPROVAL_DECISION)
  })

  it('generates a unique packageId on each parse', () => {
    const pkg1 = parseDeliveryPackage(VALID_DELIVERY_JSON, TEST_APPROVAL_DECISION)
    const pkg2 = parseDeliveryPackage(VALID_DELIVERY_JSON, TEST_APPROVAL_DECISION)
    expect(pkg1.packageId).not.toBe(pkg2.packageId)
  })

  it('strips markdown code fences before parsing', () => {
    const wrapped = '```json\n' + VALID_DELIVERY_JSON + '\n```'
    const pkg = parseDeliveryPackage(wrapped, TEST_APPROVAL_DECISION)
    expect(pkg.customerSummary).toBeTruthy()
    expect(pkg.deliverables).toHaveLength(6)
  })

  it('allows empty downloadLinks and thumbnails arrays', () => {
    const minimal = JSON.parse(VALID_DELIVERY_JSON) as Record<string, unknown>
    minimal.downloadLinks = []
    minimal.thumbnails = []
    const pkg = parseDeliveryPackage(JSON.stringify(minimal), TEST_APPROVAL_DECISION)
    expect(pkg.downloadLinks).toEqual([])
    expect(pkg.thumbnails).toEqual([])
  })

  it('throws when response is not valid JSON', () => {
    expect(() =>
      parseDeliveryPackage(
        'I cannot prepare a delivery package at this time.',
        TEST_APPROVAL_DECISION
      )
    ).toThrow('non-JSON')
  })

  it('throws when customerSummary is missing', () => {
    const bad = JSON.parse(VALID_DELIVERY_JSON) as Record<string, unknown>
    delete bad.customerSummary
    expect(() => parseDeliveryPackage(JSON.stringify(bad), TEST_APPROVAL_DECISION)).toThrow(
      'customerSummary'
    )
  })

  it('throws when deliverables array is empty', () => {
    const bad = JSON.parse(VALID_DELIVERY_JSON) as Record<string, unknown>
    bad.deliverables = []
    expect(() => parseDeliveryPackage(JSON.stringify(bad), TEST_APPROVAL_DECISION)).toThrow(
      'deliverables'
    )
  })

  it('throws when platformPackages is missing', () => {
    const bad = JSON.parse(VALID_DELIVERY_JSON) as Record<string, unknown>
    delete bad.platformPackages
    expect(() => parseDeliveryPackage(JSON.stringify(bad), TEST_APPROVAL_DECISION)).toThrow(
      'platformPackages'
    )
  })

  it('throws when publishingInstructions is empty', () => {
    const bad = JSON.parse(VALID_DELIVERY_JSON) as Record<string, unknown>
    bad.publishingInstructions = []
    expect(() => parseDeliveryPackage(JSON.stringify(bad), TEST_APPROVAL_DECISION)).toThrow(
      'publishingInstructions'
    )
  })

  it('throws when downloadLinks is not an array', () => {
    const bad = JSON.parse(VALID_DELIVERY_JSON) as Record<string, unknown>
    delete bad.downloadLinks
    expect(() => parseDeliveryPackage(JSON.stringify(bad), TEST_APPROVAL_DECISION)).toThrow(
      'downloadLinks'
    )
  })

  it('throws when recommendedSchedule is missing', () => {
    const bad = JSON.parse(VALID_DELIVERY_JSON) as Record<string, unknown>
    delete bad.recommendedSchedule
    expect(() => parseDeliveryPackage(JSON.stringify(bad), TEST_APPROVAL_DECISION)).toThrow(
      'recommendedSchedule'
    )
  })
})

// ── DeliveryDepartmentService ─────────────────────────────────────────────────

describe('DeliveryDepartmentService', () => {
  describe('prepareDelivery()', () => {
    it('returns a completed job with a DeliveryPackage on success', async () => {
      const service = new DeliveryDepartmentService(makeGateway(VALID_DELIVERY_JSON))
      const result = await service.prepareDelivery(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.value.status).toBe('completed')
      expect(result.value.deliveryPackage).toBeDefined()
      expect(result.value.approvalDecision).toBe(TEST_APPROVAL_DECISION)
      expect(result.value.attempts).toBe(1)
    })

    it('delivery package is ready for the customer', async () => {
      const service = new DeliveryDepartmentService(makeGateway(VALID_DELIVERY_JSON))
      const result = await service.prepareDelivery(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return

      const pkg = result.value.deliveryPackage!
      expect(pkg.status).toBe('ready')
      expect(pkg.readyForCustomer).toBe(true)
      expect(pkg.deliverables).toHaveLength(6)
      expect(pkg.platformPackages).toHaveLength(6)
      expect(pkg.publishingInstructions).toHaveLength(6)
    })

    it('delivery package has a valid packageId and timestamps', async () => {
      const service = new DeliveryDepartmentService(makeGateway(VALID_DELIVERY_JSON))
      const result = await service.prepareDelivery(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return

      const pkg = result.value.deliveryPackage!
      expect(typeof pkg.packageId).toBe('string')
      expect(pkg.packageId.length).toBeGreaterThan(0)
      expect(pkg.generatedAt).toBeInstanceOf(Date)
      expect(pkg.deliveredAt).toBeInstanceOf(Date)
    })

    it('records the provider that produced the result', async () => {
      const service = new DeliveryDepartmentService(makeGateway(VALID_DELIVERY_JSON, 'openai'))
      const result = await service.prepareDelivery(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.providerId).toBe('openai')
    })

    it('defaults to delivery-manager when no preferred employee is set', async () => {
      const service = new DeliveryDepartmentService(makeGateway(VALID_DELIVERY_JSON))
      const result = await service.prepareDelivery(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.employeeId).toBe('delivery-manager')
    })

    it('uses delivery-manager when explicitly specified', async () => {
      const service = new DeliveryDepartmentService(makeGateway(VALID_DELIVERY_JSON))
      const result = await service.prepareDelivery({
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
            content: VALID_DELIVERY_JSON,
            provider: req.provider as ModelProvider,
            model: 'gpt-4o',
            tokensUsed: 1800,
            latencyMs: 260,
          }
        }),
        registeredProviders: () => ['openai'],
      }

      const service = new DeliveryDepartmentService(gateway)
      await service.prepareDelivery(TEST_REQUEST)

      expect(capturedProvider).toBe('openai')
    })

    it('retries on transient failure and succeeds on second attempt', async () => {
      let callCount = 0
      const gateway: IModelGateway = {
        invoke: vi.fn().mockImplementation(async () => {
          callCount++
          if (callCount === 1) throw new Error('upstream timeout')
          return {
            content: VALID_DELIVERY_JSON,
            provider: 'openai' as ModelProvider,
            model: 'gpt-4o',
            tokensUsed: 1800,
            latencyMs: 260,
          }
        }),
        registeredProviders: () => ['openai'],
      }

      const service = new DeliveryDepartmentService(gateway)
      const result = await service.prepareDelivery(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.attempts).toBe(2)
      expect(result.value.status).toBe('completed')
    })

    it('falls back to anthropic when openai is not configured', async () => {
      const gateway: IModelGateway = {
        invoke: vi.fn().mockImplementation(async (req) => {
          if (req.provider === 'openai') throw new Error('OPENAI_API_KEY is not set')
          return {
            content: VALID_DELIVERY_JSON,
            provider: 'anthropic' as ModelProvider,
            model: 'claude-haiku-4-5-20251001',
            tokensUsed: 1800,
            latencyMs: 320,
          }
        }),
        registeredProviders: () => ['anthropic'],
      }

      const service = new DeliveryDepartmentService(gateway)
      const result = await service.prepareDelivery(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.providerId).toBe('anthropic')
    })

    it('returns MAX_RETRIES_EXCEEDED when all providers and retries fail', async () => {
      const service = new DeliveryDepartmentService(
        makeFailingGateway('upstream service unavailable')
      )
      const result = await service.prepareDelivery(TEST_REQUEST)

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error.code).toBe('MAX_RETRIES_EXCEEDED')
      expect(result.error.retriable).toBe(false)
    })

    it('returns PROVIDER_NOT_CONFIGURED when no provider is available', async () => {
      const service = new DeliveryDepartmentService(
        makeFailingGateway('No provider available. Requested: "openai"')
      )
      const result = await service.prepareDelivery(TEST_REQUEST)

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error.code).toBe('PROVIDER_NOT_CONFIGURED')
    })

    it('returns INVALID_RESPONSE when the provider returns non-JSON', async () => {
      const service = new DeliveryDepartmentService(
        makeGateway('I am unable to prepare a delivery package.')
      )
      const result = await service.prepareDelivery(TEST_REQUEST)

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error.code).toBe('INVALID_RESPONSE')
    })

    it('preserves the approval decision on the job record', async () => {
      const service = new DeliveryDepartmentService(makeGateway(VALID_DELIVERY_JSON))
      const result = await service.prepareDelivery(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.approvalDecision.overallDecision).toBe('APPROVED')
      expect(result.value.approvalDecision.qualityScore).toBe(88)
    })

    it('each job gets a unique ID', async () => {
      const service = new DeliveryDepartmentService(makeGateway(VALID_DELIVERY_JSON))

      const r1 = await service.prepareDelivery(TEST_REQUEST)
      const r2 = await service.prepareDelivery(TEST_REQUEST)

      expect(r1.ok && r2.ok).toBe(true)
      if (!r1.ok || !r2.ok) return
      expect(r1.value.id).not.toBe(r2.value.id)
    })
  })

  describe('getJob()', () => {
    it('returns the job by ID after completion', async () => {
      const service = new DeliveryDepartmentService(makeGateway(VALID_DELIVERY_JSON))
      const result = await service.prepareDelivery(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return

      const retrieved = service.getJob(result.value.id)
      expect(retrieved).toBeDefined()
      expect(retrieved!.id).toBe(result.value.id)
      expect(retrieved!.status).toBe('completed')
      expect(retrieved!.deliveryPackage).toBeDefined()
      expect(retrieved!.deliveryPackage!.readyForCustomer).toBe(true)
    })

    it('returns undefined for an unknown job ID', () => {
      const service = new DeliveryDepartmentService(makeGateway(VALID_DELIVERY_JSON))
      expect(service.getJob('nonexistent')).toBeUndefined()
    })
  })

  describe('listJobs()', () => {
    it('returns all jobs across multiple requests', async () => {
      const service = new DeliveryDepartmentService(makeGateway(VALID_DELIVERY_JSON))

      await service.prepareDelivery(TEST_REQUEST)
      await service.prepareDelivery(TEST_REQUEST)

      expect(service.listJobs()).toHaveLength(2)
    })

    it('returns an empty array when no jobs have been run', () => {
      const service = new DeliveryDepartmentService(makeGateway(VALID_DELIVERY_JSON))
      expect(service.listJobs()).toEqual([])
    })
  })
})
