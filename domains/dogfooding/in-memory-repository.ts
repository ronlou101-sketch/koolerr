import type { OrganizationId } from '@/shared/types'
import type { IDogfoodingRepository } from './repository'
import type {
  AdCopyVariant,
  CampaignApprovalEvent,
  CampaignAsset,
  CampaignAssetStatus,
  CampaignCalendarSlot,
  CampaignCaption,
  CampaignHashtagSet,
  CampaignPublishEvent,
  CampaignScript,
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
  DogfoodingObjective,
  MarketingPlan,
  MetaConnection,
} from './types'

function newId() {
  return crypto.randomUUID()
}

function now() {
  return new Date()
}

export class InMemoryDogfoodingRepository implements IDogfoodingRepository {
  private readonly objectives = new Map<string, DogfoodingObjective>()
  private readonly plans = new Map<string, MarketingPlan>()
  private readonly campaigns = new Map<string, DogfoodingCampaign>()
  private readonly copyVariants = new Map<string, AdCopyVariant>()
  private readonly creatives = new Map<string, DogfoodingCreative>()
  private readonly learnings = new Map<string, DogfoodingLearning>()
  private readonly metaConnections = new Map<OrganizationId, MetaConnection>()
  private readonly campaignAssets = new Map<string, CampaignAsset>()
  private readonly campaignScripts = new Map<string, CampaignScript>()
  private readonly campaignCaptions = new Map<string, CampaignCaption>()
  private readonly campaignHashtagSets = new Map<string, CampaignHashtagSet>()
  private readonly calendarSlots = new Map<string, CampaignCalendarSlot>()
  private readonly approvalEvents = new Map<string, CampaignApprovalEvent>()
  private readonly publishEvents = new Map<string, CampaignPublishEvent>()

  async createObjective(input: CreateObjectiveInput): Promise<DogfoodingObjective> {
    const obj: DogfoodingObjective = {
      id: newId(),
      organizationId: input.organizationId,
      title: input.title,
      description: input.description,
      goalType: input.goalType,
      targetAudience: input.targetAudience ?? null,
      successMetrics: input.successMetrics ?? [],
      budgetCents: input.budgetCents ?? 0,
      status: 'draft',
      engagementRunId: null,
      createdAt: now(),
      updatedAt: now(),
    }
    this.objectives.set(obj.id, obj)
    return obj
  }

  async findObjectiveById(
    id: string,
    organizationId: OrganizationId
  ): Promise<DogfoodingObjective | null> {
    const obj = this.objectives.get(id)
    if (!obj || obj.organizationId !== organizationId) return null
    return obj
  }

  async listObjectives(organizationId: OrganizationId): Promise<DogfoodingObjective[]> {
    return [...this.objectives.values()].filter((o) => o.organizationId === organizationId)
  }

  async updateObjectiveStatus(
    id: string,
    status: DogfoodingObjective['status'],
    engagementRunId?: string
  ): Promise<DogfoodingObjective> {
    const obj = this.objectives.get(id)
    if (!obj) throw new Error(`Objective ${id} not found`)
    const updated = {
      ...obj,
      status,
      updatedAt: now(),
      ...(engagementRunId ? { engagementRunId } : {}),
    }
    this.objectives.set(id, updated)
    return updated
  }

  async createMarketingPlan(
    plan: Omit<MarketingPlan, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<MarketingPlan> {
    const p: MarketingPlan = { ...plan, id: newId(), createdAt: now(), updatedAt: now() }
    this.plans.set(p.id, p)
    return p
  }

  async findMarketingPlanByObjective(
    objectiveId: string,
    organizationId: OrganizationId
  ): Promise<MarketingPlan | null> {
    return (
      [...this.plans.values()].find(
        (p) => p.objectiveId === objectiveId && p.organizationId === organizationId
      ) ?? null
    )
  }

  async createCampaign(
    campaign: Omit<DogfoodingCampaign, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DogfoodingCampaign> {
    const c: DogfoodingCampaign = { ...campaign, id: newId(), createdAt: now(), updatedAt: now() }
    this.campaigns.set(c.id, c)
    return c
  }

  async listCampaigns(organizationId: OrganizationId): Promise<DogfoodingCampaign[]> {
    return [...this.campaigns.values()].filter((c) => c.organizationId === organizationId)
  }

  async listCampaignsByObjective(
    objectiveId: string,
    organizationId: OrganizationId
  ): Promise<DogfoodingCampaign[]> {
    return [...this.campaigns.values()].filter(
      (c) => c.objectiveId === objectiveId && c.organizationId === organizationId
    )
  }

  async updateCampaignStatus(
    id: string,
    status: DogfoodingCampaign['status']
  ): Promise<DogfoodingCampaign> {
    const c = this.campaigns.get(id)
    if (!c) throw new Error(`Campaign ${id} not found`)
    const updated = { ...c, status, updatedAt: now() }
    this.campaigns.set(id, updated)
    return updated
  }

  async updateCampaignDetails(
    id: string,
    updates: { planId?: string; engagementRunId?: string }
  ): Promise<DogfoodingCampaign> {
    const c = this.campaigns.get(id)
    if (!c) throw new Error(`Campaign ${id} not found`)
    const updated = {
      ...c,
      ...(updates.planId !== undefined ? { planId: updates.planId } : {}),
      ...(updates.engagementRunId !== undefined
        ? { engagementRunId: updates.engagementRunId }
        : {}),
      updatedAt: now(),
    }
    this.campaigns.set(id, updated)
    return updated
  }

  async createAdCopyVariant(
    variant: Omit<
      AdCopyVariant,
      'id' | 'createdAt' | 'updatedAt' | 'approvalNote' | 'approvedAt' | 'publishStatus'
    >
  ): Promise<AdCopyVariant> {
    const v: AdCopyVariant = {
      ...variant,
      approvalNote: null,
      approvedAt: null,
      publishStatus: 'unpublished',
      id: newId(),
      createdAt: now(),
      updatedAt: now(),
    }
    this.copyVariants.set(v.id, v)
    return v
  }

  async listAdCopyVariants(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<AdCopyVariant[]> {
    return [...this.copyVariants.values()].filter(
      (v) => v.campaignId === campaignId && v.organizationId === organizationId
    )
  }

  async listAllCopyVariants(organizationId: OrganizationId): Promise<AdCopyVariant[]> {
    return [...this.copyVariants.values()].filter((v) => v.organizationId === organizationId)
  }

  async createCreative(
    creative: Omit<
      DogfoodingCreative,
      'id' | 'createdAt' | 'updatedAt' | 'approvalNote' | 'approvedAt' | 'publishStatus'
    >
  ): Promise<DogfoodingCreative> {
    const cr: DogfoodingCreative = {
      ...creative,
      approvalNote: null,
      approvedAt: null,
      publishStatus: 'unpublished',
      id: newId(),
      createdAt: now(),
      updatedAt: now(),
    }
    this.creatives.set(cr.id, cr)
    return cr
  }

  async listCreatives(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<DogfoodingCreative[]> {
    return [...this.creatives.values()].filter(
      (cr) => cr.campaignId === campaignId && cr.organizationId === organizationId
    )
  }

  async listAllCreatives(organizationId: OrganizationId): Promise<DogfoodingCreative[]> {
    return [...this.creatives.values()].filter((cr) => cr.organizationId === organizationId)
  }

  async createLearning(
    learning: Omit<DogfoodingLearning, 'id' | 'createdAt'>
  ): Promise<DogfoodingLearning> {
    const l: DogfoodingLearning = { ...learning, id: newId(), createdAt: now() }
    this.learnings.set(l.id, l)
    return l
  }

  async listLearnings(organizationId: OrganizationId): Promise<DogfoodingLearning[]> {
    return [...this.learnings.values()].filter((l) => l.organizationId === organizationId)
  }

  async getMetaConnection(organizationId: OrganizationId): Promise<MetaConnection | null> {
    return this.metaConnections.get(organizationId) ?? null
  }

  async upsertMetaConnection(
    connection: Omit<MetaConnection, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<MetaConnection> {
    const existing = this.metaConnections.get(connection.organizationId)
    const mc: MetaConnection = {
      ...connection,
      id: existing?.id ?? newId(),
      createdAt: existing?.createdAt ?? now(),
      updatedAt: now(),
    }
    this.metaConnections.set(connection.organizationId, mc)
    return mc
  }

  async approveAdCopyVariant(
    id: string,
    note: string | null,
    organizationId: OrganizationId
  ): Promise<AdCopyVariant> {
    const v = this.copyVariants.get(id)
    if (!v || v.organizationId !== organizationId) throw new Error(`AdCopyVariant ${id} not found`)
    const updated = {
      ...v,
      status: 'approved' as const,
      approvalNote: note,
      approvedAt: now(),
      updatedAt: now(),
    }
    this.copyVariants.set(id, updated)
    return updated
  }

  async rejectAdCopyVariant(
    id: string,
    note: string | null,
    organizationId: OrganizationId
  ): Promise<AdCopyVariant> {
    const v = this.copyVariants.get(id)
    if (!v || v.organizationId !== organizationId) throw new Error(`AdCopyVariant ${id} not found`)
    const updated = { ...v, status: 'rejected' as const, approvalNote: note, updatedAt: now() }
    this.copyVariants.set(id, updated)
    return updated
  }

  async approveCreative(
    id: string,
    note: string | null,
    organizationId: OrganizationId
  ): Promise<DogfoodingCreative> {
    const cr = this.creatives.get(id)
    if (!cr || cr.organizationId !== organizationId) throw new Error(`Creative ${id} not found`)
    const updated = {
      ...cr,
      status: 'approved' as const,
      approvalNote: note,
      approvedAt: now(),
      updatedAt: now(),
    }
    this.creatives.set(id, updated)
    return updated
  }

  async rejectCreative(
    id: string,
    note: string | null,
    organizationId: OrganizationId
  ): Promise<DogfoodingCreative> {
    const cr = this.creatives.get(id)
    if (!cr || cr.organizationId !== organizationId) throw new Error(`Creative ${id} not found`)
    const updated = { ...cr, status: 'rejected' as const, approvalNote: note, updatedAt: now() }
    this.creatives.set(id, updated)
    return updated
  }

  async createCampaignAsset(input: CreateCampaignAssetInput): Promise<CampaignAsset> {
    const asset: CampaignAsset = {
      id: newId(),
      organizationId: input.organizationId,
      campaignId: input.campaignId,
      engagementRunId: input.engagementRunId ?? null,
      digitalEmployeeId: input.digitalEmployeeId ?? null,
      modelProvider: input.modelProvider,
      creativeId: input.creativeId ?? null,
      type: input.type,
      subtype: input.subtype ?? null,
      assetUrl: input.assetUrl ?? null,
      thumbnailUrl: input.thumbnailUrl ?? null,
      metadata: input.metadata ?? {},
      status: input.status ?? 'generating',
      approvalNote: null,
      approvedAt: null,
      publishStatus: 'unpublished',
      version: input.version ?? 1,
      parentAssetId: input.parentAssetId ?? null,
      createdAt: now(),
      updatedAt: now(),
    }
    this.campaignAssets.set(asset.id, asset)
    return asset
  }

  async findCampaignAssetById(
    id: string,
    organizationId: OrganizationId
  ): Promise<CampaignAsset | null> {
    const asset = this.campaignAssets.get(id)
    if (!asset || asset.organizationId !== organizationId) return null
    return asset
  }

  async listCampaignAssets(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<CampaignAsset[]> {
    return [...this.campaignAssets.values()].filter(
      (a) => a.campaignId === campaignId && a.organizationId === organizationId
    )
  }

  async updateCampaignAssetStatus(
    id: string,
    status: CampaignAssetStatus,
    organizationId: OrganizationId
  ): Promise<CampaignAsset> {
    const asset = this.campaignAssets.get(id)
    if (!asset || asset.organizationId !== organizationId)
      throw new Error(`CampaignAsset ${id} not found`)
    const updated = { ...asset, status, updatedAt: now() }
    this.campaignAssets.set(id, updated)
    return updated
  }

  async createCampaignScript(input: CreateCampaignScriptInput): Promise<CampaignScript> {
    const script: CampaignScript = {
      id: newId(),
      organizationId: input.organizationId,
      campaignId: input.campaignId,
      engagementRunId: input.engagementRunId ?? null,
      digitalEmployeeId: input.digitalEmployeeId ?? null,
      modelProvider: input.modelProvider ?? null,
      title: input.title,
      body: input.body,
      platform: input.platform ?? null,
      estimatedDurationSec: input.estimatedDurationSec ?? null,
      status: 'draft',
      approvalNote: null,
      approvedAt: null,
      version: input.version ?? 1,
      parentScriptId: input.parentScriptId ?? null,
      createdAt: now(),
      updatedAt: now(),
    }
    this.campaignScripts.set(script.id, script)
    return script
  }

  async listCampaignScripts(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<CampaignScript[]> {
    return [...this.campaignScripts.values()].filter(
      (s) => s.campaignId === campaignId && s.organizationId === organizationId
    )
  }

  async createCampaignCaption(input: CreateCampaignCaptionInput): Promise<CampaignCaption> {
    const caption: CampaignCaption = {
      id: newId(),
      organizationId: input.organizationId,
      campaignId: input.campaignId,
      engagementRunId: input.engagementRunId ?? null,
      digitalEmployeeId: input.digitalEmployeeId ?? null,
      modelProvider: input.modelProvider ?? null,
      platform: input.platform,
      body: input.body,
      characterCount: input.characterCount ?? input.body.length,
      pairedAssetId: input.pairedAssetId ?? null,
      status: 'draft',
      approvalNote: null,
      approvedAt: null,
      version: input.version ?? 1,
      parentCaptionId: input.parentCaptionId ?? null,
      createdAt: now(),
      updatedAt: now(),
    }
    this.campaignCaptions.set(caption.id, caption)
    return caption
  }

  async listCampaignCaptions(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<CampaignCaption[]> {
    return [...this.campaignCaptions.values()].filter(
      (c) => c.campaignId === campaignId && c.organizationId === organizationId
    )
  }

  async createCampaignHashtagSet(
    input: CreateCampaignHashtagSetInput
  ): Promise<CampaignHashtagSet> {
    const set: CampaignHashtagSet = {
      id: newId(),
      organizationId: input.organizationId,
      campaignId: input.campaignId,
      engagementRunId: input.engagementRunId ?? null,
      digitalEmployeeId: input.digitalEmployeeId ?? null,
      modelProvider: input.modelProvider ?? null,
      platform: input.platform,
      name: input.name,
      tags: input.tags,
      reachTier: input.reachTier ?? 'mid',
      status: 'draft',
      approvalNote: null,
      approvedAt: null,
      createdAt: now(),
      updatedAt: now(),
    }
    this.campaignHashtagSets.set(set.id, set)
    return set
  }

  async listCampaignHashtagSets(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<CampaignHashtagSet[]> {
    return [...this.campaignHashtagSets.values()].filter(
      (s) => s.campaignId === campaignId && s.organizationId === organizationId
    )
  }

  async createCalendarSlot(input: CreateCampaignCalendarSlotInput): Promise<CampaignCalendarSlot> {
    const slot: CampaignCalendarSlot = {
      id: newId(),
      organizationId: input.organizationId,
      campaignId: input.campaignId,
      scheduledAt: input.scheduledAt,
      platform: input.platform,
      assetId: input.assetId ?? null,
      copyVariantId: input.copyVariantId ?? null,
      captionId: input.captionId ?? null,
      hashtagSetId: input.hashtagSetId ?? null,
      status: 'draft',
      publishedAt: null,
      publishedBy: null,
      livePostUrl: null,
      createdAt: now(),
      updatedAt: now(),
    }
    this.calendarSlots.set(slot.id, slot)
    return slot
  }

  async listCalendarSlots(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<CampaignCalendarSlot[]> {
    return [...this.calendarSlots.values()]
      .filter((s) => s.campaignId === campaignId && s.organizationId === organizationId)
      .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
  }

  async createApprovalEvent(
    input: CreateCampaignApprovalEventInput
  ): Promise<CampaignApprovalEvent> {
    const event: CampaignApprovalEvent = {
      id: newId(),
      organizationId: input.organizationId,
      campaignId: input.campaignId,
      assetType: input.assetType,
      assetId: input.assetId,
      decision: input.decision,
      note: input.note ?? null,
      actorType: input.actorType,
      actorId: input.actorId,
      engagementRunId: input.engagementRunId ?? null,
      createdAt: now(),
    }
    this.approvalEvents.set(event.id, event)
    return event
  }

  async listApprovalEvents(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<CampaignApprovalEvent[]> {
    return [...this.approvalEvents.values()]
      .filter((e) => e.campaignId === campaignId && e.organizationId === organizationId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  async createPublishEvent(input: CreateCampaignPublishEventInput): Promise<CampaignPublishEvent> {
    const event: CampaignPublishEvent = {
      id: newId(),
      organizationId: input.organizationId,
      campaignId: input.campaignId,
      calendarSlotId: input.calendarSlotId ?? null,
      assetType: input.assetType,
      assetId: input.assetId,
      platform: input.platform,
      action: input.action,
      actorType: input.actorType,
      actorId: input.actorId,
      livePostUrl: input.livePostUrl ?? null,
      publishedAt: now(),
    }
    this.publishEvents.set(event.id, event)
    return event
  }

  async listPublishEvents(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<CampaignPublishEvent[]> {
    return [...this.publishEvents.values()]
      .filter((e) => e.campaignId === campaignId && e.organizationId === organizationId)
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
  }
}
