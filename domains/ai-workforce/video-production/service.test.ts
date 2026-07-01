import { describe, expect, it, vi } from 'vitest'
import type { IModelGateway, GatewayResponse } from '@/shared/model-gateway'
import type { ModelProvider } from '@/shared/types'
import { VideoProductionDepartmentService } from './service'
import { buildVideoProductionPrompt, parseVideoProductionBrief } from './prompt'
import type { VideoProductionRequest } from './types'
import type { CreativeBrief } from '../creative/types'
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
  ],
  weeklyPostingSchedule: { monday: 'Educational tip', tuesday: 'Customer testimonial' },
  videoConcepts: ['Same-day service story', '5 warning signs', 'Transparent pricing'],
  reelHooks: ['"Fixed before noon…"', '"What plumbers hide…"', '"One thing prevents 80%…"'],
  scriptOutlines: ['Hook → Problem → Solution → CTA', 'Price reveal → Comparison → Proof → CTA'],
  captionIdeas: ['Same-day is our standard. #AustinPlumber', 'Fixed in 45 minutes. No upselling.'],
  ctaLibrary: ['Call now for a free estimate', 'Book online in 60 seconds'],
  hashtagRecommendations: ['#AustinPlumber', '#PlumberAustin', '#SunrisePlumbing'],
  campaignIdeas: ['"Before It Bursts" campaign', '"5-Star Service" review campaign'],
  offerRecommendations: ['Free inspection', '10% off first service'],
  creativeDirection: 'Warm, trustworthy, professional. Deep blue and gold.',
  productionNotes: 'Real Austin homes, not studios. 15-30s reels.',
  successMetrics: ['Inbound calls +25%', 'Conversion rate 4%+'],
  generatedAt: new Date('2026-06-30T00:00:00Z'),
  sourceResearchBrief: TEST_RESEARCH_BRIEF,
}

const TEST_CREATIVE_BRIEF: CreativeBrief = {
  visualStyle: 'Warm professional with deep blue and gold tones. Clean Austin home settings.',
  brandingGuidelines: 'Logo top-left. Blue (#1B4F8A) for text. Gold (#D4A017) for CTAs.',
  avatarDirection: 'Blue polo spokesperson. Warm neighbor tone. Direct eye contact.',
  voiceDirection: 'Conversational and confident. Medium pace. Slight Texas warmth.',
  shotList: [
    'Wide establishing — Austin neighborhood, morning light, 3s',
    'Close-up — plumber hands fixing pipe, 2s',
    'Over-shoulder — plumber explaining to homeowner, 3s',
  ],
  storyboard: [
    'Scene 1: [0-3s] Hook — burst pipe, reassuring VO',
    'Scene 2: [3-10s] Problem — homeowner stress, call to Sunrise',
    'Scene 3: [10-25s] Solution — technician arrives, fixes pipe',
    'Scene 4: [25-30s] CTA — logo, phone number',
  ],
  scenePrompts: [
    'Cinematic wide — Austin home exterior, golden hour, plumber van arriving',
    'Macro — plumber hands fixing copper pipe, dramatic side lighting',
    'Medium — smiling plumber explaining repair to homeowner',
  ],
  imagePrompts: [
    'Sunrise Plumbing plumber in blue polo, Austin home, golden hour',
    'Before/after split — burst pipe vs clean new pipe',
    'Work van with logo, Austin skyline background',
  ],
  videoPrompts: [
    'Spokesperson: "Hi I\'m from Sunrise Plumbing. Same-day service, no hidden fees."',
    'Spokesperson: "5 warning signs to look for in your home."',
    'Spokesperson: "Fixed this homeowner\'s pipe in 45 minutes. Saved them $800."',
  ],
  hookVariations: [
    '"Fixed before noon — here\'s how we do it"',
    '"Most Austin homeowners don\'t know their pipes are about to fail"',
    '"We showed up when three others said they couldn\'t"',
  ],
  thumbnailIdeas: [
    'Split screen flooded vs fixed. Bold "45 MINUTES" text.',
    'Smiling plumber thumbs up. "SAME DAY" overlay.',
    'Receipt showing $0 hidden fees. "TRANSPARENT PRICING".',
  ],
  bRollIdeas: [
    'Time-lapse Austin skyline — local identity',
    'Slow-motion repaired tap flowing — problem solved',
    'Drone over Austin neighborhood — community focus',
  ],
  musicDirection: 'Upbeat acoustic guitar, 110-120 BPM. Warm Texas feel.',
  motionGraphics: 'Clean sans-serif lower thirds in deep blue. Gold animated underline.',
  callToAction: 'Call Sunrise Plumbing — (512) 000-0000. Gold on blue for final 5 seconds.',
  editingInstructions: 'Jump cuts every 2-3s. Warm colour grade. VO at -3dB, music at -18dB.',
  publishingAssets: [
    'Instagram Reel: 1080x1920, 30s, MP4',
    'TikTok: 1080x1920, 30s, MP4',
    'YouTube Short: 1080x1920, 60s max, MP4',
  ],
  generatedAt: new Date('2026-06-30T00:00:00Z'),
  sourceStrategyBrief: TEST_STRATEGY_BRIEF,
}

const TEST_REQUEST: VideoProductionRequest = {
  tenantId: 'tenant_test' as ReturnType<typeof String> as never,
  organizationId: 'org_test' as ReturnType<typeof String> as never,
  workforceId: 'wf_test' as ReturnType<typeof String> as never,
  engagementRunId: 'run_test' as ReturnType<typeof String> as never,
  creativeBrief: TEST_CREATIVE_BRIEF,
}

const VALID_PRODUCTION_JSON = JSON.stringify({
  productionPlan:
    'Produce three distinct Sunrise Plumbing video assets in sequence: (1) 30-second hero Reel via HeyGen spokesperson + Higgsfield B-roll, (2) 30-second TikTok variant with alternative hook, (3) 60-second YouTube Short with extended solution section. All assets share a common voice-over track from ElevenLabs. Estimated pipeline: 4h 30m.',
  renderSettings:
    '1080x1920 portrait for Reels/TikTok/Shorts. 1920x1080 landscape for YouTube standard. H.264 codec, 30fps, CRF 18. Color space: Rec.709. Audio: AAC 192kbps stereo. Maximum file size: 500MB per asset.',
  estimatedRuntime:
    '4h 30m total: HeyGen spokesperson renders 1h 15m, Higgsfield scene renders 1h 45m, ElevenLabs voice synthesis 20m, post-processing and assembly 1h 10m.',
  renderQueue: [
    'Job 1: HeyGen — spokesperson intro scene, avatar ID sunrise-blue-polo, script "Hi I\'m from Sunrise Plumbing...", 30s, priority HIGH, no dependencies',
    'Job 2: Higgsfield — Austin neighborhood establishing shot, cinematic wide, golden hour, 3s loop, priority HIGH, no dependencies',
    'Job 3: ElevenLabs — voice-over track A "We got the call at 7am", warm-confident voice, 12s, priority MEDIUM, depends on Job 1 approval',
  ],
  sceneTimeline: [
    'Scene 1: [0:00-0:03] Hook — HeyGen avatar appears mid-frame, voice-over "We got the call at 7am", Higgsfield burst pipe B-roll overlay, caption "SAME DAY SERVICE" slides in from left',
    'Scene 2: [0:03-0:10] Problem — Higgsfield homeowner stress B-roll, music bed enters at -18dB, ElevenLabs narration "Austin homeowners know the feeling", caption layer 2',
    'Scene 3: [0:10-0:25] Solution — HeyGen spokesperson at Austin home exterior, Higgsfield cutaway to pipe repair close-up, voice-over "fixed in 45 minutes", caption "UPFRONT PRICING"',
    'Scene 4: [0:25-0:30] CTA — Full-screen Sunrise Plumbing blue background, gold logo animation, phone number "(512) 000-0000" slides in, ElevenLabs "Call us now"',
  ],
  avatarAssignments: [
    'Scene 1 & 3: avatar-sunrise-blue-polo, professional male 35-45, blue Sunrise Plumbing polo, neutral Austin home backdrop, confident-warm delivery, direct eye contact, no gestures in hook',
    'Scene 4 CTA: avatar-sunrise-blue-polo, same avatar, facing slightly left, hand gesture pointing to phone number, upbeat close',
    'Alternative TikTok version: avatar-sunrise-casual, slightly younger energy, same script with faster pacing, 15% faster delivery speed setting',
  ],
  voiceAssignments: [
    'Track A — Hook: ElevenLabs voice-id warm-texas-male, "We got the call at 7am and had it fixed before noon", pace 0.95, emotion confident, reverb minimal, -3dB',
    'Track B — Solution: ElevenLabs voice-id warm-texas-male, "Here\'s what our customers say every single time: no surprises, no upselling", pace 1.0, emotion warm, -3dB',
    'Track C — CTA: ElevenLabs voice-id warm-texas-male, "Call Sunrise Plumbing now. (512) 000-0000. Same-day service, upfront pricing, guaranteed.", pace 0.9, emotion enthusiastic, -3dB',
  ],
  cameraMovements: [
    'Scene 1: Static wide establishing shot for 2s, then slow push-in 20% zoom over 1s to create urgency — HeyGen avatar camera setting: center-lock',
    'Scene 2: Higgsfield — slow pan right across Austin neighborhood over 7s, speed 0.3x, conveying community and locality',
    'Scene 3: Higgsfield — handheld slight shake on pipe close-up for authenticity, then smooth cut to static spokesperson framing',
  ],
  motionEffects: [
    'Scene 1 caption "SAME DAY SERVICE": slide in from left at 0:00, hold 2s, fade out at 0:03 — 60px sans-serif bold white with gold drop shadow',
    'Scene 3 lower third "UPFRONT PRICING — No Hidden Fees": slide up from bottom at 0:12, hold 8s, slide back down at 0:20 — Sunrise brand blue background, white text',
    'Scene 4 phone number animation: type-on effect "(512) 000-0000" from left to right over 1.5s starting at 0:26, gold colour, 72px bold',
  ],
  transitions: [
    'Scene 1 → Scene 2: J-cut at 0:03 — audio from Scene 2 (music bed) begins 0.5s before video cut, hard cut on video, no dissolve',
    'Scene 2 → Scene 3: Cross dissolve at 0:10, 12-frame duration (0.4s at 30fps), maintains audio continuity',
    'Scene 3 → Scene 4 CTA: Hard cut at 0:25 synchronized with music accent hit, emphasizes the CTA moment',
  ],
  captionTimeline: [
    'Caption 1: [0:00-0:03] "SAME DAY SERVICE" — center-top position, 60px Arial Bold white, gold outline 2px, slide-in-left animation 0.3s',
    'Caption 2: [0:10-0:20] "Fixed in 45 Minutes — No Upselling" — lower third, 36px Arial white on Sunrise blue bar, slide-up animation',
    'Caption 3: [0:25-0:30] "Call (512) 000-0000" — center screen, 48px Arial Bold gold, typewriter reveal animation, pulsing glow effect',
  ],
  bRollTimeline: [
    'B-roll 1: [0:00-0:03] Higgsfield prompt "burst pipe water spraying under sink, dramatic lighting, photorealistic" — cut to 50% opacity overlay on hook scene, no audio',
    'B-roll 2: [0:03-0:10] Higgsfield prompt "Austin residential neighborhood morning light, wide establishing, warm golden hour" — full screen, music bed at -18dB',
    'B-roll 3: [0:10-0:20] Higgsfield prompt "professional plumber hands repairing copper pipe, close-up macro, sharp focus, dramatic side lighting" — cutaway from spokesperson, 5s duration',
  ],
  musicTimeline: [
    'Music cue 1: [0:00-0:30] Upbeat acoustic guitar track "Austin Warmth" — enters at -18dB on Scene 1, steady throughout, rises to -14dB during Scene 3 Solution, fades to -20dB under CTA voice',
    'Music cue 2: [0:25-0:30] Music swell +4dB under CTA scene, synchronized with logo animation entry at 0:25.5, decays on final frame',
    'Music cue 3: [0:29-0:30] Final musical sting — 1-frame guitar strum accent synchronized with phone number appearance, -12dB',
  ],
  assetManifest: [
    'Asset 1: spokesperson-hero-30s.mp4 — HeyGen export, 1080x1920, 30fps, H.264, spokesperson scenes 1+3+4 combined pre-assembly',
    'Asset 2: broll-package-higgsfield.zip — Higgsfield renders, 3 clips at 1080x1920 + 1 at 1920x1080, 30fps, ProRes 422 for post',
    'Asset 3: voiceover-package-elevenlabs.zip — 3 ElevenLabs audio files (track-A.wav, track-B.wav, track-C.wav), 44.1kHz stereo WAV',
  ],
  qualityChecklist: [
    'QC-001: Brand colours match — verify Sunrise blue #1B4F8A and gold #D4A017 in all text overlays and logo, automated hex-value check',
    'QC-002: Logo placement — top-left corner in all scenes, minimum 48px height, no distortion, automated bounding-box check',
    'QC-003: Audio levels — VO peaks at -3dBFS, music bed at -18dBFS, total integrated loudness -14 LUFS (Instagram standard), automated audio analysis',
  ],
  exportTargets: [
    'Export 1: sunrise-plumbing-reel-v1.mp4 — Instagram Reel, 1080x1920, 30fps, H.264 CRF18, AAC 192kbps, max 90MB, deliver to /exports/instagram/',
    'Export 2: sunrise-plumbing-tiktok-v1.mp4 — TikTok, 1080x1920, 30fps, H.264 CRF18, AAC 192kbps, max 72MB, deliver to /exports/tiktok/',
    'Export 3: sunrise-plumbing-short-v1.mp4 — YouTube Short, 1080x1920, 30fps, H.264 CRF18, AAC 192kbps, max 256MB, deliver to /exports/youtube/',
  ],
  approvalChecklist: [
    'Approval 1: Brand alignment review — Creative Director approves visual style, avatar appearance, colour usage, and logo placement before render submission',
    'Approval 2: Script and voice-over accuracy — Sunrise Plumbing business owner confirms all claims (pricing, phone number, guarantees) are accurate before publish',
    'Approval 3: Technical QA sign-off — QA Lead validates audio levels, export specs, caption accuracy, and platform compliance before delivery',
  ],
})

// ── Mock gateway factory ───────────────────────────────────────────────────────

function makeGateway(responseContent: string, provider: ModelProvider = 'openai'): IModelGateway {
  return {
    invoke: vi.fn().mockResolvedValue({
      content: responseContent,
      provider,
      model: 'gpt-4o',
      tokensUsed: 3200,
      latencyMs: 310,
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

// ── buildVideoProductionPrompt ────────────────────────────────────────────────

describe('buildVideoProductionPrompt()', () => {
  it('includes business name from the creative brief', () => {
    const prompt = buildVideoProductionPrompt(TEST_CREATIVE_BRIEF)
    expect(prompt).toContain('Sunrise Plumbing')
    expect(prompt).toContain('Plumbing Services')
  })

  it('surfaces key creative sections in the prompt', () => {
    const prompt = buildVideoProductionPrompt(TEST_CREATIVE_BRIEF)
    expect(prompt).toContain('Warm professional with deep blue and gold') // visualStyle
    expect(prompt).toContain('Upbeat acoustic guitar') // musicDirection
    expect(prompt).toContain('Jump cuts every 2-3s') // editingInstructions
  })

  it('includes HeyGen and Higgsfield as rendering targets in the prompt', () => {
    const prompt = buildVideoProductionPrompt(TEST_CREATIVE_BRIEF)
    expect(prompt).toContain('HeyGen')
    expect(prompt).toContain('Higgsfield')
    expect(prompt).toContain('ElevenLabs')
  })

  it('includes all 17 output field names in the schema', () => {
    const prompt = buildVideoProductionPrompt(TEST_CREATIVE_BRIEF)
    const fields = [
      'productionPlan',
      'renderSettings',
      'estimatedRuntime',
      'renderQueue',
      'sceneTimeline',
      'avatarAssignments',
      'voiceAssignments',
      'cameraMovements',
      'motionEffects',
      'transitions',
      'captionTimeline',
      'bRollTimeline',
      'musicTimeline',
      'assetManifest',
      'qualityChecklist',
      'exportTargets',
      'approvalChecklist',
    ]
    for (const field of fields) {
      expect(prompt).toContain(field)
    }
  })
})

// ── parseVideoProductionBrief ─────────────────────────────────────────────────

describe('parseVideoProductionBrief()', () => {
  it('parses a valid JSON response into a VideoProductionBrief', () => {
    const brief = parseVideoProductionBrief(VALID_PRODUCTION_JSON, TEST_CREATIVE_BRIEF)
    expect(brief.productionPlan).toContain('Sunrise Plumbing')
    expect(brief.renderQueue).toHaveLength(3)
    expect(brief.sceneTimeline).toHaveLength(4)
    expect(brief.avatarAssignments).toHaveLength(3)
    expect(brief.voiceAssignments).toHaveLength(3)
    expect(brief.cameraMovements).toHaveLength(3)
    expect(brief.motionEffects).toHaveLength(3)
    expect(brief.transitions).toHaveLength(3)
    expect(brief.captionTimeline).toHaveLength(3)
    expect(brief.bRollTimeline).toHaveLength(3)
    expect(brief.musicTimeline).toHaveLength(3)
    expect(brief.assetManifest).toHaveLength(3)
    expect(brief.qualityChecklist).toHaveLength(3)
    expect(brief.exportTargets).toHaveLength(3)
    expect(brief.approvalChecklist).toHaveLength(3)
    expect(brief.generatedAt).toBeInstanceOf(Date)
    expect(brief.sourceCreativeBrief).toBe(TEST_CREATIVE_BRIEF)
  })

  it('strips markdown code fences before parsing', () => {
    const wrapped = '```json\n' + VALID_PRODUCTION_JSON + '\n```'
    const brief = parseVideoProductionBrief(wrapped, TEST_CREATIVE_BRIEF)
    expect(brief.productionPlan).toBeTruthy()
  })

  it('throws when response is not valid JSON', () => {
    expect(() =>
      parseVideoProductionBrief(
        'I cannot produce a video production plan at this time.',
        TEST_CREATIVE_BRIEF
      )
    ).toThrow('non-JSON')
  })

  it('throws when a required string field is missing', () => {
    const incomplete = JSON.parse(VALID_PRODUCTION_JSON) as Record<string, unknown>
    delete incomplete.productionPlan
    expect(() =>
      parseVideoProductionBrief(JSON.stringify(incomplete), TEST_CREATIVE_BRIEF)
    ).toThrow('productionPlan')
  })

  it('throws when a required array field is empty', () => {
    const incomplete = JSON.parse(VALID_PRODUCTION_JSON) as Record<string, unknown>
    incomplete.renderQueue = []
    expect(() =>
      parseVideoProductionBrief(JSON.stringify(incomplete), TEST_CREATIVE_BRIEF)
    ).toThrow('renderQueue')
  })

  it('throws when sceneTimeline is missing', () => {
    const incomplete = JSON.parse(VALID_PRODUCTION_JSON) as Record<string, unknown>
    delete incomplete.sceneTimeline
    expect(() =>
      parseVideoProductionBrief(JSON.stringify(incomplete), TEST_CREATIVE_BRIEF)
    ).toThrow('sceneTimeline')
  })

  it('throws when exportTargets is missing', () => {
    const incomplete = JSON.parse(VALID_PRODUCTION_JSON) as Record<string, unknown>
    delete incomplete.exportTargets
    expect(() =>
      parseVideoProductionBrief(JSON.stringify(incomplete), TEST_CREATIVE_BRIEF)
    ).toThrow('exportTargets')
  })

  it('throws when approvalChecklist is missing', () => {
    const incomplete = JSON.parse(VALID_PRODUCTION_JSON) as Record<string, unknown>
    delete incomplete.approvalChecklist
    expect(() =>
      parseVideoProductionBrief(JSON.stringify(incomplete), TEST_CREATIVE_BRIEF)
    ).toThrow('approvalChecklist')
  })
})

// ── VideoProductionDepartmentService ─────────────────────────────────────────

describe('VideoProductionDepartmentService', () => {
  describe('planProduction()', () => {
    it('returns a completed job with a VideoProductionBrief on success', async () => {
      const service = new VideoProductionDepartmentService(makeGateway(VALID_PRODUCTION_JSON))
      const result = await service.planProduction(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.value.status).toBe('completed')
      expect(result.value.videoProductionBrief).toBeDefined()
      expect(result.value.videoProductionBrief!.renderQueue).toHaveLength(3)
      expect(result.value.videoProductionBrief!.sceneTimeline).toHaveLength(4)
      expect(result.value.creativeBrief).toBe(TEST_CREATIVE_BRIEF)
      expect(result.value.attempts).toBe(1)
    })

    it('records the provider that produced the result', async () => {
      const service = new VideoProductionDepartmentService(
        makeGateway(VALID_PRODUCTION_JSON, 'openai')
      )
      const result = await service.planProduction(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.providerId).toBe('openai')
    })

    it('uses the preferred employee when specified', async () => {
      const service = new VideoProductionDepartmentService(makeGateway(VALID_PRODUCTION_JSON))
      const result = await service.planProduction({
        ...TEST_REQUEST,
        preferredEmployee: 'creative-video-director',
      })

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.employeeId).toBe('creative-video-director')
    })

    it('defaults to video-producer when no preferred employee is set', async () => {
      const service = new VideoProductionDepartmentService(makeGateway(VALID_PRODUCTION_JSON))
      const result = await service.planProduction(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.employeeId).toBe('video-producer')
    })

    it('routes through text providers even though employee primaryProvider is heygen', async () => {
      let capturedProvider: string | undefined
      const gateway: IModelGateway = {
        invoke: vi.fn().mockImplementation(async (req) => {
          capturedProvider = req.provider
          return {
            content: VALID_PRODUCTION_JSON,
            provider: req.provider as ModelProvider,
            model: 'gpt-4o',
            tokensUsed: 3200,
            latencyMs: 310,
          }
        }),
        registeredProviders: () => ['openai'],
      }

      const service = new VideoProductionDepartmentService(gateway)
      await service.planProduction(TEST_REQUEST)

      // video-producer's primaryProvider is 'heygen' but buildProviderOrder
      // falls through to ['openai', 'anthropic'] — the text plan providers
      expect(['openai', 'anthropic']).toContain(capturedProvider)
    })

    it('retries on transient failure and succeeds on second attempt', async () => {
      let callCount = 0
      const gateway: IModelGateway = {
        invoke: vi.fn().mockImplementation(async () => {
          callCount++
          if (callCount === 1) throw new Error('upstream timeout')
          return {
            content: VALID_PRODUCTION_JSON,
            provider: 'openai' as ModelProvider,
            model: 'gpt-4o',
            tokensUsed: 3200,
            latencyMs: 310,
          }
        }),
        registeredProviders: () => ['openai'],
      }

      const service = new VideoProductionDepartmentService(gateway)
      const result = await service.planProduction(TEST_REQUEST)

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
            content: VALID_PRODUCTION_JSON,
            provider: 'anthropic' as ModelProvider,
            model: 'claude-haiku-4-5-20251001',
            tokensUsed: 3200,
            latencyMs: 310,
          }
        }),
        registeredProviders: () => ['anthropic'],
      }

      const service = new VideoProductionDepartmentService(gateway)
      const result = await service.planProduction(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.providerId).toBe('anthropic')
    })

    it('returns MAX_RETRIES_EXCEEDED when all providers and retries fail', async () => {
      const service = new VideoProductionDepartmentService(
        makeFailingGateway('upstream service unavailable')
      )
      const result = await service.planProduction(TEST_REQUEST)

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error.code).toBe('MAX_RETRIES_EXCEEDED')
      expect(result.error.retriable).toBe(false)
    })

    it('returns PROVIDER_NOT_CONFIGURED when no provider is available', async () => {
      const service = new VideoProductionDepartmentService(
        makeFailingGateway('No provider available. Requested: "openai"')
      )
      const result = await service.planProduction(TEST_REQUEST)

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error.code).toBe('PROVIDER_NOT_CONFIGURED')
    })

    it('returns INVALID_RESPONSE when the provider returns non-JSON', async () => {
      const service = new VideoProductionDepartmentService(
        makeGateway('I am unable to produce a video production plan.')
      )
      const result = await service.planProduction(TEST_REQUEST)

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error.code).toBe('INVALID_RESPONSE')
    })

    it('preserves the creative brief on the job', async () => {
      const service = new VideoProductionDepartmentService(makeGateway(VALID_PRODUCTION_JSON))
      const result = await service.planProduction(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.creativeBrief.visualStyle).toBe(TEST_CREATIVE_BRIEF.visualStyle)
    })
  })

  describe('getJob()', () => {
    it('returns the job by ID after completion', async () => {
      const service = new VideoProductionDepartmentService(makeGateway(VALID_PRODUCTION_JSON))
      const result = await service.planProduction(TEST_REQUEST)

      expect(result.ok).toBe(true)
      if (!result.ok) return

      const retrieved = service.getJob(result.value.id)
      expect(retrieved).toBeDefined()
      expect(retrieved!.id).toBe(result.value.id)
      expect(retrieved!.status).toBe('completed')
    })

    it('returns undefined for an unknown job ID', () => {
      const service = new VideoProductionDepartmentService(makeGateway(VALID_PRODUCTION_JSON))
      expect(service.getJob('nonexistent')).toBeUndefined()
    })
  })

  describe('listJobs()', () => {
    it('returns all jobs across multiple requests', async () => {
      const service = new VideoProductionDepartmentService(makeGateway(VALID_PRODUCTION_JSON))

      await service.planProduction(TEST_REQUEST)
      await service.planProduction(TEST_REQUEST)

      expect(service.listJobs()).toHaveLength(2)
    })

    it('returns an empty array when no jobs have been run', () => {
      const service = new VideoProductionDepartmentService(makeGateway(VALID_PRODUCTION_JSON))
      expect(service.listJobs()).toEqual([])
    })
  })
})
