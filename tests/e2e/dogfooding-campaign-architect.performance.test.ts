/**
 * Phase 8 hermetic performance baseline — Campaign Architect dogfooding path
 * Architect requestIds: de6815fb (slice) + d9b878be (allowlist)
 *
 * Explicitly NOT:
 * - production-capacity / load / soak testing
 * - live-provider latency measurement
 * - M2 production proof
 *
 * Hermetic setup is copied from dogfooding-campaign-architect.journey.test.ts
 * (in-memory repos + mocked modelGateway). This file does not import or
 * modify the journey test.
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

// ── Baseline profile (documented in docs/performance/campaign-architect-hermetic-baseline.md)

/** Sequential end-to-end samples for a stable local Vitest profile. */
const SEQUENTIAL_RUNS = 5

/**
 * Generous per-run wall-clock ceiling for local Vitest.
 * Hermetic body is typically tens of ms; ceiling absorbs cold transforms,
 * GC, and shared-box noise without becoming a flaky hard SLA.
 */
const PER_RUN_CEILING_MS = 5_000

/** Total wall-clock budget for all sequential samples + assertions. */
const TOTAL_CEILING_MS = 25_000

// ── Fixtures ────────────────────────────────────────────────────────────────

const TENANT = 'tenant_phase8_perf' as TenantId
const ORG = 'org_phase8_dogfood_perf' as OrganizationId

const DETERMINISTIC_SCRIPT_TITLE = 'Hermetic Spokesperson Script — Phase8 Perf'
const DETERMINISTIC_SCRIPT_BODY =
  'Still hiring humans for marketing? Koolerr gives you an AI workforce. Deterministic hermetic perf proof.'

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
                name: 'Phase8 Architect Perf Campaign',
                objectiveSummary: 'Drive demo requests via hermetic dogfooding perf path',
                targetAudience: { segment: 'owners' },
                channels: ['meta', 'instagram'],
                budgetPercent: 100,
                durationWeeks: 2,
                keyMessages: ['AI workforce', 'dogfood proof'],
                successMetrics: ['listed_deliverables'],
              },
            ],
            strategyRationale: 'Single campaign for hermetic create→run→deliverables perf baseline',
          })
        )
      case 'create_marketing_plan':
        return gatewayOk(
          JSON.stringify({
            title: 'Phase8 Hermetic Marketing Plan Perf',
            executiveSummary: 'Deterministic plan for architect perf baseline',
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
                primaryText: 'Deterministic hermetic ad copy for Phase 8 perf.',
                callToAction: 'Book a demo',
                description: 'Phase8 perf',
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
        throw new Error(`Unexpected modelGateway action in hermetic perf baseline: ${req.action}`)
    }
  })
}

function resetHermeticState(): void {
  vi.clearAllMocks()
  _configureDogfoodingRepository(new InMemoryDogfoodingRepository())
  _configureDeliverablesRepository(new InMemoryDeliverablesRepository())
  _configureWorkforceEngineRepository(new InMemoryWorkforceEngineRepository())
  _configureBusinessBrainRepository(new InMemoryBusinessBrainRepository())
  installDeterministicModelGateway()
}

/**
 * One end-to-end createCampaign → engagement run → deliverables journey.
 * Returns after success assertions so callers only time successful paths.
 */
async function runCreateCampaignToDeliverablesJourney(): Promise<void> {
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
      title: 'Phase8 Dogfooding Perf Objective',
      description: 'Hermetic architect perf: create → run → deliverables',
      goalType: 'lead_generation',
      targetAudience: 'local service business owners',
      successMetrics: ['engagement_run_completed', 'deliverables_listed'],
      budgetCents: 50_000,
    }),
    'createObjective'
  )

  const campaign = unwrap(
    await dogfoodingService.createCampaign({
      organizationId: ORG,
      objectiveId: objective.id,
      planId: null,
      name: 'Phase8 Architect Perf Campaign',
      objectiveSummary: 'Drive demo requests via hermetic dogfooding perf path',
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

  const run = unwrap(
    await workforceEngineService.triggerEngagementRun({
      tenantId: TENANT,
      workforceId: workforce.id as WorkforceId,
      organizationId: ORG,
      objective: objective.title,
      participantIds: [],
      context: { campaignId: campaign.id, hermetic: true, perf: true },
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

  expect(modelGateway.invoke).toHaveBeenCalled()
  const actions = vi.mocked(modelGateway.invoke).mock.calls.map(([req]) => req.action)
  expect(actions).toContain('market_research')
  expect(actions).toContain('write_video_script')

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
}

function summarize(durationsMs: number[]) {
  const sorted = [...durationsMs].sort((a, b) => a - b)
  const sum = sorted.reduce((acc, n) => acc + n, 0)
  const mean = sum / sorted.length
  const min = sorted[0]!
  const max = sorted[sorted.length - 1]!
  const median =
    sorted.length % 2 === 1
      ? sorted[(sorted.length - 1) / 2]!
      : (sorted[sorted.length / 2 - 1]! + sorted[sorted.length / 2]!) / 2
  return { min, max, mean, median, samples: sorted }
}

// ── Performance baseline ────────────────────────────────────────────────────

describe('Phase 8 hermetic performance — campaign architect create→run→deliverables', () => {
  beforeEach(() => {
    resetHermeticState()
  })

  it(`records ${SEQUENTIAL_RUNS} sequential successful journeys under local Vitest ceilings`, async () => {
    const durationsMs: number[] = []
    const suiteStarted = performance.now()

    for (let i = 0; i < SEQUENTIAL_RUNS; i++) {
      // Fresh in-memory state each sample — no cross-run bleed.
      resetHermeticState()

      const started = performance.now()
      await runCreateCampaignToDeliverablesJourney()
      const elapsed = performance.now() - started
      durationsMs.push(elapsed)

      expect(
        elapsed,
        `run ${i + 1}/${SEQUENTIAL_RUNS} exceeded per-run ceiling ${PER_RUN_CEILING_MS}ms (got ${elapsed.toFixed(1)}ms)`
      ).toBeLessThan(PER_RUN_CEILING_MS)
    }

    const totalElapsed = performance.now() - suiteStarted
    const stats = summarize(durationsMs)

    // Sample stats for baseline updates (Vitest captures console output).
    // eslint-disable-next-line no-console
    console.info(
      JSON.stringify({
        scenario: 'createCampaign→engagement_run→deliverables',
        profile: 'sequential',
        sequentialRuns: SEQUENTIAL_RUNS,
        perRunCeilingMs: PER_RUN_CEILING_MS,
        totalCeilingMs: TOTAL_CEILING_MS,
        durationsMs: stats.samples.map((n) => Number(n.toFixed(2))),
        minMs: Number(stats.min.toFixed(2)),
        maxMs: Number(stats.max.toFixed(2)),
        meanMs: Number(stats.mean.toFixed(2)),
        medianMs: Number(stats.median.toFixed(2)),
        totalElapsedMs: Number(totalElapsed.toFixed(2)),
        note: 'Hermetic local Vitest baseline — NOT production capacity / NOT live-provider / NOT M2',
      })
    )

    expect(durationsMs).toHaveLength(SEQUENTIAL_RUNS)
    expect(stats.max).toBeLessThan(PER_RUN_CEILING_MS)
    expect(stats.mean).toBeLessThan(PER_RUN_CEILING_MS)
    expect(
      totalElapsed,
      `sequential profile exceeded total ceiling ${TOTAL_CEILING_MS}ms (got ${totalElapsed.toFixed(1)}ms)`
    ).toBeLessThan(TOTAL_CEILING_MS)
  })
})
