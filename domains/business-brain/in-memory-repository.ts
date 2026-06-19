import type {
  BusinessBrain,
  BusinessBrainId,
  BusinessMemory,
  BusinessMemoryId,
  OrganizationId,
  TenantId,
  WorkforceId,
} from '@/shared/types'
import type { IBusinessBrainRepository, MemoryQueryOptions } from './repository'

export class InMemoryBusinessBrainRepository implements IBusinessBrainRepository {
  private readonly brains = new Map<OrganizationId, BusinessBrain>()
  private readonly memories = new Map<BusinessMemoryId, BusinessMemory>()
  /** organizationId → Set<BusinessMemoryId> */
  private readonly memoryIndex = new Map<OrganizationId, Set<BusinessMemoryId>>()

  async saveBrain(brain: BusinessBrain, _tenantId: TenantId): Promise<BusinessBrain> {
    this.brains.set(brain.organizationId, brain)
    return brain
  }

  async findBrainByOrganizationId(organizationId: OrganizationId): Promise<BusinessBrain | null> {
    return this.brains.get(organizationId) ?? null
  }

  async saveMemory(memory: BusinessMemory, _tenantId: TenantId): Promise<BusinessMemory> {
    this.memories.set(memory.id, memory)
    const ids = this.memoryIndex.get(memory.organizationId) ?? new Set<BusinessMemoryId>()
    ids.add(memory.id)
    this.memoryIndex.set(memory.organizationId, ids)
    return memory
  }

  async findMemoryById(id: BusinessMemoryId): Promise<BusinessMemory | null> {
    return this.memories.get(id) ?? null
  }

  async queryMemories(
    organizationId: OrganizationId,
    options: MemoryQueryOptions
  ): Promise<BusinessMemory[]> {
    const ids = this.memoryIndex.get(organizationId) ?? new Set()
    let results: BusinessMemory[] = []

    for (const id of ids) {
      const memory = this.memories.get(id)
      if (!memory) continue
      if (options.types?.length && !options.types.includes(memory.type)) continue
      if (options.relevanceScope?.length) {
        const overlaps = options.relevanceScope.some((s) => memory.relevanceScope.includes(s))
        if (!overlaps) continue
      }
      results.push(memory)
    }

    if (options.limit) results = results.slice(0, options.limit)
    return results
  }

  async listAllMemories(organizationId: OrganizationId): Promise<BusinessMemory[]> {
    const ids = this.memoryIndex.get(organizationId)
    if (!ids) return []
    return Array.from(ids)
      .map((id) => this.memories.get(id))
      .filter((m): m is BusinessMemory => m !== undefined)
  }

  async listMemoriesByWorkforce(
    workforceId: WorkforceId,
    organizationId: OrganizationId
  ): Promise<BusinessMemory[]> {
    const ids = this.memoryIndex.get(organizationId)
    if (!ids) return []
    return Array.from(ids)
      .map((id) => this.memories.get(id))
      .filter((m): m is BusinessMemory => m !== undefined && m.workforceId === workforceId)
  }
}
