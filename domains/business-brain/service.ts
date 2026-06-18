import { err, ok } from '@/shared/types'
import { PlatformErrorCode } from '@/shared/types'
import type {
  BusinessBrain,
  BusinessBrainId,
  BusinessMemory,
  BusinessMemoryId,
  OrganizationId,
  PlatformResult,
  TenantId,
} from '@/shared/types'
import { logger } from '@/shared/lib/logger'
import type {
  BusinessBrainContribution,
  BusinessBrainQuery,
  BusinessBrainQueryResult,
} from './types'
import type { IBusinessBrainRepository } from './repository'
import { InMemoryBusinessBrainRepository } from './in-memory-repository'

/**
 * Business Brain Domain Service Interface & Stub
 *
 * The Business Brain domain is the permanent, cumulative memory of an
 * Organization. It owns Business Brain lifecycle, Business Memory storage
 * and retrieval, and the contribution interface through which Workforces
 * write knowledge back to the Brain after completing Engagement Runs.
 *
 * Key invariants enforced here:
 * - One Brain per Organization (enforced at creation)
 * - Business Memory is versioned — updates increment the version counter
 * - Contributions route through a defined interface; no domain writes to
 *   Business Memory directly
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.3, §2.4, §3 — Business Brain.
 */

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface CreateBusinessBrainInput {
  tenantId: TenantId
  organizationId: OrganizationId
}

export interface StoreMemoryInput {
  tenantId: TenantId
  organizationId: OrganizationId
  memory: Omit<BusinessMemory, 'id' | 'businessBrainId' | 'version' | 'createdAt' | 'updatedAt'>
}

// ---------------------------------------------------------------------------
// Business Brain service interface
// ---------------------------------------------------------------------------

export interface IBusinessBrainService {
  /** Initialize the Business Brain for a new Organization. One per Org. */
  createBusinessBrain(input: CreateBusinessBrainInput): Promise<PlatformResult<BusinessBrain>>
  getBusinessBrain(organizationId: OrganizationId): Promise<PlatformResult<BusinessBrain>>

  /** Store a single unit of Business Memory. */
  storeMemory(input: StoreMemoryInput): Promise<PlatformResult<BusinessMemory>>
  /** Retrieve a single memory by ID. */
  getMemoryById(
    memoryId: BusinessMemoryId,
    organizationId: OrganizationId
  ): Promise<PlatformResult<BusinessMemory>>

  /**
   * Query Business Memory by type, relevance scope, and limit.
   * Used by Digital Employees at the start of an Engagement Run to load context.
   */
  queryMemory(query: BusinessBrainQuery): Promise<PlatformResult<BusinessBrainQueryResult>>

  /**
   * Accept a batch of memories from a Workforce after an Engagement Run.
   * This is the only approved path for Digital Employees to write to the Brain.
   */
  contributeMemories(
    contribution: BusinessBrainContribution
  ): Promise<PlatformResult<BusinessMemory[]>>
}

// ---------------------------------------------------------------------------
// Service implementation
// ---------------------------------------------------------------------------

class BusinessBrainService implements IBusinessBrainService {
  constructor(private readonly repo: IBusinessBrainRepository) {}

  async createBusinessBrain(
    input: CreateBusinessBrainInput
  ): Promise<PlatformResult<BusinessBrain>> {
    try {
      const existing = await this.repo.findBrainByOrganizationId(input.organizationId)
      if (existing) {
        return err({
          code: PlatformErrorCode.VALIDATION_ERROR,
          message: 'An Organization may have only one Business Brain',
        })
      }

      const brain: BusinessBrain = {
        id: `brain_${crypto.randomUUID()}` as BusinessBrainId,
        organizationId: input.organizationId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await this.repo.saveBrain(brain, input.tenantId)
      logger.info('[BUSINESS_BRAIN] Business Brain created', {
        tenantId: input.tenantId,
        organizationId: input.organizationId,
      })
      return ok(brain)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async getBusinessBrain(organizationId: OrganizationId): Promise<PlatformResult<BusinessBrain>> {
    try {
      const brain = await this.repo.findBrainByOrganizationId(organizationId)
      if (!brain) {
        return err({ code: PlatformErrorCode.NOT_FOUND, message: 'Business Brain not found' })
      }
      return ok(brain)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async storeMemory(input: StoreMemoryInput): Promise<PlatformResult<BusinessMemory>> {
    try {
      const brainResult = await this.getBusinessBrain(input.organizationId)
      if (!brainResult.ok) return brainResult

      const memory: BusinessMemory = {
        ...input.memory,
        id: `memory_${crypto.randomUUID()}` as BusinessMemoryId,
        businessBrainId: brainResult.value.id,
        organizationId: input.organizationId,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await this.repo.saveMemory(memory, input.tenantId)
      await this.repo.saveBrain({ ...brainResult.value, updatedAt: new Date() }, input.tenantId)
      return ok(memory)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async getMemoryById(
    memoryId: BusinessMemoryId,
    organizationId: OrganizationId
  ): Promise<PlatformResult<BusinessMemory>> {
    try {
      const memory = await this.repo.findMemoryById(memoryId)
      if (!memory) return err({ code: PlatformErrorCode.NOT_FOUND, message: 'Memory not found' })
      if (memory.organizationId !== organizationId) {
        return err({
          code: PlatformErrorCode.TENANT_ISOLATION_VIOLATION,
          message: 'Memory does not belong to this organization',
        })
      }
      return ok(memory)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async queryMemory(query: BusinessBrainQuery): Promise<PlatformResult<BusinessBrainQueryResult>> {
    try {
      const brainResult = await this.getBusinessBrain(query.organizationId)
      if (!brainResult.ok) return brainResult

      const memories = await this.repo.queryMemories(query.organizationId, {
        types: query.types,
        relevanceScope: query.relevanceScope,
        limit: query.limit,
      })

      return ok({
        businessBrainId: brainResult.value.id,
        memories,
        totalCount: memories.length,
      })
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async contributeMemories(
    contribution: BusinessBrainContribution
  ): Promise<PlatformResult<BusinessMemory[]>> {
    try {
      const brainResult = await this.getBusinessBrain(contribution.organizationId)
      if (!brainResult.ok) return brainResult

      const stored: BusinessMemory[] = []

      for (const raw of contribution.memories) {
        const memory: BusinessMemory = {
          ...raw,
          id: `memory_${crypto.randomUUID()}` as BusinessMemoryId,
          businessBrainId: brainResult.value.id,
          organizationId: contribution.organizationId,
          source: contribution.source,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        await this.repo.saveMemory(memory, contribution.tenantId)
        stored.push(memory)
      }

      if (stored.length > 0) {
        await this.repo.saveBrain(
          { ...brainResult.value, updatedAt: new Date() },
          contribution.tenantId
        )
        logger.info(`[BUSINESS_BRAIN] ${stored.length} memories contributed`, {
          organizationId: contribution.organizationId,
        })
      }

      return ok(stored)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton — defaults to in-memory; bootstrap swaps in Supabase repo
// ---------------------------------------------------------------------------

export let businessBrainService: IBusinessBrainService = new BusinessBrainService(
  new InMemoryBusinessBrainRepository()
)

export function _configureBusinessBrainRepository(repo: IBusinessBrainRepository): void {
  businessBrainService = new BusinessBrainService(repo)
}
