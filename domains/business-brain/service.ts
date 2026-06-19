import { err, ok } from '@/shared/types'
import { PlatformErrorCode } from '@/shared/types'
import type {
  BusinessBrain,
  BusinessBrainId,
  BusinessMemory,
  BusinessMemoryId,
  BusinessMemoryType,
  OrganizationId,
  PlatformResult,
  TenantId,
  WorkforceId,
} from '@/shared/types'
import { logger } from '@/shared/lib/logger'
import type {
  BrainIntelligenceReport,
  BusinessBrainContribution,
  BusinessBrainQuery,
  BusinessBrainQueryResult,
  BusinessInsight,
  MemoryTrendSummary,
} from './types'
import type { IBusinessBrainRepository } from './repository'
import { InMemoryBusinessBrainRepository } from './in-memory-repository'

// ---------------------------------------------------------------------------
// Intelligence Layer constants
// ---------------------------------------------------------------------------

/** Minimum memories of a single type required to surface a 'pattern' insight. */
export const PATTERN_INSIGHT_THRESHOLD = 3

/** Minimum distinct relevance scopes on a memory for it to be considered cross-cutting. */
const CROSS_CUTTING_SCOPE_MIN = 3

const ALL_MEMORY_TYPES: BusinessMemoryType[] = [
  'company_identity',
  'brand',
  'product',
  'service',
  'pricing',
  'policy',
  'sop',
  'customer',
  'asset',
  'knowledge',
  'preference',
  'decision',
]

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

  /**
   * Surface patterns, gaps, and trends across all accumulated Business Memory.
   * Returns an ephemeral intelligence report — insights are computed on demand
   * from current memory state and are not stored in the database.
   * See FOUNDATION_001_ARCHITECTURE.md §2.5 — Business Intelligence.
   */
  synthesizeInsights(
    organizationId: OrganizationId
  ): Promise<PlatformResult<BrainIntelligenceReport>>

  /**
   * Find memories related to a given memory by relevance scope overlap.
   * Results are ranked by overlap score (most overlapping scopes first).
   */
  findRelatedMemories(
    memoryId: BusinessMemoryId,
    organizationId: OrganizationId,
    limit?: number
  ): Promise<PlatformResult<BusinessMemory[]>>

  /**
   * Return every memory belonging to an organization.
   * Used by Analytics (Phase 2) and any other cross-cutting read that needs
   * the full corpus rather than a filtered page.
   */
  listAllMemories(organizationId: OrganizationId): Promise<PlatformResult<BusinessMemory[]>>

  /**
   * Return memories attributed to a specific Workforce.
   * Used by Atlas for cross-Workforce intelligence synthesis and V1 Readiness Reports.
   */
  listMemoriesByWorkforce(
    workforceId: WorkforceId,
    organizationId: OrganizationId
  ): Promise<PlatformResult<BusinessMemory[]>>
}

// ---------------------------------------------------------------------------
// Service implementation
// ---------------------------------------------------------------------------

export class BusinessBrainService implements IBusinessBrainService {
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

  async synthesizeInsights(
    organizationId: OrganizationId
  ): Promise<PlatformResult<BrainIntelligenceReport>> {
    try {
      const brainResult = await this.getBusinessBrain(organizationId)
      if (!brainResult.ok) return brainResult

      const memories = await this.repo.listAllMemories(organizationId)
      const insights: BusinessInsight[] = []

      // Count memories by type
      const countsByType: Partial<Record<BusinessMemoryType, number>> = {}
      for (const m of memories) {
        countsByType[m.type] = (countsByType[m.type] ?? 0) + 1
      }

      // No memories means no meaningful insights to surface
      if (memories.length === 0) {
        return ok({
          organizationId,
          businessBrainId: brainResult.value.id,
          generatedAt: new Date(),
          insights: [],
          trends: {
            totalMemories: 0,
            countsByType: {},
            mostDocumented: null,
            undocumentedTypes: ALL_MEMORY_TYPES,
          },
        })
      }

      // Pattern insights — types with enough entries indicate strong coverage
      for (const [rawType, count] of Object.entries(countsByType)) {
        const type = rawType as BusinessMemoryType
        if (count >= PATTERN_INSIGHT_THRESHOLD) {
          insights.push({
            type: 'pattern',
            title: `Strong ${type.replace(/_/g, ' ')} coverage`,
            finding: `Your Business Brain has ${count} documented ${type.replace(/_/g, ' ')} entries, indicating well-developed knowledge in this area.`,
            supportingMemoryIds: memories.filter((m) => m.type === type).map((m) => m.id),
          })
        }
      }

      // Gap insights — types with no entries surface coverage blind spots
      const undocumentedTypes = ALL_MEMORY_TYPES.filter((t) => !countsByType[t])
      for (const type of undocumentedTypes) {
        insights.push({
          type: 'gap',
          title: `No ${type.replace(/_/g, ' ')} documented`,
          finding: `Your Business Brain has no ${type.replace(/_/g, ' ')} entries. Adding this knowledge will improve Digital Employee effectiveness.`,
          supportingMemoryIds: [],
        })
      }

      // Trend insight — memories that span many relevance scopes are cross-cutting themes
      const crossCutting = memories.filter(
        (m) => m.relevanceScope.length >= CROSS_CUTTING_SCOPE_MIN
      )
      if (crossCutting.length > 0) {
        const scopeCounts: Record<string, number> = {}
        for (const scope of crossCutting.flatMap((m) => m.relevanceScope)) {
          scopeCounts[scope] = (scopeCounts[scope] ?? 0) + 1
        }
        const topScope = Object.entries(scopeCounts).sort(([, a], [, b]) => b - a)[0]?.[0]
        if (topScope) {
          insights.push({
            type: 'trend',
            title: `Cross-cutting theme: ${topScope}`,
            finding: `The scope "${topScope}" appears across ${crossCutting.length} memories, suggesting it is a recurring theme in your business knowledge.`,
            supportingMemoryIds: crossCutting.map((m) => m.id),
          })
        }
      }

      const sortedByCount = Object.entries(countsByType).sort(([, a], [, b]) => b - a)
      const mostDocumented = (sortedByCount[0]?.[0] as BusinessMemoryType | undefined) ?? null

      const trends: MemoryTrendSummary = {
        totalMemories: memories.length,
        countsByType,
        mostDocumented,
        undocumentedTypes,
      }

      return ok({
        organizationId,
        businessBrainId: brainResult.value.id,
        generatedAt: new Date(),
        insights,
        trends,
      })
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async findRelatedMemories(
    memoryId: BusinessMemoryId,
    organizationId: OrganizationId,
    limit = 10
  ): Promise<PlatformResult<BusinessMemory[]>> {
    try {
      const memResult = await this.getMemoryById(memoryId, organizationId)
      if (!memResult.ok) return memResult

      const target = memResult.value
      const all = await this.repo.listAllMemories(organizationId)

      const related = all
        .filter((m) => m.id !== memoryId)
        .map((m) => ({
          memory: m,
          overlap: m.relevanceScope.filter((s) => target.relevanceScope.includes(s)).length,
        }))
        .filter(({ overlap }) => overlap > 0)
        .sort((a, b) => b.overlap - a.overlap)
        .slice(0, limit)
        .map(({ memory }) => memory)

      return ok(related)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }
  async listAllMemories(organizationId: OrganizationId): Promise<PlatformResult<BusinessMemory[]>> {
    try {
      const memories = await this.repo.listAllMemories(organizationId)
      return ok(memories)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async listMemoriesByWorkforce(
    workforceId: WorkforceId,
    organizationId: OrganizationId
  ): Promise<PlatformResult<BusinessMemory[]>> {
    try {
      const memories = await this.repo.listMemoriesByWorkforce(workforceId, organizationId)
      return ok(memories)
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
