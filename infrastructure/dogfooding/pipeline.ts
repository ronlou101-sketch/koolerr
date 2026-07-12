import type {
  DigitalEmployeeId,
  EngagementRunId,
  OrganizationId,
  TenantId,
  WorkforceId,
} from '@/shared/types'
import { modelGateway } from '@/shared/model-gateway'
import { businessBrainService } from '@/domains/business-brain'
import { workforceEngineService } from '@/domains/workforce-engine'
import { _dogfoodingRepository } from '@/domains/dogfooding/service'
import { ensureMarketingTrustRules } from '@/domains/dogfooding/workforce'
import { logger } from '@/shared/lib/logger'
import {
  buildResearchPrompt,
  buildStrategyPrompt,
  buildCMOPlanPrompt,
  buildCopywriterPrompt,
  buildCreativeDirectorPrompt,
  RESEARCHER_SYSTEM_CONTEXT,
  STRATEGIST_SYSTEM_CONTEXT,
  CMO_SYSTEM_CONTEXT,
  COPYWRITER_SYSTEM_CONTEXT,
  CREATIVE_DIRECTOR_SYSTEM_CONTEXT,
} from './prompts'
import type { DogfoodingObjective } from '@/domains/dogfooding'

export interface DogfoodingPipelineInput {
  tenantId: TenantId
  organizationId: OrganizationId
  workforceId: WorkforceId
  engagementRunId: EngagementRunId
  objective: DogfoodingObjective
  // When set, the pipeline enriches this existing campaign instead of creating a new one.
  // The first strategy spec populates this campaign; additional specs create new records.
  existingCampaignId?: string
}

function extractJson<T>(content: string): T | null {
  const trimmed = content.trim()
  try {
    return JSON.parse(trimmed) as T
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return JSON.parse(match[0]) as T
      } catch {
        return null
      }
    }
    return null
  }
}

async function invokeAgent(
  input: DogfoodingPipelineInput,
  agentId: string,
  action: string,
  prompt: string,
  systemContext: string
): Promise<string> {
  const response = await modelGateway.invoke({
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    workforceId: input.workforceId,
    digitalEmployeeId: agentId as DigitalEmployeeId,
    engagementRunId: input.engagementRunId,
    action,
    prompt,
    systemContext,
    provider: 'openai',
    maxTokens: 2000,
  })
  return response.content
}

async function recordProgress(
  input: DogfoodingPipelineInput,
  step: string,
  status: 'running' | 'completed' | 'failed',
  error?: string
): Promise<void> {
  await businessBrainService.storeMemory({
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    memory: {
      organizationId: input.organizationId,
      type: 'knowledge',
      content: {
        domain: 'dogfooding-pipeline',
        objectiveId: input.objective.id,
        step,
        status,
        ...(error ? { error } : {}),
        timestamp: new Date().toISOString(),
      },
      source: 'dogfooding-pipeline',
      relevanceScope: [input.engagementRunId],
    },
  })
}

export async function runDogfoodingPipeline(input: DogfoodingPipelineInput): Promise<void> {
  const { tenantId, organizationId, workforceId, engagementRunId, objective } = input

  ensureMarketingTrustRules(organizationId)

  logger.info('[DOGFOODING_PIPELINE] Starting pipeline', {
    objectiveId: objective.id,
    engagementRunId,
  })

  await workforceEngineService.updateEngagementRunStatus({
    tenantId,
    id: engagementRunId,
    status: 'running',
    updatedAt: new Date(),
  })

  // ── Step 1: Research ────────────────────────────────────────────────────────

  await recordProgress(input, 'research', 'running')
  logger.info('[DOGFOODING_PIPELINE] Step 1: Research')

  let researchContent: string
  try {
    researchContent = await invokeAgent(
      input,
      'marketing-researcher',
      'market_research',
      buildResearchPrompt(objective),
      RESEARCHER_SYSTEM_CONTEXT
    )
  } catch (e) {
    logger.error('[DOGFOODING_PIPELINE] Research failed', { error: String(e) })
    await recordProgress(input, 'research', 'failed', String(e))
    await workforceEngineService.updateEngagementRunStatus({
      tenantId,
      id: engagementRunId,
      status: 'failed',
      updatedAt: new Date(),
    })
    await _dogfoodingRepository.updateObjectiveStatus(objective.id, 'paused')
    return
  }

  await businessBrainService.storeMemory({
    tenantId,
    organizationId,
    memory: {
      organizationId,
      type: 'knowledge',
      content: {
        domain: 'dogfooding-research',
        objectiveId: objective.id,
        research: researchContent,
      },
      source: 'marketing-researcher',
      relevanceScope: [engagementRunId, `objective:${objective.id}`],
    },
  })
  await recordProgress(input, 'research', 'completed')

  // ── Step 2: Campaign Strategy ───────────────────────────────────────────────

  await recordProgress(input, 'strategy', 'running')
  logger.info('[DOGFOODING_PIPELINE] Step 2: Strategy')

  interface StrategyResult {
    campaigns: Array<{
      name: string
      objectiveSummary: string
      targetAudience: Record<string, unknown>
      channels: string[]
      budgetPercent: number
      durationWeeks: number
      keyMessages: string[]
      successMetrics: string[]
    }>
    strategyRationale: string
  }

  let strategyResult: StrategyResult | null
  let strategyContent: string
  try {
    strategyContent = await invokeAgent(
      input,
      'marketing-strategist',
      'create_campaign_strategy',
      buildStrategyPrompt(objective, researchContent),
      STRATEGIST_SYSTEM_CONTEXT
    )
    strategyResult = extractJson<StrategyResult>(strategyContent)
  } catch (e) {
    logger.error('[DOGFOODING_PIPELINE] Strategy failed', { error: String(e) })
    await recordProgress(input, 'strategy', 'failed', String(e))
    await workforceEngineService.updateEngagementRunStatus({
      tenantId,
      id: engagementRunId,
      status: 'failed',
      updatedAt: new Date(),
    })
    await _dogfoodingRepository.updateObjectiveStatus(objective.id, 'paused')
    return
  }

  await recordProgress(input, 'strategy', 'completed')

  // ── Step 3: CMO Marketing Plan ──────────────────────────────────────────────

  await recordProgress(input, 'cmo-plan', 'running')
  logger.info('[DOGFOODING_PIPELINE] Step 3: CMO Marketing Plan')

  interface CMOPlanResult {
    title: string
    executiveSummary: string
    targetAudience: Record<string, unknown>
    messagingPillars: string[]
    channelMix: string[]
    campaignPhases: Record<string, unknown>[]
    kpis: string[]
  }

  let cmoPlanResult: CMOPlanResult | null
  let cmoPlanContent: string
  try {
    cmoPlanContent = await invokeAgent(
      input,
      'marketing-cmo',
      'create_marketing_plan',
      buildCMOPlanPrompt(objective, researchContent, strategyContent ?? ''),
      CMO_SYSTEM_CONTEXT
    )
    cmoPlanResult = extractJson<CMOPlanResult>(cmoPlanContent)
  } catch (e) {
    logger.error('[DOGFOODING_PIPELINE] CMO plan failed', { error: String(e) })
    await recordProgress(input, 'cmo-plan', 'failed', String(e))
    await workforceEngineService.updateEngagementRunStatus({
      tenantId,
      id: engagementRunId,
      status: 'failed',
      updatedAt: new Date(),
    })
    await _dogfoodingRepository.updateObjectiveStatus(objective.id, 'paused')
    return
  }

  const plan = await _dogfoodingRepository.createMarketingPlan({
    organizationId,
    objectiveId: objective.id,
    title: cmoPlanResult?.title ?? `Marketing Plan — ${objective.title}`,
    executiveSummary: cmoPlanResult?.executiveSummary ?? cmoPlanContent.slice(0, 500),
    targetAudience: cmoPlanResult?.targetAudience ?? {},
    messagingPillars: cmoPlanResult?.messagingPillars ?? [],
    channelMix: cmoPlanResult?.channelMix ?? [],
    campaignPhases: cmoPlanResult?.campaignPhases ?? [],
    kpis: cmoPlanResult?.kpis ?? [],
    rawContent: cmoPlanContent,
    status: 'draft',
    engagementRunId,
  })
  await recordProgress(input, 'cmo-plan', 'completed')

  const messagingPillars = cmoPlanResult?.messagingPillars ?? []

  // ── Step 4: Campaigns + Copy + Creatives ────────────────────────────────────

  const campaignSpecs = strategyResult?.campaigns ?? [
    {
      name: objective.title,
      objectiveSummary: objective.description,
      targetAudience: {},
      channels: ['facebook', 'instagram'],
      budgetPercent: 100,
      durationWeeks: 4,
      keyMessages: messagingPillars.slice(0, 3),
      successMetrics: [],
    },
  ]

  for (const [index, spec] of campaignSpecs.entries()) {
    logger.info('[DOGFOODING_PIPELINE] Processing campaign', { name: spec.name })

    const campaignBudget = Math.round((objective.budgetCents * (spec.budgetPercent ?? 100)) / 100)

    // If the caller supplied an existing campaign (from the Campaign Architect wizard),
    // enrich it rather than creating a duplicate. Additional strategy specs still
    // create new campaign records as supplementary execution campaigns.
    const campaign =
      index === 0 && input.existingCampaignId
        ? await _dogfoodingRepository.updateCampaignDetails(input.existingCampaignId, {
            planId: plan.id,
            engagementRunId,
          })
        : await _dogfoodingRepository.createCampaign({
            organizationId,
            objectiveId: objective.id,
            planId: plan.id,
            name: spec.name,
            objectiveSummary: spec.objectiveSummary,
            targetAudience: spec.targetAudience,
            budgetCents: campaignBudget,
            startDate: null,
            endDate: null,
            channels: spec.channels,
            status: 'planning',
            metaCampaignId: null,
            engagementRunId,
          })

    // Step 4a: Ad Copy
    await recordProgress(input, `copy:${campaign.id}`, 'running')
    try {
      const copyContent = await invokeAgent(
        input,
        'marketing-copywriter',
        'write_ad_copy',
        buildCopywriterPrompt(spec.name, spec.targetAudience, messagingPillars),
        COPYWRITER_SYSTEM_CONTEXT
      )

      interface CopyResult {
        variants: Array<{
          variantName: string
          headline: string
          primaryText: string
          callToAction: string
          description?: string
        }>
      }

      const copyResult = extractJson<CopyResult>(copyContent)

      const variants = copyResult?.variants ?? []

      for (const variant of variants) {
        await _dogfoodingRepository.createAdCopyVariant({
          organizationId,
          campaignId: campaign.id,
          engagementRunId,
          digitalEmployeeId: 'marketing-copywriter',
          modelProvider: 'openai',
          variantName: variant.variantName ?? 'Variant',
          headline: variant.headline ?? '',
          primaryText: variant.primaryText ?? '',
          callToAction: variant.callToAction ?? 'Learn More',
          description: variant.description ?? null,
          urlParameters: {},
          status: 'draft',
          performanceScore: null,
        })
      }
      await recordProgress(input, `copy:${campaign.id}`, 'completed')
    } catch (e) {
      logger.warn('[DOGFOODING_PIPELINE] Copy generation failed', {
        campaign: spec.name,
        error: String(e),
      })
      await recordProgress(input, `copy:${campaign.id}`, 'failed', String(e))
    }

    // Step 4b: Creative Direction
    await recordProgress(input, `creative:${campaign.id}`, 'running')
    try {
      const creativeContent = await invokeAgent(
        input,
        'marketing-creative-director',
        'create_creative_direction',
        buildCreativeDirectorPrompt(spec.name, spec.targetAudience, messagingPillars),
        CREATIVE_DIRECTOR_SYSTEM_CONTEXT
      )

      interface CreativeDirectionResult {
        visualStrategy: string
        creatives: Array<{
          type: string
          concept: string
          prompt: string
          adFormat: string
          metadata: Record<string, unknown>
        }>
      }

      const creativeResult = extractJson<CreativeDirectionResult>(creativeContent)

      const creatives = creativeResult?.creatives ?? []

      for (const cr of creatives) {
        await _dogfoodingRepository.createCreative({
          organizationId,
          campaignId: campaign.id,
          engagementRunId,
          digitalEmployeeId: 'marketing-creative-director',
          modelProvider: 'openai',
          type: (cr.type as 'image' | 'video' | 'carousel' | 'story') ?? 'image',
          prompt: cr.prompt ?? cr.concept ?? '',
          assetUrl: null,
          thumbnailUrl: null,
          metadata: {
            concept: cr.concept,
            adFormat: cr.adFormat,
            visualStrategy: creativeResult?.visualStrategy,
            ...cr.metadata,
          },
          status: 'planned',
        })
      }
      await recordProgress(input, `creative:${campaign.id}`, 'completed')
    } catch (e) {
      logger.warn('[DOGFOODING_PIPELINE] Creative direction failed', {
        campaign: spec.name,
        error: String(e),
      })
      await recordProgress(input, `creative:${campaign.id}`, 'failed', String(e))
    }

    await _dogfoodingRepository.updateCampaignStatus(campaign.id, 'ready')
  }

  // ── Finalise ────────────────────────────────────────────────────────────────

  await _dogfoodingRepository.updateObjectiveStatus(objective.id, 'active', engagementRunId)

  await workforceEngineService.updateEngagementRunStatus({
    tenantId,
    id: engagementRunId,
    status: 'completed',
    updatedAt: new Date(),
  })

  logger.info('[DOGFOODING_PIPELINE] Pipeline completed', {
    objectiveId: objective.id,
    engagementRunId,
    campaignCount: campaignSpecs.length,
  })
}
