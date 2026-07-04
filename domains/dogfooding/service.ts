import { ok, err } from '@/shared/types'
import { PlatformErrorCode } from '@/shared/types'
import type { OrganizationId, PlatformResult } from '@/shared/types'
import { logger } from '@/shared/lib/logger'
import type { IDogfoodingRepository } from './repository'
import { InMemoryDogfoodingRepository } from './in-memory-repository'
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

export interface IDogfoodingService {
  createObjective(input: CreateObjectiveInput): Promise<PlatformResult<DogfoodingObjective>>
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

  listCreatives(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<PlatformResult<DogfoodingCreative[]>>

  listLearnings(organizationId: OrganizationId): Promise<PlatformResult<DogfoodingLearning[]>>

  getMetaConnection(organizationId: OrganizationId): Promise<PlatformResult<MetaConnection | null>>
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
}

export const dogfoodingService: IDogfoodingService = new DogfoodingService()

export { _repo as _dogfoodingRepository }
