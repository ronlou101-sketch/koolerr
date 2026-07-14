import { ok, err } from '@/shared/types'
import { PlatformErrorCode } from '@/shared/types'
import type { OrganizationId, PlatformResult } from '@/shared/types'
import { logger } from '@/shared/lib/logger'
import type { IDogfoodingRepository } from './repository'
import { InMemoryDogfoodingRepository } from './in-memory-repository'
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

export interface IDogfoodingService {
  createObjective(input: CreateObjectiveInput): Promise<PlatformResult<DogfoodingObjective>>
  createCampaign(
    campaign: Omit<DogfoodingCampaign, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<PlatformResult<DogfoodingCampaign>>
  getObjective(
    id: string,
    organizationId: OrganizationId
  ): Promise<PlatformResult<DogfoodingObjective>>
  listObjectives(organizationId: OrganizationId): Promise<PlatformResult<DogfoodingObjective[]>>
  updateObjectiveStatus(
    id: string,
    status: DogfoodingObjective['status'],
    engagementRunId?: string
  ): Promise<PlatformResult<DogfoodingObjective>>

  getMarketingPlan(
    objectiveId: string,
    organizationId: OrganizationId
  ): Promise<PlatformResult<MarketingPlan | null>>

  listCampaigns(organizationId: OrganizationId): Promise<PlatformResult<DogfoodingCampaign[]>>
  listCampaignsByObjective(
    objectiveId: string,
    organizationId: OrganizationId
  ): Promise<PlatformResult<DogfoodingCampaign[]>>

  listAdCopyVariants(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<PlatformResult<AdCopyVariant[]>>
  listAllCopyVariants(organizationId: OrganizationId): Promise<PlatformResult<AdCopyVariant[]>>

  listCreatives(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<PlatformResult<DogfoodingCreative[]>>
  listAllCreatives(organizationId: OrganizationId): Promise<PlatformResult<DogfoodingCreative[]>>

  listLearnings(organizationId: OrganizationId): Promise<PlatformResult<DogfoodingLearning[]>>

  getMetaConnection(organizationId: OrganizationId): Promise<PlatformResult<MetaConnection | null>>

  approveAdCopyVariant(
    id: string,
    note: string | null,
    organizationId: OrganizationId
  ): Promise<PlatformResult<AdCopyVariant>>
  rejectAdCopyVariant(
    id: string,
    note: string | null,
    organizationId: OrganizationId
  ): Promise<PlatformResult<AdCopyVariant>>
  approveCreative(
    id: string,
    note: string | null,
    organizationId: OrganizationId
  ): Promise<PlatformResult<DogfoodingCreative>>
  rejectCreative(
    id: string,
    note: string | null,
    organizationId: OrganizationId
  ): Promise<PlatformResult<DogfoodingCreative>>

  createCampaignAsset(input: CreateCampaignAssetInput): Promise<PlatformResult<CampaignAsset>>
  findCampaignAssetById(
    id: string,
    organizationId: OrganizationId
  ): Promise<PlatformResult<CampaignAsset | null>>
  listCampaignAssets(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<PlatformResult<CampaignAsset[]>>
  updateCampaignAssetStatus(
    id: string,
    status: CampaignAssetStatus,
    organizationId: OrganizationId
  ): Promise<PlatformResult<CampaignAsset>>

  createCampaignScript(input: CreateCampaignScriptInput): Promise<PlatformResult<CampaignScript>>
  listCampaignScripts(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<PlatformResult<CampaignScript[]>>

  createCampaignCaption(input: CreateCampaignCaptionInput): Promise<PlatformResult<CampaignCaption>>
  listCampaignCaptions(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<PlatformResult<CampaignCaption[]>>

  createCampaignHashtagSet(
    input: CreateCampaignHashtagSetInput
  ): Promise<PlatformResult<CampaignHashtagSet>>
  listCampaignHashtagSets(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<PlatformResult<CampaignHashtagSet[]>>

  createCalendarSlot(
    input: CreateCampaignCalendarSlotInput
  ): Promise<PlatformResult<CampaignCalendarSlot>>
  listCalendarSlots(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<PlatformResult<CampaignCalendarSlot[]>>

  createApprovalEvent(
    input: CreateCampaignApprovalEventInput
  ): Promise<PlatformResult<CampaignApprovalEvent>>
  listApprovalEvents(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<PlatformResult<CampaignApprovalEvent[]>>

  createPublishEvent(
    input: CreateCampaignPublishEventInput
  ): Promise<PlatformResult<CampaignPublishEvent>>
  listPublishEvents(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<PlatformResult<CampaignPublishEvent[]>>
}

let _repo: IDogfoodingRepository = new InMemoryDogfoodingRepository()

export function _configureDogfoodingRepository(repo: IDogfoodingRepository): void {
  _repo = repo
}

class DogfoodingService implements IDogfoodingService {
  async createObjective(input: CreateObjectiveInput): Promise<PlatformResult<DogfoodingObjective>> {
    try {
      const objective = await _repo.createObjective(input)
      logger.info('[DOGFOODING] Objective created', {
        id: objective.id,
        organizationId: input.organizationId,
        goalType: input.goalType,
      })
      return ok(objective)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async createCampaign(
    campaign: Omit<DogfoodingCampaign, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<PlatformResult<DogfoodingCampaign>> {
    try {
      const created = await _repo.createCampaign(campaign)
      logger.info('[DOGFOODING] Campaign created', {
        id: created.id,
        organizationId: campaign.organizationId,
        objectiveId: campaign.objectiveId,
      })
      return ok(created)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async getObjective(
    id: string,
    organizationId: OrganizationId
  ): Promise<PlatformResult<DogfoodingObjective>> {
    try {
      const objective = await _repo.findObjectiveById(id, organizationId)
      if (!objective) {
        return err({ code: PlatformErrorCode.NOT_FOUND, message: 'Objective not found' })
      }
      return ok(objective)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async listObjectives(
    organizationId: OrganizationId
  ): Promise<PlatformResult<DogfoodingObjective[]>> {
    try {
      const objectives = await _repo.listObjectives(organizationId)
      return ok(objectives)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async updateObjectiveStatus(
    id: string,
    status: DogfoodingObjective['status'],
    engagementRunId?: string
  ): Promise<PlatformResult<DogfoodingObjective>> {
    try {
      const objective = await _repo.updateObjectiveStatus(id, status, engagementRunId)
      return ok(objective)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async getMarketingPlan(
    objectiveId: string,
    organizationId: OrganizationId
  ): Promise<PlatformResult<MarketingPlan | null>> {
    try {
      const plan = await _repo.findMarketingPlanByObjective(objectiveId, organizationId)
      return ok(plan)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async listCampaigns(
    organizationId: OrganizationId
  ): Promise<PlatformResult<DogfoodingCampaign[]>> {
    try {
      const campaigns = await _repo.listCampaigns(organizationId)
      return ok(campaigns)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async listCampaignsByObjective(
    objectiveId: string,
    organizationId: OrganizationId
  ): Promise<PlatformResult<DogfoodingCampaign[]>> {
    try {
      const campaigns = await _repo.listCampaignsByObjective(objectiveId, organizationId)
      return ok(campaigns)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async listAdCopyVariants(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<PlatformResult<AdCopyVariant[]>> {
    try {
      const variants = await _repo.listAdCopyVariants(campaignId, organizationId)
      return ok(variants)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async listAllCopyVariants(
    organizationId: OrganizationId
  ): Promise<PlatformResult<AdCopyVariant[]>> {
    try {
      const variants = await _repo.listAllCopyVariants(organizationId)
      return ok(variants)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async listCreatives(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<PlatformResult<DogfoodingCreative[]>> {
    try {
      const creatives = await _repo.listCreatives(campaignId, organizationId)
      return ok(creatives)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async listAllCreatives(
    organizationId: OrganizationId
  ): Promise<PlatformResult<DogfoodingCreative[]>> {
    try {
      const creatives = await _repo.listAllCreatives(organizationId)
      return ok(creatives)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async listLearnings(
    organizationId: OrganizationId
  ): Promise<PlatformResult<DogfoodingLearning[]>> {
    try {
      const learnings = await _repo.listLearnings(organizationId)
      return ok(learnings)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async getMetaConnection(
    organizationId: OrganizationId
  ): Promise<PlatformResult<MetaConnection | null>> {
    try {
      const connection = await _repo.getMetaConnection(organizationId)
      return ok(connection)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async approveAdCopyVariant(
    id: string,
    note: string | null,
    organizationId: OrganizationId
  ): Promise<PlatformResult<AdCopyVariant>> {
    try {
      return ok(await _repo.approveAdCopyVariant(id, note, organizationId))
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async rejectAdCopyVariant(
    id: string,
    note: string | null,
    organizationId: OrganizationId
  ): Promise<PlatformResult<AdCopyVariant>> {
    try {
      return ok(await _repo.rejectAdCopyVariant(id, note, organizationId))
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async approveCreative(
    id: string,
    note: string | null,
    organizationId: OrganizationId
  ): Promise<PlatformResult<DogfoodingCreative>> {
    try {
      return ok(await _repo.approveCreative(id, note, organizationId))
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async rejectCreative(
    id: string,
    note: string | null,
    organizationId: OrganizationId
  ): Promise<PlatformResult<DogfoodingCreative>> {
    try {
      return ok(await _repo.rejectCreative(id, note, organizationId))
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async createCampaignAsset(
    input: CreateCampaignAssetInput
  ): Promise<PlatformResult<CampaignAsset>> {
    try {
      return ok(await _repo.createCampaignAsset(input))
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async findCampaignAssetById(
    id: string,
    organizationId: OrganizationId
  ): Promise<PlatformResult<CampaignAsset | null>> {
    try {
      return ok(await _repo.findCampaignAssetById(id, organizationId))
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async listCampaignAssets(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<PlatformResult<CampaignAsset[]>> {
    try {
      return ok(await _repo.listCampaignAssets(campaignId, organizationId))
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async updateCampaignAssetStatus(
    id: string,
    status: CampaignAssetStatus,
    organizationId: OrganizationId
  ): Promise<PlatformResult<CampaignAsset>> {
    try {
      return ok(await _repo.updateCampaignAssetStatus(id, status, organizationId))
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async createCampaignScript(
    input: CreateCampaignScriptInput
  ): Promise<PlatformResult<CampaignScript>> {
    try {
      return ok(await _repo.createCampaignScript(input))
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async listCampaignScripts(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<PlatformResult<CampaignScript[]>> {
    try {
      return ok(await _repo.listCampaignScripts(campaignId, organizationId))
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async createCampaignCaption(
    input: CreateCampaignCaptionInput
  ): Promise<PlatformResult<CampaignCaption>> {
    try {
      return ok(await _repo.createCampaignCaption(input))
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async listCampaignCaptions(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<PlatformResult<CampaignCaption[]>> {
    try {
      return ok(await _repo.listCampaignCaptions(campaignId, organizationId))
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async createCampaignHashtagSet(
    input: CreateCampaignHashtagSetInput
  ): Promise<PlatformResult<CampaignHashtagSet>> {
    try {
      return ok(await _repo.createCampaignHashtagSet(input))
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async listCampaignHashtagSets(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<PlatformResult<CampaignHashtagSet[]>> {
    try {
      return ok(await _repo.listCampaignHashtagSets(campaignId, organizationId))
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async createCalendarSlot(
    input: CreateCampaignCalendarSlotInput
  ): Promise<PlatformResult<CampaignCalendarSlot>> {
    try {
      return ok(await _repo.createCalendarSlot(input))
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async listCalendarSlots(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<PlatformResult<CampaignCalendarSlot[]>> {
    try {
      return ok(await _repo.listCalendarSlots(campaignId, organizationId))
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async createApprovalEvent(
    input: CreateCampaignApprovalEventInput
  ): Promise<PlatformResult<CampaignApprovalEvent>> {
    try {
      return ok(await _repo.createApprovalEvent(input))
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async listApprovalEvents(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<PlatformResult<CampaignApprovalEvent[]>> {
    try {
      return ok(await _repo.listApprovalEvents(campaignId, organizationId))
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async createPublishEvent(
    input: CreateCampaignPublishEventInput
  ): Promise<PlatformResult<CampaignPublishEvent>> {
    try {
      return ok(await _repo.createPublishEvent(input))
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async listPublishEvents(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<PlatformResult<CampaignPublishEvent[]>> {
    try {
      return ok(await _repo.listPublishEvents(campaignId, organizationId))
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }
}

export const dogfoodingService: IDogfoodingService = new DogfoodingService()

export { _repo as _dogfoodingRepository }
