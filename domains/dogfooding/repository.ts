import type { OrganizationId } from '@/shared/types'
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

export interface IDogfoodingRepository {
  // Objectives
  createObjective(input: CreateObjectiveInput): Promise<DogfoodingObjective>
  findObjectiveById(id: string, organizationId: OrganizationId): Promise<DogfoodingObjective | null>
  listObjectives(organizationId: OrganizationId): Promise<DogfoodingObjective[]>
  updateObjectiveStatus(
    id: string,
    status: DogfoodingObjective['status'],
    engagementRunId?: string
  ): Promise<DogfoodingObjective>

  // Marketing Plans
  createMarketingPlan(
    plan: Omit<MarketingPlan, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<MarketingPlan>
  findMarketingPlanByObjective(
    objectiveId: string,
    organizationId: OrganizationId
  ): Promise<MarketingPlan | null>

  // Campaigns
  createCampaign(
    campaign: Omit<DogfoodingCampaign, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DogfoodingCampaign>
  listCampaigns(organizationId: OrganizationId): Promise<DogfoodingCampaign[]>
  listCampaignsByObjective(
    objectiveId: string,
    organizationId: OrganizationId
  ): Promise<DogfoodingCampaign[]>
  updateCampaignStatus(
    id: string,
    status: DogfoodingCampaign['status']
  ): Promise<DogfoodingCampaign>
  updateCampaignDetails(
    id: string,
    updates: { planId?: string; engagementRunId?: string }
  ): Promise<DogfoodingCampaign>

  // Ad Copy
  createAdCopyVariant(
    variant: Omit<AdCopyVariant, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<AdCopyVariant>
  listAdCopyVariants(campaignId: string, organizationId: OrganizationId): Promise<AdCopyVariant[]>
  listAllCopyVariants(organizationId: OrganizationId): Promise<AdCopyVariant[]>

  // Creatives
  createCreative(
    creative: Omit<DogfoodingCreative, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DogfoodingCreative>
  listCreatives(campaignId: string, organizationId: OrganizationId): Promise<DogfoodingCreative[]>
  listAllCreatives(organizationId: OrganizationId): Promise<DogfoodingCreative[]>

  // Learnings
  createLearning(
    learning: Omit<DogfoodingLearning, 'id' | 'createdAt'>
  ): Promise<DogfoodingLearning>
  listLearnings(organizationId: OrganizationId): Promise<DogfoodingLearning[]>

  // Meta Connection
  getMetaConnection(organizationId: OrganizationId): Promise<MetaConnection | null>
  upsertMetaConnection(
    connection: Omit<MetaConnection, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<MetaConnection>
}
