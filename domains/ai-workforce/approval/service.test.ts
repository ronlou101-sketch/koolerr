import { describe, expect, it, vi } from 'vitest'
import type { IModelGateway, GatewayResponse } from '@/shared/model-gateway'
import type { ModelProvider } from '@/shared/types'
import { ApprovalDepartmentService } from './service'
import { buildApprovalPrompt, parseApprovalDecision } from './prompt'
import type { ApprovalRequest } from './types'
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
  ctaLibrary: ['Call now for a free estimate'],
  hashtagRecommendations: ['#AustinPlumber', '#PlumberAustin'],
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

const TEST_REQUEST: ApprovalRequest = {
  tenantId: 'tenant_test' as ReturnType<typeof String> as never,
  organizationId: 'org_test' as ReturnType<typeof String> as never,
  workforceId: 'wf_test' as ReturnType<typeof String> as never,
  engagementRunId: 'run_test' as ReturnType<typeof String> as never,
  publishingJob: TEST_PUBLISHING_JOB,
}

// ── Fixtures — valid JSON responses ───────────────────────────────────────────

const VALID_APPROVED_JSON = JSON.stringify({
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
  revisionInstructions: 'No revisions required. All packages meet quality standards.',
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
})

const VALID_REVISE_JSON = JSON.stringify({
  overallDecision: 'REVISE',
  confidence: 78,
  qualityScore: 72,
  readabilityScore: 75,
  readyForDelivery: false,
  criticalIssues: [],
  brandingIssues: ['TikTok caption does not reflect the brand voice — too casual'],
  complianceIssues: [],
  platformIssues: [
    'LinkedIn caption uses informal slang not appropriate for professional platform',
  ],
  requiredChanges: [
    'Revise TikTok caption to be more brand-aligned',
    'Rewrite LinkedIn caption in professional tone',
  ],
  revisionInstructions:
    'Return TikTok and LinkedIn packages to the Publishing Department. Update TikTok caption to reflect warm-professional brand voice. Rewrite LinkedIn caption to remove slang and adopt an industry-insight framing.',
  approvalNotes:
    'Four platforms (Facebook, Instagram, YouTube Shorts, Google Business Profile) meet standards and are pre-approved pending revision of TikTok and LinkedIn packages.',
  approvedPackages: ['facebook', 'instagram', 'youtube-shorts', 'google-business-profile'],
  rejectedPackages: ['tiktok', 'linkedin'],
})

const VALID_REJECT_JSON = JSON.stringify({
  overallDecision: 'REJECT',
  confidence: 95,
  qualityScore: 38,
  readabilityScore: 42,
  readyForDelivery: false,
  criticalIssues: [
    'Multiple packages contain factually incorrect pricing claims',
    'CTA references a phone number not provided in the source brief',
  ],
  brandingIssues: ['No packages reflect the deep blue and gold brand colours in descriptions'],
  complianceIssues: [
    'Facebook package contains a comparative claim ("best plumber in Austin") without evidence',
  ],
  platformIssues: [],
  requiredChanges: [],
  revisionInstructions:
    'Workflow terminated. The publishing packages contain critical factual errors and unsubstantiated claims. Return to the Strategy and Creative departments for a full re-brief before re-publishing.',
  approvalNotes:
    'Critical failure: pricing and contact information are incorrect across all packages. Compliance violation in Facebook package. Full rework required.',
  approvedPackages: [],
  rejectedPackages: [
    'facebook',
    'instagram',
    'tiktok',
    'youtube-shorts',
    'linkedin',
    'google-business-profile',
  ],
})

// ── Mock gateway factories ─────────────────────────────────────────────────────

function makeGateway(responseContent: string, provider: ModelProvider = 'openai'): IModelGateway {
  return {
    invoke: vi.fn().mockResolvedValue({
      content: responseContent,
      provider,
      model: 'gpt-4o',
      tokensUsed: 2200,
      latencyMs: 280,
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

// ── buildApprovalPrompt ───────────────────────────────────────────────────────

describe('buildApprovalPrompt()', () => {
  it('includes business name from the publishing job chain', () => {
    const prompt = buildApprovalPrompt(TEST_PUBLISHING_JOB)
    expect(prompt).toContain('Sunrise Plumbing')
    expect(prompt).toContain('Austin, TX')
  })

  it('includes brand positioning and core messaging for brand-alignment review', () => {
    const prompt = buildApprovalPrompt(TEST_PUBLISHING_JOB)
    expect(prompt).toContain("Austin's most reliable same-day plumber") // brandPositioning
    expect(prompt).toContain('We fix it right the first time') // coreMessaging
  })

  it('includes all 6 platform names in the package summaries', () => {
    const prompt = buildApprovalPrompt(TEST_PUBLISHING_JOB)
    expect(prompt).toContain('[facebook]')
    expect(prompt).toContain('[instagram]')
    expect(prompt).toContain('[tiktok]')
    expect(prompt).toContain('[youtube-shorts]')
    expect(prompt).toContain('[linkedin]')
    expect(prompt).toContain('[google-business-profile]')
  })

  it('includes all required ApprovalDecision field names in the schema', () => {
    const prompt = buildApprovalPrompt(TEST_PUBLISHING_JOB)
    const fields = [
      'overallDecision',
      'confidence',
      'qualityScore',
      'readabilityScore',
      'readyForDelivery',
      'criticalIssues',
      'brandingIssues',
      'complianceIssues',
      'platformIssues',
      'requiredChanges',
      'revisionInstructions',
      'approvalNotes',
      'approvedPackages',
      'rejectedPackages',
    ]
    for (const field of fields) {
      expect(prompt).toContain(field)
    }
  })

  it('includes all three outcome values in the outcome rules', () => {
    const prompt = buildApprovalPrompt(TEST_PUBLISHING_JOB)
    expect(prompt).toContain('APPROVED')
    expect(prompt).toContain('REVISE')
    expect(prompt).toContain('REJECT')
  })

  it('includes the evaluation criteria headings', () => {
    const prompt = buildApprovalPrompt(TEST_PUBLISHING_JOB)
    expect(prompt).toContain('Brand alignment')
    expect(prompt).toContain('Platform compliance')
    expect(prompt).toContain('Compliance and safety')
  })
})

// ── parseApprovalDecision ─────────────────────────────────────────────────────

describe('parseApprovalDecision()', () => {
  it('parses a valid APPROVED JSON into an ApprovalDecision', () => {
    const decision = parseApprovalDecision(VALID_APPROVED_JSON, TEST_PUBLISHING_JOB)
    expect(decision.overallDecision).toBe('APPROVED')
    expect(decision.confidence).toBe(92)
    expect(decision.qualityScore).toBe(88)
    expect(decision.readabilityScore).toBe(91)
    expect(decision.readyForDelivery).toBe(true)
    expect(decision.approvedPackages).toHaveLength(6)
    expect(decision.rejectedPackages).toHaveLength(0)
    expect(decision.generatedAt).toBeInstanceOf(Date)
    expect(decision.sourcePublishingJob).toBe(TEST_PUBLISHING_JOB)
  })

  it('parses a valid REVISE JSON correctly', () => {
    const decision = parseApprovalDecision(VALID_REVISE_JSON, TEST_PUBLISHING_JOB)
    expect(decision.overallDecision).toBe('REVISE')
    expect(decision.readyForDelivery).toBe(false)
    expect(decision.brandingIssues).toHaveLength(1)
    expect(decision.platformIssues).toHaveLength(1)
    expect(decision.requiredChanges).toHaveLength(2)
    expect(decision.approvedPackages).toHaveLength(4)
    expect(decision.rejectedPackages).toHaveLength(2)
  })

  it('parses a valid REJECT JSON correctly', () => {
    const decision = parseApprovalDecision(VALID_REJECT_JSON, TEST_PUBLISHING_JOB)
    expect(decision.overallDecision).toBe('REJECT')
    expect(decision.readyForDelivery).toBe(false)
    expect(decision.criticalIssues).toHaveLength(2)
    expect(decision.complianceIssues).toHaveLength(1)
    expect(decision.approvedPackages).toHaveLength(0)
    expect(decision.rejectedPackages).toHaveLength(6)
  })

  it('strips markdown code fences before parsing', () => {
    const wrapped = '```json\n' + VALID_APPROVED_JSON + '\n```'
    const decision = parseApprovalDecision(wrapped, TEST_PUBLISHING_JOB)
    expect(decision.overallDecision).toBe('APPROVED')
  })

  it('throws when response is not valid JSON', () => {
    expect(() =>
      parseApprovalDecision('I cannot review these packages at this time.', TEST_PUBLISHING_JOB)
    ).toThrow('non-JSON')
  })

  it('throws when overallDecision is not a valid outcome', () => {
    const bad = JSON.parse(VALID_APPROVED_JSON) as Record<string, unknown>
    bad.overallDecision = 'PENDING'
    expect(() => parseApprovalDecision(JSON.stringify(bad), TEST_PUBLISHING_JOB)).toThrow(
      'overallDecision'
    )
  })

  it('throws when confidence is out of range', () => {
    const bad = JSON.parse(VALID_APPROVED_JSON) as Record<string, unknown>
    bad.confidence = 150
    expect(() => parseApprovalDecision(JSON.stringify(bad), TEST_PUBLISHING_JOB)).toThrow(
      'confidence'
    )
  })

  it('throws when qualityScore is missing', () => {
    const bad = JSON.parse(VALID_APPROVED_JSON) as Record<string, unknown>
    delete bad.qualityScore
    expect(() => parseApprovalDecision(JSON.stringify(bad), TEST_PUBLISHING_JOB)).toThrow(
      'qualityScore'
    )
  })

  it('throws when readyForDelivery is not a boolean', () => {
    const bad = JSON.parse(VALID_APPROVED_JSON) as Record<string, unknown>
    bad.readyForDelivery = 'yes'
    expect(() => parseApprovalDecision(JSON.stringify(bad), TEST_PUBLISHING_JOB)).toThrow(
      'readyForDelivery'
    )
  })

  it('throws when revisionInstructions is missing', () => {
    const bad = JSON.parse(VALID_APPROVED_JSON) as Record<string, unknown>
    delete bad.revisionInstructions
    expect(() => parseApprovalDecision(JSON.stringify(bad), TEST_PUBLISHING_JOB)).toThrow(
      'revisionInstructions'
    )
  })

  it('throws when approvedPackages array is missing', () => {
    const bad = JSON.parse(VALID_APPROVED_JSON) as Record<string, unknown>
    delete bad.approvedPackages
    expect(() => parseApprovalDecision(JSON.stringify(bad), TEST_PUBLISHING_JOB)).toThrow(
      'approvedPackages'
    )
  })

  it('throws when criticalIssues array is missing', () => {
    const bad = JSON.parse(VALID_APPROVED_JSON) as Record<string, unknown>
    delete bad.criticalIssues
    expect(() => parseApprovalDecision(JSON.stringify(bad), TEST_PUBLISHING_JOB)).toThrow(
      'criticalIssues'
    )
  })
})

// ── ApprovalDepartmentService ─────────────────────────────────────────────────

describe('ApprovalDepartmentService', () => {
  describe('reviewPackages()', () => {
    it('returns a completed job with an ApprovalDecision on success', async () => {
      const service = new ApprovalDepartmentService(makeGateway(VALID_APPROVED_JSON))
      const result = await service.reviewPackages(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.value.status).toBe('completed')
      expect(result.value.approvalDecision).toBeDefined()
      expect(result.value.publishingJob).toBe(TEST_PUBLISHING_JOB)
      expect(result.value.attempts).toBe(1)
    })

    it('decision has APPROVED outcome with readyForDelivery = true', async () => {
      const service = new ApprovalDepartmentService(makeGateway(VALID_APPROVED_JSON))
      const result = await service.reviewPackages(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.value.approvalDecision!.overallDecision).toBe('APPROVED')
      expect(result.value.approvalDecision!.readyForDelivery).toBe(true)
      expect(result.value.approvalDecision!.approvedPackages).toHaveLength(6)
    })

    it('handles REVISE outcome with readyForDelivery = false', async () => {
      const service = new ApprovalDepartmentService(makeGateway(VALID_REVISE_JSON))
      const result = await service.reviewPackages(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.value.approvalDecision!.overallDecision).toBe('REVISE')
      expect(result.value.approvalDecision!.readyForDelivery).toBe(false)
      expect(result.value.approvalDecision!.requiredChanges.length).toBeGreaterThan(0)
    })

    it('handles REJECT outcome with criticalIssues populated', async () => {
      const service = new ApprovalDepartmentService(makeGateway(VALID_REJECT_JSON))
      const result = await service.reviewPackages(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.value.approvalDecision!.overallDecision).toBe('REJECT')
      expect(result.value.approvalDecision!.readyForDelivery).toBe(false)
      expect(result.value.approvalDecision!.criticalIssues.length).toBeGreaterThan(0)
      expect(result.value.approvalDecision!.approvedPackages).toHaveLength(0)
      expect(result.value.approvalDecision!.rejectedPackages).toHaveLength(6)
    })

    it('records the provider that produced the result', async () => {
      const service = new ApprovalDepartmentService(makeGateway(VALID_APPROVED_JSON, 'openai'))
      const result = await service.reviewPackages(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.providerId).toBe('openai')
    })

    it('defaults to qa-lead when no preferred employee is set', async () => {
      const service = new ApprovalDepartmentService(makeGateway(VALID_APPROVED_JSON))
      const result = await service.reviewPackages(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.employeeId).toBe('qa-lead')
    })

    it('uses qa-lead when explicitly specified', async () => {
      const service = new ApprovalDepartmentService(makeGateway(VALID_APPROVED_JSON))
      const result = await service.reviewPackages({
        ...TEST_REQUEST,
        preferredEmployee: 'qa-lead',
      })

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.employeeId).toBe('qa-lead')
    })

    it('routes through openai first (qa-lead primaryProvider is openai)', async () => {
      let capturedProvider: string | undefined
      const gateway: IModelGateway = {
        invoke: vi.fn().mockImplementation(async (req) => {
          capturedProvider = req.provider
          return {
            content: VALID_APPROVED_JSON,
            provider: req.provider as ModelProvider,
            model: 'gpt-4o',
            tokensUsed: 2200,
            latencyMs: 280,
          }
        }),
        registeredProviders: () => ['openai'],
      }

      const service = new ApprovalDepartmentService(gateway)
      await service.reviewPackages(TEST_REQUEST)

      expect(capturedProvider).toBe('openai')
    })

    it('retries on transient failure and succeeds on second attempt', async () => {
      let callCount = 0
      const gateway: IModelGateway = {
        invoke: vi.fn().mockImplementation(async () => {
          callCount++
          if (callCount === 1) throw new Error('upstream timeout')
          return {
            content: VALID_APPROVED_JSON,
            provider: 'openai' as ModelProvider,
            model: 'gpt-4o',
            tokensUsed: 2200,
            latencyMs: 280,
          }
        }),
        registeredProviders: () => ['openai'],
      }

      const service = new ApprovalDepartmentService(gateway)
      const result = await service.reviewPackages(TEST_REQUEST)

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
            content: VALID_APPROVED_JSON,
            provider: 'anthropic' as ModelProvider,
            model: 'claude-haiku-4-5-20251001',
            tokensUsed: 2200,
            latencyMs: 320,
          }
        }),
        registeredProviders: () => ['anthropic'],
      }

      const service = new ApprovalDepartmentService(gateway)
      const result = await service.reviewPackages(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.providerId).toBe('anthropic')
    })

    it('returns MAX_RETRIES_EXCEEDED when all providers and retries fail', async () => {
      const service = new ApprovalDepartmentService(
        makeFailingGateway('upstream service unavailable')
      )
      const result = await service.reviewPackages(TEST_REQUEST)

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error.code).toBe('MAX_RETRIES_EXCEEDED')
      expect(result.error.retriable).toBe(false)
    })

    it('returns PROVIDER_NOT_CONFIGURED when no provider is available', async () => {
      const service = new ApprovalDepartmentService(
        makeFailingGateway('No provider available. Requested: "openai"')
      )
      const result = await service.reviewPackages(TEST_REQUEST)

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error.code).toBe('PROVIDER_NOT_CONFIGURED')
    })

    it('returns INVALID_RESPONSE when the provider returns non-JSON', async () => {
      const service = new ApprovalDepartmentService(
        makeGateway('I am unable to review these packages.')
      )
      const result = await service.reviewPackages(TEST_REQUEST)

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error.code).toBe('INVALID_RESPONSE')
    })

    it('returns INVALID_RESPONSE when overallDecision is not a valid outcome', async () => {
      const bad = JSON.parse(VALID_APPROVED_JSON) as Record<string, unknown>
      bad.overallDecision = 'MAYBE'
      const service = new ApprovalDepartmentService(makeGateway(JSON.stringify(bad)))
      const result = await service.reviewPackages(TEST_REQUEST)

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error.code).toBe('INVALID_RESPONSE')
    })

    it('preserves the publishing job on the job record', async () => {
      const service = new ApprovalDepartmentService(makeGateway(VALID_APPROVED_JSON))
      const result = await service.reviewPackages(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.publishingJob.id).toBe(TEST_PUBLISHING_JOB.id)
      expect(result.value.publishingJob.packages).toHaveLength(6)
    })
  })

  describe('getJob()', () => {
    it('returns the job by ID after completion', async () => {
      const service = new ApprovalDepartmentService(makeGateway(VALID_APPROVED_JSON))
      const result = await service.reviewPackages(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return

      const retrieved = service.getJob(result.value.id)
      expect(retrieved).toBeDefined()
      expect(retrieved!.id).toBe(result.value.id)
      expect(retrieved!.status).toBe('completed')
      expect(retrieved!.approvalDecision).toBeDefined()
    })

    it('returns undefined for an unknown job ID', () => {
      const service = new ApprovalDepartmentService(makeGateway(VALID_APPROVED_JSON))
      expect(service.getJob('nonexistent')).toBeUndefined()
    })
  })

  describe('listJobs()', () => {
    it('returns all jobs across multiple requests', async () => {
      const service = new ApprovalDepartmentService(makeGateway(VALID_APPROVED_JSON))

      await service.reviewPackages(TEST_REQUEST)
      await service.reviewPackages(TEST_REQUEST)

      expect(service.listJobs()).toHaveLength(2)
    })

    it('returns an empty array when no jobs have been run', () => {
      const service = new ApprovalDepartmentService(makeGateway(VALID_APPROVED_JSON))
      expect(service.listJobs()).toEqual([])
    })
  })
})
