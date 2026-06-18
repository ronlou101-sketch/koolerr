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
 * - The Brain never leaves the platform unless the customer explicitly exports it
 *
 * The stub manages state in memory. The production implementation will
 * persist to Supabase with full-text and vector search for memory retrieval
 * and RLS enforcing tenant isolation.
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
// In-memory stub implementation
// ---------------------------------------------------------------------------

class BusinessBrainService implements IBusinessBrainService {
  private readonly brains = new Map<OrganizationId, BusinessBrain>()
  private readonly memories = new Map<BusinessMemoryId, BusinessMemory>()
  /** organizationId → Set<BusinessMemoryId> for scoped queries. */
  private readonly memoryIndex = new Map<OrganizationId, Set<BusinessMemoryId>>()

  async createBusinessBrain(
    input: CreateBusinessBrainInput
  ): Promise<PlatformResult<BusinessBrain>> {
    if (this.brains.has(input.organizationId)) {
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

    this.brains.set(input.organizationId, brain)
    this.memoryIndex.set(input.organizationId, new Set())
    logger.info('[BUSINESS_BRAIN] Business Brain created', {
      tenantId: input.tenantId,
      organizationId: input.organizationId,
    })

    return ok(brain)
  }

  async getBusinessBrain(organizationId: OrganizationId): Promise<PlatformResult<BusinessBrain>> {
    const brain = this.brains.get(organizationId)
    if (!brain) {
      return err({ code: PlatformErrorCode.NOT_FOUND, message: 'Business Brain not found' })
    }
    return ok(brain)
  }

  async storeMemory(input: StoreMemoryInput): Promise<PlatformResult<BusinessMemory>> {
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

    this.memories.set(memory.id, memory)
    this.indexMemory(input.organizationId, memory.id)

    this.brains.set(input.organizationId, {
      ...brainResult.value,
      updatedAt: new Date(),
    })

    return ok(memory)
  }

  async getMemoryById(
    memoryId: BusinessMemoryId,
    organizationId: OrganizationId
  ): Promise<PlatformResult<BusinessMemory>> {
    const memory = this.memories.get(memoryId)
    if (!memory) return err({ code: PlatformErrorCode.NOT_FOUND, message: 'Memory not found' })
    if (memory.organizationId !== organizationId) {
      return err({
        code: PlatformErrorCode.TENANT_ISOLATION_VIOLATION,
        message: 'Memory does not belong to this organization',
      })
    }
    return ok(memory)
  }

  async queryMemory(query: BusinessBrainQuery): Promise<PlatformResult<BusinessBrainQueryResult>> {
    const brainResult = await this.getBusinessBrain(query.organizationId)
    if (!brainResult.ok) return brainResult

    const ids = this.memoryIndex.get(query.organizationId) ?? new Set()
    let results: BusinessMemory[] = []

    for (const id of ids) {
      const memory = this.memories.get(id)
      if (!memory) continue
      if (query.types && query.types.length > 0 && !query.types.includes(memory.type)) continue
      if (query.relevanceScope && query.relevanceScope.length > 0) {
        const overlaps = query.relevanceScope.some((s) => memory.relevanceScope.includes(s))
        if (!overlaps) continue
      }
      results.push(memory)
    }

    if (query.limit) results = results.slice(0, query.limit)

    return ok({
      businessBrainId: brainResult.value.id,
      memories: results,
      totalCount: results.length,
    })
  }

  async contributeMemories(
    contribution: BusinessBrainContribution
  ): Promise<PlatformResult<BusinessMemory[]>> {
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
      this.memories.set(memory.id, memory)
      this.indexMemory(contribution.organizationId, memory.id)
      stored.push(memory)
    }

    if (stored.length > 0) {
      this.brains.set(contribution.organizationId, {
        ...brainResult.value,
        updatedAt: new Date(),
      })
      logger.info(`[BUSINESS_BRAIN] ${stored.length} memories contributed`, {
        organizationId: contribution.organizationId,
      })
    }

    return ok(stored)
  }

  private indexMemory(organizationId: OrganizationId, memoryId: BusinessMemoryId): void {
    const existing = this.memoryIndex.get(organizationId) ?? new Set<BusinessMemoryId>()
    existing.add(memoryId)
    this.memoryIndex.set(organizationId, existing)
  }
}

export const businessBrainService: IBusinessBrainService = new BusinessBrainService()
