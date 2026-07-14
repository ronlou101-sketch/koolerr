import type { OrganizationId } from '@/shared/types'
import type {
  ActorType,
  AdCopyVariant,
  ApprovalAssetType,
  ApprovalDecision,
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
    variant: Omit<
      AdCopyVariant,
      'id' | 'createdAt' | 'updatedAt' | 'approvalNote' | 'approvedAt' | 'publishStatus'
    >
  ): Promise<AdCopyVariant>
  listAdCopyVariants(campaignId: string, organizationId: OrganizationId): Promise<AdCopyVariant[]>
  listAllCopyVariants(organizationId: OrganizationId): Promise<AdCopyVariant[]>
  approveAdCopyVariant(
    id: string,
    note: string | null,
    organizationId: OrganizationId
  ): Promise<AdCopyVariant>
  rejectAdCopyVariant(
    id: string,
    note: string | null,
    organizationId: OrganizationId
  ): Promise<AdCopyVariant>

  // Creatives
  createCreative(
    creative: Omit<
      DogfoodingCreative,
      'id' | 'createdAt' | 'updatedAt' | 'approvalNote' | 'approvedAt' | 'publishStatus'
    >
  ): Promise<DogfoodingCreative>
  listCreatives(campaignId: string, organizationId: OrganizationId): Promise<DogfoodingCreative[]>
  listAllCreatives(organizationId: OrganizationId): Promise<DogfoodingCreative[]>
  approveCreative(
    id: string,
    note: string | null,
    organizationId: OrganizationId
  ): Promise<DogfoodingCreative>
  rejectCreative(
    id: string,
    note: string | null,
    organizationId: OrganizationId
  ): Promise<DogfoodingCreative>

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

  // Campaign Assets
  createCampaignAsset(input: CreateCampaignAssetInput): Promise<CampaignAsset>
  findCampaignAssetById(id: string, organizationId: OrganizationId): Promise<CampaignAsset | null>
  listCampaignAssets(campaignId: string, organizationId: OrganizationId): Promise<CampaignAsset[]>
  updateCampaignAssetStatus(
    id: string,
    status: CampaignAssetStatus,
    organizationId: OrganizationId
  ): Promise<CampaignAsset>

  // Campaign Scripts
  createCampaignScript(input: CreateCampaignScriptInput): Promise<CampaignScript>
  listCampaignScripts(campaignId: string, organizationId: OrganizationId): Promise<CampaignScript[]>

  // Campaign Captions
  createCampaignCaption(input: CreateCampaignCaptionInput): Promise<CampaignCaption>
  listCampaignCaptions(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<CampaignCaption[]>

  // Campaign Hashtag Sets
  createCampaignHashtagSet(input: CreateCampaignHashtagSetInput): Promise<CampaignHashtagSet>
  listCampaignHashtagSets(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<CampaignHashtagSet[]>

  // Calendar Slots
  createCalendarSlot(input: CreateCampaignCalendarSlotInput): Promise<CampaignCalendarSlot>
  listCalendarSlots(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<CampaignCalendarSlot[]>

  // Approval Events (append-only)
  createApprovalEvent(input: CreateCampaignApprovalEventInput): Promise<CampaignApprovalEvent>
  listApprovalEvents(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<CampaignApprovalEvent[]>

  // Publish Events (append-only)
  createPublishEvent(input: CreateCampaignPublishEventInput): Promise<CampaignPublishEvent>
  listPublishEvents(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<CampaignPublishEvent[]>
}
