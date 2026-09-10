import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PlatformErrorCode } from '@/shared/types'
import type { OrganizationId, PlatformResult } from '@/shared/types'
import { dogfoodingService, _configureDogfoodingRepository } from './service'
import { InMemoryDogfoodingRepository } from './in-memory-repository'
import type { IDogfoodingRepository } from './repository'
import type {
  AdCopyVariant,
  CreateCampaignApprovalEventInput,
  CreateCampaignAssetInput,
  CreateCampaignCalendarSlotInput,
  CreateCampaignCaptionInput,
  CreateCampaignHashtagSetInput,
  CreateCampaignPublishEventInput,
  CreateCampaignScriptInput,
  CreateObjectiveInput,
  DogfoodingCampaign,
  DogfoodingCreative,
  DogfoodingLearning,
  MarketingPlan,
  MetaConnection,
} from './types'

// ── Fixtures ────────────────────────────────────────────────────────────────

const ORG = 'org_dogfooding' as OrganizationId
const OTHER_ORG = 'org_other' as OrganizationId
const CAMPAIGN = 'campaign_alpha'
const OTHER_CAMPAIGN = 'campaign_beta'

type NewCampaign = Omit<DogfoodingCampaign, 'id' | 'createdAt' | 'updatedAt'>
type NewCopyVariant = Omit<
  AdCopyVariant,
  'id' | 'createdAt' | 'updatedAt' | 'approvalNote' | 'approvedAt' | 'publishStatus'
>
type NewCreative = Omit<
  DogfoodingCreative,
  'id' | 'createdAt' | 'updatedAt' | 'approvalNote' | 'approvedAt' | 'publishStatus'
>
type NewLearning = Omit<DogfoodingLearning, 'id' | 'createdAt'>
type NewMarketingPlan = Omit<MarketingPlan, 'id' | 'createdAt' | 'updatedAt'>
type NewMetaConnection = Omit<MetaConnection, 'id' | 'createdAt' | 'updatedAt'>

function objectiveInput(overrides: Partial<CreateObjectiveInput> = {}): CreateObjectiveInput {
  return {
    organizationId: ORG,
    title: 'Grow signups',
    description: 'Increase qualified signups from local service businesses',
    goalType: 'lead_generation',
    ...overrides,
  }
}

function campaignInput(overrides: Partial<NewCampaign> = {}): NewCampaign {
  return {
    organizationId: ORG,
    objectiveId: 'objective_1',
    planId: null,
    name: 'Spring launch',
    objectiveSummary: 'Drive demo requests',
    targetAudience: { segment: 'owners' },
    budgetCents: 50_000,
    startDate: null,
    endDate: null,
    channels: ['meta'],
    status: 'planning',
    metaCampaignId: null,
    engagementRunId: null,
    ...overrides,
  }
}

function copyVariantInput(overrides: Partial<NewCopyVariant> = {}): NewCopyVariant {
  return {
    organizationId: ORG,
    campaignId: CAMPAIGN,
    engagementRunId: null,
    digitalEmployeeId: null,
    modelProvider: null,
    variantName: 'A',
    headline: 'Stop buying software',
    primaryText: 'Start hiring AI.',
    callToAction: 'Learn more',
    description: null,
    urlParameters: {},
    status: 'draft',
    performanceScore: null,
    ...overrides,
  }
}

function creativeInput(overrides: Partial<NewCreative> = {}): NewCreative {
  return {
    organizationId: ORG,
    campaignId: CAMPAIGN,
    engagementRunId: null,
    digitalEmployeeId: null,
    modelProvider: null,
    type: 'image',
    prompt: 'A calm workspace at sunrise',
    assetUrl: null,
    thumbnailUrl: null,
    metadata: {},
    status: 'ready',
    ...overrides,
  }
}

function learningInput(overrides: Partial<NewLearning> = {}): NewLearning {
  return {
    organizationId: ORG,
    campaignId: CAMPAIGN,
    objectiveId: null,
    learningType: 'copy',
    insight: 'Short headlines outperform long ones',
    confidence: 'medium',
    actionable: true,
    applied: false,
    extractedBy: 'analyst',
    ...overrides,
  }
}

function marketingPlanInput(overrides: Partial<NewMarketingPlan> = {}): NewMarketingPlan {
  return {
    organizationId: ORG,
    objectiveId: 'objective_1',
    title: 'Q1 plan',
    executiveSummary: 'Focus on local service owners',
    targetAudience: { segment: 'owners' },
    messagingPillars: ['trust'],
    channelMix: ['meta'],
    campaignPhases: [{ name: 'awareness' }],
    kpis: ['signups'],
    rawContent: null,
    status: 'draft',
    engagementRunId: null,
    ...overrides,
  }
}

function metaConnectionInput(overrides: Partial<NewMetaConnection> = {}): NewMetaConnection {
  return {
    organizationId: ORG,
    adAccountId: 'act_1',
    pageId: 'page_1',
    pixelId: null,
    tokenExpiresAt: null,
    status: 'connected',
    ...overrides,
  }
}

function assetInput(overrides: Partial<CreateCampaignAssetInput> = {}): CreateCampaignAssetInput {
  return {
    organizationId: ORG,
    campaignId: CAMPAIGN,
    modelProvider: 'test-provider',
    type: 'image',
    ...overrides,
  }
}

function scriptInput(
  overrides: Partial<CreateCampaignScriptInput> = {}
): CreateCampaignScriptInput {
  return {
    organizationId: ORG,
    campaignId: CAMPAIGN,
    title: 'Founder intro',
    body: 'Hi, here is what we built.',
    ...overrides,
  }
}

function captionInput(
  overrides: Partial<CreateCampaignCaptionInput> = {}
): CreateCampaignCaptionInput {
  return {
    organizationId: ORG,
    campaignId: CAMPAIGN,
    platform: 'instagram',
    body: 'Twelve chars',
    ...overrides,
  }
}

function hashtagSetInput(
  overrides: Partial<CreateCampaignHashtagSetInput> = {}
): CreateCampaignHashtagSetInput {
  return {
    organizationId: ORG,
    campaignId: CAMPAIGN,
    platform: 'instagram',
    name: 'Launch tags',
    tags: ['#ai', '#smallbusiness'],
    ...overrides,
  }
}

function calendarSlotInput(
  overrides: Partial<CreateCampaignCalendarSlotInput> = {}
): CreateCampaignCalendarSlotInput {
  return {
    organizationId: ORG,
    campaignId: CAMPAIGN,
    scheduledAt: new Date('2026-03-01T09:00:00.000Z'),
    platform: 'instagram',
    ...overrides,
  }
}

function approvalEventInput(
  overrides: Partial<CreateCampaignApprovalEventInput> = {}
): CreateCampaignApprovalEventInput {
  return {
    organizationId: ORG,
    campaignId: CAMPAIGN,
    assetType: 'ad_copy_variant',
    assetId: 'asset_1',
    decision: 'approved',
    actorType: 'user',
    actorId: 'user_1',
    ...overrides,
  }
}

function publishEventInput(
  overrides: Partial<CreateCampaignPublishEventInput> = {}
): CreateCampaignPublishEventInput {
  return {
    organizationId: ORG,
    campaignId: CAMPAIGN,
    assetType: 'creative',
    assetId: 'asset_1',
    platform: 'instagram',
    action: 'published',
    actorType: 'user',
    actorId: 'user_1',
    ...overrides,
  }
}

/**
 * Installs a fresh in-memory repository for the service singleton.
 *
 * The service holds its repository in module state (`_configureDogfoodingRepository`)
 * rather than taking it via a constructor, so every test must reset it to stay isolated.
 */
function useFreshRepository(): InMemoryDogfoodingRepository {
  const repo = new InMemoryDogfoodingRepository()
  _configureDogfoodingRepository(repo)
  return repo
}

/** Unwraps a successful result, failing loudly when the call did not succeed. */
function unwrap<T>(result: PlatformResult<T>): T {
  if (!result.ok) throw new Error(`expected ok result, got ${result.error.code}`)
  return result.value
}

afterEach(() => {
  vi.useRealTimers()
})

// ── Objectives ──────────────────────────────────────────────────────────────

describe('DogfoodingService — objectives', () => {
  let repo: InMemoryDogfoodingRepository
  beforeEach(() => {
    repo = useFreshRepository()
  })

  it('creates an objective in draft with defaulted optional fields', async () => {
    const result = await dogfoodingService.createObjective(objectiveInput())
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.status).toBe('draft')
      expect(result.value.organizationId).toBe(ORG)
      expect(result.value.goalType).toBe('lead_generation')
      expect(result.value.targetAudience).toBeNull()
      expect(result.value.successMetrics).toEqual([])
      expect(result.value.budgetCents).toBe(0)
      expect(result.value.engagementRunId).toBeNull()
    }
  })

  it('preserves supplied optional fields', async () => {
    const objective = unwrap(
      await dogfoodingService.createObjective(
        objectiveInput({
          targetAudience: 'plumbers',
          successMetrics: ['signups', 'demos'],
          budgetCents: 120_000,
        })
      )
    )
    expect(objective.targetAudience).toBe('plumbers')
    expect(objective.successMetrics).toEqual(['signups', 'demos'])
    expect(objective.budgetCents).toBe(120_000)
  })

  it('getObjective returns the objective for its owning organization', async () => {
    const created = unwrap(await dogfoodingService.createObjective(objectiveInput()))
    const result = await dogfoodingService.getObjective(created.id, ORG)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.id).toBe(created.id)
  })

  it('getObjective returns NOT_FOUND for an unknown id', async () => {
    const result = await dogfoodingService.getObjective('objective_missing', ORG)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.NOT_FOUND)
  })

  it('getObjective does not leak another organization’s objective', async () => {
    const created = unwrap(await dogfoodingService.createObjective(objectiveInput()))
    const result = await dogfoodingService.getObjective(created.id, OTHER_ORG)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.NOT_FOUND)
  })

  it('listObjectives returns only the organization’s objectives', async () => {
    await dogfoodingService.createObjective(objectiveInput())
    await dogfoodingService.createObjective(objectiveInput({ organizationId: OTHER_ORG }))
    const mine = unwrap(await dogfoodingService.listObjectives(ORG))
    const theirs = unwrap(await dogfoodingService.listObjectives(OTHER_ORG))
    expect(mine).toHaveLength(1)
    expect(theirs).toHaveLength(1)
    expect(mine[0].organizationId).toBe(ORG)
  })

  it('listObjectives returns an empty list for an organization with none', async () => {
    expect(unwrap(await dogfoodingService.listObjectives(ORG))).toEqual([])
  })

  it('updateObjectiveStatus changes the status', async () => {
    const created = unwrap(await dogfoodingService.createObjective(objectiveInput()))
    const updated = unwrap(await dogfoodingService.updateObjectiveStatus(created.id, 'active', ORG))
    expect(updated.status).toBe('active')
    expect(updated.engagementRunId).toBeNull()
  })

  it('updateObjectiveStatus attaches the engagement run when supplied', async () => {
    const created = unwrap(await dogfoodingService.createObjective(objectiveInput()))
    const updated = unwrap(
      await dogfoodingService.updateObjectiveStatus(created.id, 'completed', ORG, 'run_1')
    )
    expect(updated.status).toBe('completed')
    expect(updated.engagementRunId).toBe('run_1')
    expect(unwrap(await dogfoodingService.getObjective(created.id, ORG)).engagementRunId).toBe(
      'run_1'
    )
  })

  it('updateObjectiveStatus reports NOT_FOUND for an unknown objective', async () => {
    const result = await dogfoodingService.updateObjectiveStatus('objective_missing', 'active', ORG)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.NOT_FOUND)
  })

  it('updateObjectiveStatus refuses another organization’s objective', async () => {
    const created = unwrap(await dogfoodingService.createObjective(objectiveInput()))
    const result = await dogfoodingService.updateObjectiveStatus(created.id, 'paused', OTHER_ORG)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.NOT_FOUND)
  })

  it('updateObjectiveStatus leaves the other organization’s objective unmutated', async () => {
    const created = unwrap(await dogfoodingService.createObjective(objectiveInput()))
    await dogfoodingService.updateObjectiveStatus(created.id, 'completed', OTHER_ORG, 'run_x')

    const untouched = unwrap(await dogfoodingService.getObjective(created.id, ORG))
    expect(untouched.status).toBe('draft')
    expect(untouched.engagementRunId).toBeNull()
    expect(untouched.updatedAt).toEqual(created.updatedAt)
  })

  it('updateObjectiveStatus scopes by organization, not by id alone', async () => {
    const mine = unwrap(await dogfoodingService.createObjective(objectiveInput()))
    const theirs = unwrap(
      await dogfoodingService.createObjective(objectiveInput({ organizationId: OTHER_ORG }))
    )

    unwrap(await dogfoodingService.updateObjectiveStatus(theirs.id, 'active', OTHER_ORG))

    expect(unwrap(await dogfoodingService.getObjective(theirs.id, OTHER_ORG)).status).toBe('active')
    expect(unwrap(await dogfoodingService.getObjective(mine.id, ORG)).status).toBe('draft')
  })

  it('surfaces objectives created directly through the repository', async () => {
    await repo.createObjective(objectiveInput({ title: 'Seeded' }))
    const objectives = unwrap(await dogfoodingService.listObjectives(ORG))
    expect(objectives.map((o) => o.title)).toEqual(['Seeded'])
  })
})

// ── Campaigns ───────────────────────────────────────────────────────────────

describe('DogfoodingService — campaigns', () => {
  beforeEach(() => {
    useFreshRepository()
  })

  it('creates a campaign and returns it with an id and timestamps', async () => {
    const result = await dogfoodingService.createCampaign(campaignInput())
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.id).toBeTruthy()
      expect(result.value.name).toBe('Spring launch')
      expect(result.value.status).toBe('planning')
      expect(result.value.createdAt).toBeInstanceOf(Date)
      expect(result.value.updatedAt).toBeInstanceOf(Date)
    }
  })

  it('listCampaigns returns only the organization’s campaigns', async () => {
    await dogfoodingService.createCampaign(campaignInput())
    await dogfoodingService.createCampaign(campaignInput({ organizationId: OTHER_ORG }))
    const mine = unwrap(await dogfoodingService.listCampaigns(ORG))
    expect(mine).toHaveLength(1)
    expect(mine[0].organizationId).toBe(ORG)
  })

  it('listCampaignsByObjective filters by objective', async () => {
    await dogfoodingService.createCampaign(campaignInput({ objectiveId: 'objective_1' }))
    await dogfoodingService.createCampaign(
      campaignInput({ objectiveId: 'objective_2', name: 'Other' })
    )
    const forObjective = unwrap(
      await dogfoodingService.listCampaignsByObjective('objective_1', ORG)
    )
    expect(forObjective).toHaveLength(1)
    expect(forObjective[0].objectiveId).toBe('objective_1')
  })

  it('listCampaignsByObjective enforces organization scoping', async () => {
    await dogfoodingService.createCampaign(campaignInput({ objectiveId: 'objective_1' }))
    const theirs = unwrap(
      await dogfoodingService.listCampaignsByObjective('objective_1', OTHER_ORG)
    )
    expect(theirs).toEqual([])
  })
})

// ── Campaign updates (repository contract) ──────────────────────────────────

/**
 * `updateCampaignStatus` and `updateCampaignDetails` are repository-only today —
 * no DogfoodingService method exposes them — so the organization-scoping contract
 * required by ADR-026 is asserted against the repository directly.
 */
describe('InMemoryDogfoodingRepository — campaign updates are organization-scoped', () => {
  let repo: InMemoryDogfoodingRepository
  beforeEach(() => {
    repo = new InMemoryDogfoodingRepository()
  })

  /** Reads a campaign back through the organization-scoped list interface. */
  async function readCampaign(
    id: string,
    organizationId: OrganizationId
  ): Promise<DogfoodingCampaign> {
    const campaign = (await repo.listCampaigns(organizationId)).find((c) => c.id === id)
    if (!campaign) throw new Error(`campaign ${id} not visible to ${organizationId}`)
    return campaign
  }

  it('updateCampaignStatus updates the campaign for its owning organization', async () => {
    const created = await repo.createCampaign(campaignInput())
    const updated = await repo.updateCampaignStatus(created.id, 'ready', ORG)
    expect(updated.status).toBe('ready')
    expect((await readCampaign(created.id, ORG)).status).toBe('ready')
  })

  it('updateCampaignStatus rejects an unknown campaign', async () => {
    await expect(repo.updateCampaignStatus('campaign_missing', 'ready', ORG)).rejects.toThrow(
      'not found'
    )
  })

  it('updateCampaignStatus refuses another organization’s campaign and mutates nothing', async () => {
    const created = await repo.createCampaign(campaignInput())
    await expect(repo.updateCampaignStatus(created.id, 'ready', OTHER_ORG)).rejects.toThrow(
      'not found'
    )

    const untouched = await readCampaign(created.id, ORG)
    expect(untouched.status).toBe('planning')
    expect(untouched.updatedAt).toEqual(created.updatedAt)
  })

  it('updateCampaignDetails links plan and engagement run for its owning organization', async () => {
    const created = await repo.createCampaign(campaignInput())
    const updated = await repo.updateCampaignDetails(
      created.id,
      { planId: 'plan_1', engagementRunId: 'run_1' },
      ORG
    )
    expect(updated.planId).toBe('plan_1')
    expect(updated.engagementRunId).toBe('run_1')

    const persisted = await readCampaign(created.id, ORG)
    expect(persisted.planId).toBe('plan_1')
    expect(persisted.engagementRunId).toBe('run_1')
  })

  it('updateCampaignDetails rejects an unknown campaign', async () => {
    await expect(
      repo.updateCampaignDetails('campaign_missing', { planId: 'plan_1' }, ORG)
    ).rejects.toThrow('not found')
  })

  it('updateCampaignDetails refuses another organization’s campaign and mutates nothing', async () => {
    const created = await repo.createCampaign(campaignInput())
    await expect(
      repo.updateCampaignDetails(
        created.id,
        { planId: 'plan_x', engagementRunId: 'run_x' },
        OTHER_ORG
      )
    ).rejects.toThrow('not found')

    const untouched = await readCampaign(created.id, ORG)
    expect(untouched.planId).toBeNull()
    expect(untouched.engagementRunId).toBeNull()
    expect(untouched.updatedAt).toEqual(created.updatedAt)
  })

  it('scopes campaign updates by organization, not by id alone', async () => {
    const mine = await repo.createCampaign(campaignInput())
    const theirs = await repo.createCampaign(campaignInput({ organizationId: OTHER_ORG }))

    await repo.updateCampaignStatus(theirs.id, 'ready', OTHER_ORG)

    expect((await readCampaign(theirs.id, OTHER_ORG)).status).toBe('ready')
    expect((await readCampaign(mine.id, ORG)).status).toBe('planning')
  })
})

// ── Marketing plan ──────────────────────────────────────────────────────────

describe('DogfoodingService — marketing plan', () => {
  let repo: InMemoryDogfoodingRepository
  beforeEach(() => {
    repo = useFreshRepository()
  })

  it('getMarketingPlan returns null when no plan exists', async () => {
    const result = await dogfoodingService.getMarketingPlan('objective_1', ORG)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toBeNull()
  })

  it('getMarketingPlan returns the plan for its objective', async () => {
    await repo.createMarketingPlan(marketingPlanInput())
    const plan = unwrap(await dogfoodingService.getMarketingPlan('objective_1', ORG))
    expect(plan?.title).toBe('Q1 plan')
    expect(plan?.channelMix).toEqual(['meta'])
  })

  it('getMarketingPlan does not leak another organization’s plan', async () => {
    await repo.createMarketingPlan(marketingPlanInput())
    const plan = unwrap(await dogfoodingService.getMarketingPlan('objective_1', OTHER_ORG))
    expect(plan).toBeNull()
  })
})

// ── Ad copy variants ────────────────────────────────────────────────────────

describe('DogfoodingService — ad copy variants', () => {
  let repo: InMemoryDogfoodingRepository
  beforeEach(() => {
    repo = useFreshRepository()
  })

  it('listAdCopyVariants returns the variants of one campaign', async () => {
    await repo.createAdCopyVariant(copyVariantInput())
    await repo.createAdCopyVariant(
      copyVariantInput({ campaignId: OTHER_CAMPAIGN, variantName: 'B' })
    )
    const variants = unwrap(await dogfoodingService.listAdCopyVariants(CAMPAIGN, ORG))
    expect(variants).toHaveLength(1)
    expect(variants[0].variantName).toBe('A')
    expect(variants[0].publishStatus).toBe('unpublished')
  })

  it('listAdCopyVariants enforces organization scoping', async () => {
    await repo.createAdCopyVariant(copyVariantInput())
    expect(unwrap(await dogfoodingService.listAdCopyVariants(CAMPAIGN, OTHER_ORG))).toEqual([])
  })

  it('listAllCopyVariants spans campaigns but not organizations', async () => {
    await repo.createAdCopyVariant(copyVariantInput())
    await repo.createAdCopyVariant(
      copyVariantInput({ campaignId: OTHER_CAMPAIGN, variantName: 'B' })
    )
    await repo.createAdCopyVariant(
      copyVariantInput({ organizationId: OTHER_ORG, variantName: 'C' })
    )
    const variants = unwrap(await dogfoodingService.listAllCopyVariants(ORG))
    expect(variants.map((v) => v.variantName).sort()).toEqual(['A', 'B'])
  })

  it('approveAdCopyVariant marks the variant approved and records the note', async () => {
    const seeded = await repo.createAdCopyVariant(copyVariantInput())
    const approved = unwrap(await dogfoodingService.approveAdCopyVariant(seeded.id, 'ship it', ORG))
    expect(approved.status).toBe('approved')
    expect(approved.approvalNote).toBe('ship it')
    expect(approved.approvedAt).toBeInstanceOf(Date)
  })

  it('approveAdCopyVariant accepts a null note', async () => {
    const seeded = await repo.createAdCopyVariant(copyVariantInput())
    const approved = unwrap(await dogfoodingService.approveAdCopyVariant(seeded.id, null, ORG))
    expect(approved.approvalNote).toBeNull()
  })

  it('rejectAdCopyVariant marks the variant rejected without an approval timestamp', async () => {
    const seeded = await repo.createAdCopyVariant(copyVariantInput())
    const rejected = unwrap(
      await dogfoodingService.rejectAdCopyVariant(seeded.id, 'off brand', ORG)
    )
    expect(rejected.status).toBe('rejected')
    expect(rejected.approvalNote).toBe('off brand')
    expect(rejected.approvedAt).toBeNull()
  })

  it('approveAdCopyVariant reports NOT_FOUND for an unknown variant', async () => {
    const result = await dogfoodingService.approveAdCopyVariant('variant_missing', null, ORG)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.NOT_FOUND)
  })

  it('approveAdCopyVariant refuses a variant owned by another organization', async () => {
    const seeded = await repo.createAdCopyVariant(copyVariantInput())
    const result = await dogfoodingService.approveAdCopyVariant(seeded.id, null, OTHER_ORG)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.NOT_FOUND)
  })

  it('rejectAdCopyVariant reports NOT_FOUND for an unknown variant', async () => {
    const result = await dogfoodingService.rejectAdCopyVariant('variant_missing', null, ORG)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.NOT_FOUND)
  })

  it('rejectAdCopyVariant refuses a variant owned by another organization', async () => {
    const seeded = await repo.createAdCopyVariant(copyVariantInput())
    const result = await dogfoodingService.rejectAdCopyVariant(seeded.id, null, OTHER_ORG)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.NOT_FOUND)
  })
})

// ── Creatives ───────────────────────────────────────────────────────────────

describe('DogfoodingService — creatives', () => {
  let repo: InMemoryDogfoodingRepository
  beforeEach(() => {
    repo = useFreshRepository()
  })

  it('listCreatives returns the creatives of one campaign', async () => {
    await repo.createCreative(creativeInput())
    await repo.createCreative(creativeInput({ campaignId: OTHER_CAMPAIGN, type: 'video' }))
    const creatives = unwrap(await dogfoodingService.listCreatives(CAMPAIGN, ORG))
    expect(creatives).toHaveLength(1)
    expect(creatives[0].type).toBe('image')
  })

  it('listCreatives enforces organization scoping', async () => {
    await repo.createCreative(creativeInput())
    expect(unwrap(await dogfoodingService.listCreatives(CAMPAIGN, OTHER_ORG))).toEqual([])
  })

  it('listAllCreatives spans campaigns but not organizations', async () => {
    await repo.createCreative(creativeInput())
    await repo.createCreative(creativeInput({ campaignId: null }))
    await repo.createCreative(creativeInput({ organizationId: OTHER_ORG }))
    expect(unwrap(await dogfoodingService.listAllCreatives(ORG))).toHaveLength(2)
  })

  it('approveCreative marks the creative approved and records the note', async () => {
    const seeded = await repo.createCreative(creativeInput())
    const approved = unwrap(await dogfoodingService.approveCreative(seeded.id, 'on brand', ORG))
    expect(approved.status).toBe('approved')
    expect(approved.approvalNote).toBe('on brand')
    expect(approved.approvedAt).toBeInstanceOf(Date)
  })

  it('rejectCreative marks the creative rejected without an approval timestamp', async () => {
    const seeded = await repo.createCreative(creativeInput())
    const rejected = unwrap(await dogfoodingService.rejectCreative(seeded.id, 'reshoot', ORG))
    expect(rejected.status).toBe('rejected')
    expect(rejected.approvalNote).toBe('reshoot')
    expect(rejected.approvedAt).toBeNull()
  })

  it('approveCreative reports NOT_FOUND for an unknown creative', async () => {
    const result = await dogfoodingService.approveCreative('creative_missing', null, ORG)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.NOT_FOUND)
  })

  it('approveCreative refuses a creative owned by another organization', async () => {
    const seeded = await repo.createCreative(creativeInput())
    const result = await dogfoodingService.approveCreative(seeded.id, null, OTHER_ORG)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.NOT_FOUND)
  })

  it('rejectCreative reports NOT_FOUND for an unknown creative', async () => {
    const result = await dogfoodingService.rejectCreative('creative_missing', null, ORG)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.NOT_FOUND)
  })

  it('rejectCreative refuses a creative owned by another organization', async () => {
    const seeded = await repo.createCreative(creativeInput())
    const result = await dogfoodingService.rejectCreative(seeded.id, null, OTHER_ORG)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.NOT_FOUND)
  })
})

// ── Learnings ───────────────────────────────────────────────────────────────

describe('DogfoodingService — learnings', () => {
  let repo: InMemoryDogfoodingRepository
  beforeEach(() => {
    repo = useFreshRepository()
  })

  it('listLearnings returns an empty list when none exist', async () => {
    expect(unwrap(await dogfoodingService.listLearnings(ORG))).toEqual([])
  })

  it('listLearnings returns only the organization’s learnings', async () => {
    await repo.createLearning(learningInput())
    await repo.createLearning(learningInput({ organizationId: OTHER_ORG, insight: 'theirs' }))
    const learnings = unwrap(await dogfoodingService.listLearnings(ORG))
    expect(learnings).toHaveLength(1)
    expect(learnings[0].insight).toBe('Short headlines outperform long ones')
    expect(learnings[0].learningType).toBe('copy')
  })
})

// ── Meta connection ─────────────────────────────────────────────────────────

describe('DogfoodingService — meta connection', () => {
  let repo: InMemoryDogfoodingRepository
  beforeEach(() => {
    repo = useFreshRepository()
  })

  it('getMetaConnection returns null when the organization has none', async () => {
    const result = await dogfoodingService.getMetaConnection(ORG)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toBeNull()
  })

  it('getMetaConnection returns the organization’s connection', async () => {
    await repo.upsertMetaConnection(metaConnectionInput())
    const connection = unwrap(await dogfoodingService.getMetaConnection(ORG))
    expect(connection?.adAccountId).toBe('act_1')
    expect(connection?.status).toBe('connected')
  })

  it('getMetaConnection does not leak another organization’s connection', async () => {
    await repo.upsertMetaConnection(metaConnectionInput())
    expect(unwrap(await dogfoodingService.getMetaConnection(OTHER_ORG))).toBeNull()
  })
})

// ── Campaign assets ─────────────────────────────────────────────────────────

describe('DogfoodingService — campaign assets', () => {
  beforeEach(() => {
    useFreshRepository()
  })

  it('creates an asset with generating status and default metadata', async () => {
    const asset = unwrap(await dogfoodingService.createCampaignAsset(assetInput()))
    expect(asset.status).toBe('generating')
    expect(asset.version).toBe(1)
    expect(asset.metadata).toEqual({})
    expect(asset.publishStatus).toBe('unpublished')
    expect(asset.creativeId).toBeNull()
    expect(asset.approvedAt).toBeNull()
  })

  it('preserves supplied asset fields', async () => {
    const asset = unwrap(
      await dogfoodingService.createCampaignAsset(
        assetInput({
          status: 'ready',
          version: 2,
          subtype: 'square',
          assetUrl: 'https://example.test/a.png',
          metadata: { width: 1080 },
          parentAssetId: 'asset_parent',
        })
      )
    )
    expect(asset.status).toBe('ready')
    expect(asset.version).toBe(2)
    expect(asset.subtype).toBe('square')
    expect(asset.assetUrl).toBe('https://example.test/a.png')
    expect(asset.metadata).toEqual({ width: 1080 })
    expect(asset.parentAssetId).toBe('asset_parent')
  })

  it('findCampaignAssetById returns the asset for its owning organization', async () => {
    const created = unwrap(await dogfoodingService.createCampaignAsset(assetInput()))
    const found = unwrap(await dogfoodingService.findCampaignAssetById(created.id, ORG))
    expect(found?.id).toBe(created.id)
  })

  it('findCampaignAssetById returns null for an unknown id', async () => {
    expect(unwrap(await dogfoodingService.findCampaignAssetById('asset_missing', ORG))).toBeNull()
  })

  it('findCampaignAssetById returns null across organizations', async () => {
    const created = unwrap(await dogfoodingService.createCampaignAsset(assetInput()))
    expect(unwrap(await dogfoodingService.findCampaignAssetById(created.id, OTHER_ORG))).toBeNull()
  })

  it('listCampaignAssets returns the assets of one campaign', async () => {
    await dogfoodingService.createCampaignAsset(assetInput())
    await dogfoodingService.createCampaignAsset(assetInput({ campaignId: OTHER_CAMPAIGN }))
    expect(unwrap(await dogfoodingService.listCampaignAssets(CAMPAIGN, ORG))).toHaveLength(1)
  })

  it('listCampaignAssets enforces organization scoping', async () => {
    await dogfoodingService.createCampaignAsset(assetInput())
    expect(unwrap(await dogfoodingService.listCampaignAssets(CAMPAIGN, OTHER_ORG))).toEqual([])
  })

  it('updateCampaignAssetStatus persists the new status', async () => {
    const created = unwrap(await dogfoodingService.createCampaignAsset(assetInput()))
    const updated = unwrap(
      await dogfoodingService.updateCampaignAssetStatus(created.id, 'approved', ORG)
    )
    expect(updated.status).toBe('approved')
    const found = unwrap(await dogfoodingService.findCampaignAssetById(created.id, ORG))
    expect(found?.status).toBe('approved')
  })

  it('updateCampaignAssetStatus reports NOT_FOUND for an unknown asset', async () => {
    const result = await dogfoodingService.updateCampaignAssetStatus(
      'asset_missing',
      'approved',
      ORG
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.NOT_FOUND)
  })

  it('updateCampaignAssetStatus refuses an asset owned by another organization', async () => {
    const created = unwrap(await dogfoodingService.createCampaignAsset(assetInput()))
    const result = await dogfoodingService.updateCampaignAssetStatus(
      created.id,
      'approved',
      OTHER_ORG
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.NOT_FOUND)
  })
})

// ── Campaign scripts ────────────────────────────────────────────────────────

describe('DogfoodingService — campaign scripts', () => {
  beforeEach(() => {
    useFreshRepository()
  })

  it('creates a script in draft with defaulted optional fields', async () => {
    const script = unwrap(await dogfoodingService.createCampaignScript(scriptInput()))
    expect(script.status).toBe('draft')
    expect(script.version).toBe(1)
    expect(script.platform).toBeNull()
    expect(script.estimatedDurationSec).toBeNull()
    expect(script.modelProvider).toBeNull()
    expect(script.approvedAt).toBeNull()
  })

  it('preserves supplied script fields', async () => {
    const script = unwrap(
      await dogfoodingService.createCampaignScript(
        scriptInput({
          platform: 'tiktok',
          estimatedDurationSec: 30,
          modelProvider: 'test-provider',
          version: 3,
          parentScriptId: 'script_parent',
        })
      )
    )
    expect(script.platform).toBe('tiktok')
    expect(script.estimatedDurationSec).toBe(30)
    expect(script.modelProvider).toBe('test-provider')
    expect(script.version).toBe(3)
    expect(script.parentScriptId).toBe('script_parent')
  })

  it('listCampaignScripts returns the scripts of one campaign', async () => {
    await dogfoodingService.createCampaignScript(scriptInput())
    await dogfoodingService.createCampaignScript(scriptInput({ campaignId: OTHER_CAMPAIGN }))
    expect(unwrap(await dogfoodingService.listCampaignScripts(CAMPAIGN, ORG))).toHaveLength(1)
  })

  it('listCampaignScripts enforces organization scoping', async () => {
    await dogfoodingService.createCampaignScript(scriptInput())
    expect(unwrap(await dogfoodingService.listCampaignScripts(CAMPAIGN, OTHER_ORG))).toEqual([])
  })
})

// ── Campaign captions ───────────────────────────────────────────────────────

describe('DogfoodingService — campaign captions', () => {
  beforeEach(() => {
    useFreshRepository()
  })

  it('derives the character count from the body when none is supplied', async () => {
    const caption = unwrap(await dogfoodingService.createCampaignCaption(captionInput()))
    expect(caption.characterCount).toBe('Twelve chars'.length)
    expect(caption.status).toBe('draft')
    expect(caption.version).toBe(1)
    expect(caption.pairedAssetId).toBeNull()
  })

  it('uses the supplied character count when provided', async () => {
    const caption = unwrap(
      await dogfoodingService.createCampaignCaption(
        captionInput({ characterCount: 99, pairedAssetId: 'asset_1' })
      )
    )
    expect(caption.characterCount).toBe(99)
    expect(caption.pairedAssetId).toBe('asset_1')
  })

  it('listCampaignCaptions returns the captions of one campaign', async () => {
    await dogfoodingService.createCampaignCaption(captionInput())
    await dogfoodingService.createCampaignCaption(captionInput({ campaignId: OTHER_CAMPAIGN }))
    expect(unwrap(await dogfoodingService.listCampaignCaptions(CAMPAIGN, ORG))).toHaveLength(1)
  })

  it('listCampaignCaptions enforces organization scoping', async () => {
    await dogfoodingService.createCampaignCaption(captionInput())
    expect(unwrap(await dogfoodingService.listCampaignCaptions(CAMPAIGN, OTHER_ORG))).toEqual([])
  })
})

// ── Campaign hashtag sets ───────────────────────────────────────────────────

describe('DogfoodingService — campaign hashtag sets', () => {
  beforeEach(() => {
    useFreshRepository()
  })

  it('creates a hashtag set in draft with the mid reach tier by default', async () => {
    const set = unwrap(await dogfoodingService.createCampaignHashtagSet(hashtagSetInput()))
    expect(set.reachTier).toBe('mid')
    expect(set.status).toBe('draft')
    expect(set.tags).toEqual(['#ai', '#smallbusiness'])
    expect(set.approvedAt).toBeNull()
  })

  it('uses the supplied reach tier', async () => {
    const set = unwrap(
      await dogfoodingService.createCampaignHashtagSet(hashtagSetInput({ reachTier: 'niche' }))
    )
    expect(set.reachTier).toBe('niche')
  })

  it('listCampaignHashtagSets returns the sets of one campaign', async () => {
    await dogfoodingService.createCampaignHashtagSet(hashtagSetInput())
    await dogfoodingService.createCampaignHashtagSet(
      hashtagSetInput({ campaignId: OTHER_CAMPAIGN })
    )
    expect(unwrap(await dogfoodingService.listCampaignHashtagSets(CAMPAIGN, ORG))).toHaveLength(1)
  })

  it('listCampaignHashtagSets enforces organization scoping', async () => {
    await dogfoodingService.createCampaignHashtagSet(hashtagSetInput())
    expect(unwrap(await dogfoodingService.listCampaignHashtagSets(CAMPAIGN, OTHER_ORG))).toEqual([])
  })
})

// ── Calendar slots ──────────────────────────────────────────────────────────

describe('DogfoodingService — calendar slots', () => {
  beforeEach(() => {
    useFreshRepository()
  })

  it('creates a calendar slot in draft with no publication state', async () => {
    const slot = unwrap(await dogfoodingService.createCalendarSlot(calendarSlotInput()))
    expect(slot.status).toBe('draft')
    expect(slot.publishedAt).toBeNull()
    expect(slot.publishedBy).toBeNull()
    expect(slot.livePostUrl).toBeNull()
    expect(slot.assetId).toBeNull()
    expect(slot.copyVariantId).toBeNull()
    expect(slot.captionId).toBeNull()
    expect(slot.hashtagSetId).toBeNull()
  })

  it('links the supplied deliverables to the slot', async () => {
    const slot = unwrap(
      await dogfoodingService.createCalendarSlot(
        calendarSlotInput({
          assetId: 'asset_1',
          copyVariantId: 'variant_1',
          captionId: 'caption_1',
          hashtagSetId: 'hashtags_1',
        })
      )
    )
    expect(slot.assetId).toBe('asset_1')
    expect(slot.copyVariantId).toBe('variant_1')
    expect(slot.captionId).toBe('caption_1')
    expect(slot.hashtagSetId).toBe('hashtags_1')
  })

  it('listCalendarSlots returns the slots in chronological order', async () => {
    await dogfoodingService.createCalendarSlot(
      calendarSlotInput({ scheduledAt: new Date('2026-03-03T09:00:00.000Z') })
    )
    await dogfoodingService.createCalendarSlot(
      calendarSlotInput({ scheduledAt: new Date('2026-03-01T09:00:00.000Z') })
    )
    await dogfoodingService.createCalendarSlot(
      calendarSlotInput({ scheduledAt: new Date('2026-03-02T09:00:00.000Z') })
    )
    const slots = unwrap(await dogfoodingService.listCalendarSlots(CAMPAIGN, ORG))
    expect(slots.map((s) => s.scheduledAt.toISOString())).toEqual([
      '2026-03-01T09:00:00.000Z',
      '2026-03-02T09:00:00.000Z',
      '2026-03-03T09:00:00.000Z',
    ])
  })

  it('listCalendarSlots returns the slots of one campaign', async () => {
    await dogfoodingService.createCalendarSlot(calendarSlotInput())
    await dogfoodingService.createCalendarSlot(calendarSlotInput({ campaignId: OTHER_CAMPAIGN }))
    expect(unwrap(await dogfoodingService.listCalendarSlots(CAMPAIGN, ORG))).toHaveLength(1)
  })

  it('listCalendarSlots enforces organization scoping', async () => {
    await dogfoodingService.createCalendarSlot(calendarSlotInput())
    expect(unwrap(await dogfoodingService.listCalendarSlots(CAMPAIGN, OTHER_ORG))).toEqual([])
  })
})

// ── Approval events ─────────────────────────────────────────────────────────

describe('DogfoodingService — approval events', () => {
  beforeEach(() => {
    useFreshRepository()
  })

  it('records an approval event with a null note by default', async () => {
    const event = unwrap(await dogfoodingService.createApprovalEvent(approvalEventInput()))
    expect(event.decision).toBe('approved')
    expect(event.assetType).toBe('ad_copy_variant')
    expect(event.note).toBeNull()
    expect(event.engagementRunId).toBeNull()
    expect(event.actorType).toBe('user')
    expect(event.createdAt).toBeInstanceOf(Date)
  })

  it('records the attribution and note of a rejection', async () => {
    const event = unwrap(
      await dogfoodingService.createApprovalEvent(
        approvalEventInput({
          decision: 'rejected',
          note: 'needs a rewrite',
          actorType: 'digital_employee',
          actorId: 'employee_1',
          engagementRunId: 'run_1',
        })
      )
    )
    expect(event.decision).toBe('rejected')
    expect(event.note).toBe('needs a rewrite')
    expect(event.actorType).toBe('digital_employee')
    expect(event.actorId).toBe('employee_1')
    expect(event.engagementRunId).toBe('run_1')
  })

  it('listApprovalEvents returns the most recent event first', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-03-01T09:00:00.000Z'))
    await dogfoodingService.createApprovalEvent(approvalEventInput({ assetId: 'older' }))
    vi.setSystemTime(new Date('2026-03-02T09:00:00.000Z'))
    await dogfoodingService.createApprovalEvent(approvalEventInput({ assetId: 'newer' }))

    const events = unwrap(await dogfoodingService.listApprovalEvents(CAMPAIGN, ORG))
    expect(events.map((e) => e.assetId)).toEqual(['newer', 'older'])
  })

  it('listApprovalEvents returns the events of one campaign', async () => {
    await dogfoodingService.createApprovalEvent(approvalEventInput())
    await dogfoodingService.createApprovalEvent(approvalEventInput({ campaignId: OTHER_CAMPAIGN }))
    expect(unwrap(await dogfoodingService.listApprovalEvents(CAMPAIGN, ORG))).toHaveLength(1)
  })

  it('listApprovalEvents enforces organization scoping', async () => {
    await dogfoodingService.createApprovalEvent(approvalEventInput())
    expect(unwrap(await dogfoodingService.listApprovalEvents(CAMPAIGN, OTHER_ORG))).toEqual([])
  })
})

// ── Publish events ──────────────────────────────────────────────────────────

describe('DogfoodingService — publish events', () => {
  beforeEach(() => {
    useFreshRepository()
  })

  it('records a publish event with defaulted optional references', async () => {
    const event = unwrap(await dogfoodingService.createPublishEvent(publishEventInput()))
    expect(event.action).toBe('published')
    expect(event.platform).toBe('instagram')
    expect(event.calendarSlotId).toBeNull()
    expect(event.livePostUrl).toBeNull()
    expect(event.publishedAt).toBeInstanceOf(Date)
  })

  it('records the live post url and calendar slot when supplied', async () => {
    const event = unwrap(
      await dogfoodingService.createPublishEvent(
        publishEventInput({
          calendarSlotId: 'slot_1',
          livePostUrl: 'https://example.test/post/1',
          actorType: 'automation',
          actorId: 'scheduler',
        })
      )
    )
    expect(event.calendarSlotId).toBe('slot_1')
    expect(event.livePostUrl).toBe('https://example.test/post/1')
    expect(event.actorType).toBe('automation')
  })

  it('listPublishEvents returns the most recent event first', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-03-01T09:00:00.000Z'))
    await dogfoodingService.createPublishEvent(publishEventInput({ assetId: 'older' }))
    vi.setSystemTime(new Date('2026-03-02T09:00:00.000Z'))
    await dogfoodingService.createPublishEvent(publishEventInput({ assetId: 'newer' }))

    const events = unwrap(await dogfoodingService.listPublishEvents(CAMPAIGN, ORG))
    expect(events.map((e) => e.assetId)).toEqual(['newer', 'older'])
  })

  it('listPublishEvents returns the events of one campaign', async () => {
    await dogfoodingService.createPublishEvent(publishEventInput())
    await dogfoodingService.createPublishEvent(publishEventInput({ campaignId: OTHER_CAMPAIGN }))
    expect(unwrap(await dogfoodingService.listPublishEvents(CAMPAIGN, ORG))).toHaveLength(1)
  })

  it('listPublishEvents enforces organization scoping', async () => {
    await dogfoodingService.createPublishEvent(publishEventInput())
    expect(unwrap(await dogfoodingService.listPublishEvents(CAMPAIGN, OTHER_ORG))).toEqual([])
  })
})

// ── Repository failures ─────────────────────────────────────────────────────

/** Every repository method throws — exercises the INTERNAL_ERROR catch paths. */
const boom = async (): Promise<never> => {
  throw new Error('boom')
}

const throwingRepo: IDogfoodingRepository = {
  createObjective: boom,
  findObjectiveById: boom,
  listObjectives: boom,
  updateObjectiveStatus: boom,
  createMarketingPlan: boom,
  findMarketingPlanByObjective: boom,
  createCampaign: boom,
  listCampaigns: boom,
  listCampaignsByObjective: boom,
  updateCampaignStatus: boom,
  updateCampaignDetails: boom,
  createAdCopyVariant: boom,
  listAdCopyVariants: boom,
  listAllCopyVariants: boom,
  approveAdCopyVariant: boom,
  rejectAdCopyVariant: boom,
  createCreative: boom,
  listCreatives: boom,
  listAllCreatives: boom,
  approveCreative: boom,
  rejectCreative: boom,
  createLearning: boom,
  listLearnings: boom,
  getMetaConnection: boom,
  upsertMetaConnection: boom,
  createCampaignAsset: boom,
  findCampaignAssetById: boom,
  listCampaignAssets: boom,
  updateCampaignAssetStatus: boom,
  createCampaignScript: boom,
  listCampaignScripts: boom,
  createCampaignCaption: boom,
  listCampaignCaptions: boom,
  createCampaignHashtagSet: boom,
  listCampaignHashtagSets: boom,
  createCalendarSlot: boom,
  listCalendarSlots: boom,
  createApprovalEvent: boom,
  listApprovalEvents: boom,
  createPublishEvent: boom,
  listPublishEvents: boom,
}

/** Every public service method, paired with a minimal valid invocation. */
const serviceCalls: Array<[string, () => Promise<PlatformResult<unknown>>]> = [
  ['createObjective', () => dogfoodingService.createObjective(objectiveInput())],
  ['createCampaign', () => dogfoodingService.createCampaign(campaignInput())],
  ['getObjective', () => dogfoodingService.getObjective('objective_1', ORG)],
  ['listObjectives', () => dogfoodingService.listObjectives(ORG)],
  [
    'updateObjectiveStatus',
    () => dogfoodingService.updateObjectiveStatus('objective_1', 'active', ORG),
  ],
  ['getMarketingPlan', () => dogfoodingService.getMarketingPlan('objective_1', ORG)],
  ['listCampaigns', () => dogfoodingService.listCampaigns(ORG)],
  [
    'listCampaignsByObjective',
    () => dogfoodingService.listCampaignsByObjective('objective_1', ORG),
  ],
  ['listAdCopyVariants', () => dogfoodingService.listAdCopyVariants(CAMPAIGN, ORG)],
  ['listAllCopyVariants', () => dogfoodingService.listAllCopyVariants(ORG)],
  ['listCreatives', () => dogfoodingService.listCreatives(CAMPAIGN, ORG)],
  ['listAllCreatives', () => dogfoodingService.listAllCreatives(ORG)],
  ['listLearnings', () => dogfoodingService.listLearnings(ORG)],
  ['getMetaConnection', () => dogfoodingService.getMetaConnection(ORG)],
  ['approveAdCopyVariant', () => dogfoodingService.approveAdCopyVariant('variant_1', null, ORG)],
  ['rejectAdCopyVariant', () => dogfoodingService.rejectAdCopyVariant('variant_1', null, ORG)],
  ['approveCreative', () => dogfoodingService.approveCreative('creative_1', null, ORG)],
  ['rejectCreative', () => dogfoodingService.rejectCreative('creative_1', null, ORG)],
  ['createCampaignAsset', () => dogfoodingService.createCampaignAsset(assetInput())],
  ['findCampaignAssetById', () => dogfoodingService.findCampaignAssetById('asset_1', ORG)],
  ['listCampaignAssets', () => dogfoodingService.listCampaignAssets(CAMPAIGN, ORG)],
  [
    'updateCampaignAssetStatus',
    () => dogfoodingService.updateCampaignAssetStatus('asset_1', 'ready', ORG),
  ],
  ['createCampaignScript', () => dogfoodingService.createCampaignScript(scriptInput())],
  ['listCampaignScripts', () => dogfoodingService.listCampaignScripts(CAMPAIGN, ORG)],
  ['createCampaignCaption', () => dogfoodingService.createCampaignCaption(captionInput())],
  ['listCampaignCaptions', () => dogfoodingService.listCampaignCaptions(CAMPAIGN, ORG)],
  ['createCampaignHashtagSet', () => dogfoodingService.createCampaignHashtagSet(hashtagSetInput())],
  ['listCampaignHashtagSets', () => dogfoodingService.listCampaignHashtagSets(CAMPAIGN, ORG)],
  ['createCalendarSlot', () => dogfoodingService.createCalendarSlot(calendarSlotInput())],
  ['listCalendarSlots', () => dogfoodingService.listCalendarSlots(CAMPAIGN, ORG)],
  ['createApprovalEvent', () => dogfoodingService.createApprovalEvent(approvalEventInput())],
  ['listApprovalEvents', () => dogfoodingService.listApprovalEvents(CAMPAIGN, ORG)],
  ['createPublishEvent', () => dogfoodingService.createPublishEvent(publishEventInput())],
  ['listPublishEvents', () => dogfoodingService.listPublishEvents(CAMPAIGN, ORG)],
]

describe('DogfoodingService — repository failures', () => {
  beforeEach(() => {
    _configureDogfoodingRepository(throwingRepo)
  })

  it.each(serviceCalls)('%s maps a repository failure to INTERNAL_ERROR', async (_name, call) => {
    const result = await call()
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe(PlatformErrorCode.INTERNAL_ERROR)
      expect(result.error.message).toContain('boom')
    }
  })

  it('covers every method on the service interface', () => {
    const covered = new Set(serviceCalls.map(([name]) => name))
    const methods = Object.getOwnPropertyNames(
      Object.getPrototypeOf(dogfoodingService) as object
    ).filter((name) => name !== 'constructor')
    expect([...methods].sort()).toEqual([...covered].sort())
  })
})
