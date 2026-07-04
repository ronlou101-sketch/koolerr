import type { OrganizationId } from '@/shared/types'
import type { IDogfoodingRepository } from './repository'
import type {
  AdCopyVariant,
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

  async createAdCopyVariant(
    variant: Omit<AdCopyVariant, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<AdCopyVariant> {
    const v: AdCopyVariant = { ...variant, id: newId(), createdAt: now(), updatedAt: now() }
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

  async createCreative(
    creative: Omit<DogfoodingCreative, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DogfoodingCreative> {
    const cr: DogfoodingCreative = { ...creative, id: newId(), createdAt: now(), updatedAt: now() }
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
}
