/**
 * Phase 8 hermetic E2E — dogfooding Campaign Architect journey
 * Architect requestIds: 1c91593a (slice) + f31a3ad7 (journey+allowlist)
 *
 * Remaining gaps (explicitly NOT covered):
 * - Not live-provider validation (modelGateway is mocked in-process)
 * - Not performance
 * - Not M2 production proof
 *
 * Approach: exercise the real runDogfoodingPipeline against in-memory
 * dogfooding / workforce / deliverables / business-brain repositories with a
 * deterministic modelGateway double. Proves createCampaign → engagement run
 * completion → listed deliverables. No network, secrets, Playwright, or
 * live providers.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type {
  EngagementRunId,
  OrganizationId,
  PlatformResult,
  TenantId,
  WorkforceId,
} from '@/shared/types'

// ── Provider / side-effect boundaries (mocked; all doubles live in this file) ─

vi.mock('@/shared/model-gateway', () => ({
  modelGateway: { invoke: vi.fn() },
}))

vi.mock('@/shared/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { modelGateway } from '@/shared/model-gateway'
import { dogfoodingService, _configureDogfoodingRepository } from '@/domains/dogfooding/service'
import { InMemoryDogfoodingRepository } from '@/domains/dogfooding/in-memory-repository'
import {
  deliverablesService,
  _configureDeliverablesRepository,
} from '@/domains/deliverables/service'
import { InMemoryDeliverablesRepository } from '@/domains/deliverables/in-memory-repository'
import {
  workforceEngineService,
  _configureWorkforceEngineRepository,
} from '@/domains/workforce-engine/service'
import { InMemoryWorkforceEngineRepository } from '@/domains/workforce-engine/in-memory-repository'
import {
  businessBrainService,
  _configureBusinessBrainRepository,
} from '@/domains/business-brain/service'
import { InMemoryBusinessBrainRepository } from '@/domains/business-brain/in-memory-repository'
import { runDogfoodingPipeline } from '@/infrastructure/dogfooding/pipeline'

// ── Fixtures ────────────────────────────────────────────────────────────────

const TENANT = 'tenant_phase8_e2e' as TenantId
const ORG = 'org_phase8_dogfood_journey' as OrganizationId

const DETERMINISTIC_SCRIPT_TITLE = 'Hermetic Spokesperson Script — Phase8'
const DETERMINISTIC_SCRIPT_BODY =
  'Still hiring humans for marketing? Koolerr gives you an AI workforce. Deterministic hermetic proof.'

function unwrap<T>(result: PlatformResult<T>, label: string): T {
  if (!result.ok) {
    throw new Error(`${label} failed: ${result.error.code} — ${result.error.message}`)
  }
  return result.value
}

function gatewayOk(content: string) {
  return {
    content,
    provider: 'openai' as const,
    model: 'gpt-4o-hermetic',
    tokensUsed: 42,
    latencyMs: 1,
  }
}

function installDeterministicModelGateway(): void {
  vi.mocked(modelGateway.invoke).mockImplementation(async (req) => {
    switch (req.action) {
      case 'market_research':
        return gatewayOk(
          'Hermetic research: local service owners respond to AI-workforce messaging.'
        )
      case 'create_campaign_strategy':
        return gatewayOk(
          JSON.stringify({
            campaigns: [
              {
                name: 'Phase8 Architect Campaign',
                objectiveSummary: 'Drive demo requests via hermetic dogfooding journey',
                targetAudience: { segment: 'owners' },
                channels: ['meta', 'instagram'],
                budgetPercent: 100,
                durationWeeks: 2,
                keyMessages: ['AI workforce', 'dogfood proof'],
                successMetrics: ['listed_deliverables'],
              },
            ],
            strategyRationale: 'Single campaign for hermetic create→run→deliverables proof',
          })
        )
      case 'create_marketing_plan':
        return gatewayOk(
          JSON.stringify({
            title: 'Phase8 Hermetic Marketing Plan',
            executiveSummary: 'Deterministic plan for architect journey E2E',
            targetAudience: { segment: 'owners' },
            messagingPillars: ['trust', 'speed', 'dogfood'],
            channelMix: ['meta', 'instagram'],
            campaignPhases: [{ name: 'awareness' }],
            kpis: ['deliverables_listed'],
          })
        )
      case 'write_ad_copy':
        return gatewayOk(
          JSON.stringify({
            variants: [
              {
                variantName: 'A',
                headline: 'Hire AI, not headcount',
                primaryText: 'Deterministic hermetic ad copy for Phase 8.',
                callToAction: 'Book a demo',
                description: 'Phase8 E2E',
              },
            ],
          })
        )
      case 'create_creative_direction':
        // Must include a video creative so Step 4c stores a Deliverable.
        return gatewayOk(
          JSON.stringify({
            visualStrategy: 'Clean product demo with founder spokesperson',
            creatives: [
              {
                type: 'image',
                concept: 'Product hero',
                prompt: 'Clean workspace with Koolerr dashboard',
                adFormat: 'feed',
                metadata: {},
              },
              {
                type: 'video',
                concept: 'Spokesperson hook',
                prompt: 'Introduce Koolerr as the AI workforce platform',
                adFormat: 'landscape',
                metadata: { angle: 'pain-point' },
              },
            ],
          })
        )
      case 'write_video_script':
        return gatewayOk(
          JSON.stringify({
            title: DETERMINISTIC_SCRIPT_TITLE,
            script: DETERMINISTIC_SCRIPT_BODY,
            platform: 'facebook',
            estimatedDurationSec: 45,
          })
        )
      default:
        throw new Error(`Unexpected modelGateway action in hermetic journey: ${req.action}`)
    }
  })
}

// ── Journey ─────────────────────────────────────────────────────────────────

describe('Phase 8 hermetic E2E — dogfooding campaign architect journey', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Fresh in-memory state — no persistent bleed across runs.
    _configureDogfoodingRepository(new InMemoryDogfoodingRepository())
    _configureDeliverablesRepository(new InMemoryDeliverablesRepository())
    _configureWorkforceEngineRepository(new InMemoryWorkforceEngineRepository())
    _configureBusinessBrainRepository(new InMemoryBusinessBrainRepository())

    installDeterministicModelGateway()
  })

  it('createCampaign → mocked engagement run completes → deliverables listed', async () => {
    // Optional brain so pipeline progress memories succeed (non-throwing either way).
    unwrap(
      await businessBrainService.createBusinessBrain({
        tenantId: TENANT,
        organizationId: ORG,
      }),
      'createBusinessBrain'
    )

    const objective = unwrap(
      await dogfoodingService.createObjective({
        organizationId: ORG,
        title: 'Phase8 Dogfooding Objective',
        description: 'Hermetic architect journey: prove create → run → deliverables',
        goalType: 'lead_generation',
        targetAudience: 'local service business owners',
        successMetrics: ['engagement_run_completed', 'deliverables_listed'],
        budgetCents: 50_000,
      }),
      'createObjective'
    )

    // 1) createCampaign (product entry — Campaign Architect path)
    const campaign = unwrap(
      await dogfoodingService.createCampaign({
        organizationId: ORG,
        objectiveId: objective.id,
        planId: null,
        name: 'Phase8 Architect Campaign',
        objectiveSummary: 'Drive demo requests via hermetic dogfooding journey',
        targetAudience: { segment: 'owners' },
        budgetCents: 50_000,
        startDate: null,
        endDate: null,
        channels: ['meta'],
        status: 'planning',
        metaCampaignId: null,
        engagementRunId: null,
      }),
      'createCampaign'
    )
    expect(campaign.id).toBeTruthy()
    expect(campaign.status).toBe('planning')
    expect(campaign.engagementRunId).toBeNull()

    const workforce = unwrap(
      await workforceEngineService.registerWorkforce({
        tenantId: TENANT,
        organizationId: ORG,
        name: 'Internal Marketing Department',
        businessFunction: 'Internal Marketing',
        digitalEmployees: [],
      }),
      'registerWorkforce'
    )

    // 2) mocked engagement run (real workforce trigger + real dogfooding pipeline;
    //    only modelGateway / providers are doubled)
    const run = unwrap(
      await workforceEngineService.triggerEngagementRun({
        tenantId: TENANT,
        workforceId: workforce.id as WorkforceId,
        organizationId: ORG,
        objective: objective.title,
        participantIds: [],
        context: { campaignId: campaign.id, hermetic: true },
      }),
      'triggerEngagementRun'
    )
    expect(run.status).toBe('pending')

    await runDogfoodingPipeline({
      tenantId: TENANT,
      organizationId: ORG,
      workforceId: workforce.id as WorkforceId,
      engagementRunId: run.id as EngagementRunId,
      objective,
      existingCampaignId: campaign.id,
    })

    const completedRun = unwrap(
      await workforceEngineService.getEngagementRun(run.id, ORG),
      'getEngagementRun'
    )
    expect(completedRun.status).toBe('completed')

    const campaigns = unwrap(await dogfoodingService.listCampaigns(ORG), 'listCampaigns')
    const enriched = campaigns.find((c) => c.id === campaign.id)
    expect(enriched).toBeDefined()
    expect(enriched!.engagementRunId).toBe(run.id)
    expect(enriched!.status).toBe('ready')
    expect(enriched!.planId).toBeTruthy()

    // Providers were mocked — no live invoke path.
    expect(modelGateway.invoke).toHaveBeenCalled()
    const actions = vi.mocked(modelGateway.invoke).mock.calls.map(([req]) => req.action)
    expect(actions).toContain('market_research')
    expect(actions).toContain('write_video_script')

    // 3) deliverables list assertion (real deliverablesService + in-memory repo)
    const listed = unwrap(
      await deliverablesService.listDeliverables({ organizationId: ORG }),
      'listDeliverables'
    )
    const scripts = listed.filter((d) => d.type === 'video_script' && d.engagementRunId === run.id)
    expect(scripts.length).toBeGreaterThanOrEqual(1)
    expect(scripts[0]!.title).toBe(DETERMINISTIC_SCRIPT_TITLE)
    expect(scripts[0]!.content.script).toBe(DETERMINISTIC_SCRIPT_BODY)
    expect(scripts[0]!.status).toBe('draft')
    expect(scripts[0]!.attributedTo).toContain('video-producer')
  })
})
