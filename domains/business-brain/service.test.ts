import { beforeEach, describe, expect, it } from 'vitest'
import { PlatformErrorCode } from '@/shared/types'
import type {
  BusinessMemoryId,
  BusinessMemoryType,
  OrganizationId,
  TenantId,
  WorkforceId,
} from '@/shared/types'
import { BusinessBrainService, PATTERN_INSIGHT_THRESHOLD, type StoreMemoryInput } from './service'
import { InMemoryBusinessBrainRepository } from './in-memory-repository'
import type { IBusinessBrainRepository } from './repository'

// ── Fixtures ────────────────────────────────────────────────────────────────

const TENANT = 'tenant_bb' as TenantId
const ORG = 'org_bb' as OrganizationId
const OTHER_ORG = 'org_other' as OrganizationId

function makeService() {
  return new BusinessBrainService(new InMemoryBusinessBrainRepository())
}

function memoryInput(
  overrides: Partial<StoreMemoryInput['memory']> = {}
): StoreMemoryInput['memory'] {
  return {
    organizationId: ORG,
    type: 'knowledge' as BusinessMemoryType,
    content: { note: 'value' },
    source: 'test',
    relevanceScope: ['all'],
    ...overrides,
  }
}

/** A repository whose every method throws — exercises the INTERNAL_ERROR catch paths. */
const throwingRepo: IBusinessBrainRepository = {
  saveBrain: async () => {
    throw new Error('boom')
  },
  findBrainByOrganizationId: async () => {
    throw new Error('boom')
  },
  saveMemory: async () => {
    throw new Error('boom')
  },
  findMemoryById: async () => {
    throw new Error('boom')
  },
  queryMemories: async () => {
    throw new Error('boom')
  },
  listAllMemories: async () => {
    throw new Error('boom')
  },
  listMemoriesByWorkforce: async () => {
    throw new Error('boom')
  },
}

// ── createBusinessBrain / getBusinessBrain ─────────────────────────────────────

describe('BusinessBrainService — brain lifecycle', () => {
  let service: BusinessBrainService
  beforeEach(() => {
    service = makeService()
  })

  it('creates a Business Brain for a new organization', async () => {
    const result = await service.createBusinessBrain({ tenantId: TENANT, organizationId: ORG })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.organizationId).toBe(ORG)
      expect(result.value.id).toMatch(/^brain_/)
    }
  })

  it('rejects a second brain for the same organization', async () => {
    await service.createBusinessBrain({ tenantId: TENANT, organizationId: ORG })
    const second = await service.createBusinessBrain({ tenantId: TENANT, organizationId: ORG })
    expect(second.ok).toBe(false)
    if (!second.ok) expect(second.error.code).toBe(PlatformErrorCode.VALIDATION_ERROR)
  })

  it('getBusinessBrain returns the brain once created', async () => {
    await service.createBusinessBrain({ tenantId: TENANT, organizationId: ORG })
    const result = await service.getBusinessBrain(ORG)
    expect(result.ok).toBe(true)
  })

  it('getBusinessBrain returns NOT_FOUND when none exists', async () => {
    const result = await service.getBusinessBrain(ORG)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.NOT_FOUND)
  })

  it('returns INTERNAL_ERROR when the repository throws', async () => {
    const failing = new BusinessBrainService(throwingRepo)
    const result = await failing.createBusinessBrain({ tenantId: TENANT, organizationId: ORG })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.INTERNAL_ERROR)
  })
})

// ── storeMemory / getMemoryById ────────────────────────────────────────────────

describe('BusinessBrainService — memory storage & retrieval', () => {
  let service: BusinessBrainService
  beforeEach(async () => {
    service = makeService()
    await service.createBusinessBrain({ tenantId: TENANT, organizationId: ORG })
  })

  it('storeMemory fails when the brain does not exist', async () => {
    const fresh = makeService()
    const result = await fresh.storeMemory({
      tenantId: TENANT,
      organizationId: ORG,
      memory: memoryInput(),
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.NOT_FOUND)
  })

  it('stores a memory with version 1 and a generated id', async () => {
    const result = await service.storeMemory({
      tenantId: TENANT,
      organizationId: ORG,
      memory: memoryInput(),
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.version).toBe(1)
      expect(result.value.id).toMatch(/^memory_/)
      expect(result.value.organizationId).toBe(ORG)
    }
  })

  it('a stored memory is retrievable by id', async () => {
    const stored = await service.storeMemory({
      tenantId: TENANT,
      organizationId: ORG,
      memory: memoryInput(),
    })
    if (!stored.ok) throw new Error('setup failed')
    const found = await service.getMemoryById(stored.value.id, ORG)
    expect(found.ok).toBe(true)
    if (found.ok) expect(found.value.id).toBe(stored.value.id)
  })

  it('getMemoryById returns NOT_FOUND for an unknown id', async () => {
    const result = await service.getMemoryById('memory_missing' as BusinessMemoryId, ORG)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.NOT_FOUND)
  })

  it('getMemoryById enforces tenant isolation across organizations', async () => {
    const stored = await service.storeMemory({
      tenantId: TENANT,
      organizationId: ORG,
      memory: memoryInput(),
    })
    if (!stored.ok) throw new Error('setup failed')
    const result = await service.getMemoryById(stored.value.id, OTHER_ORG)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe(PlatformErrorCode.TENANT_ISOLATION_VIOLATION)
    }
  })
})

// ── queryMemory ────────────────────────────────────────────────────────────────

describe('BusinessBrainService — queryMemory', () => {
  let service: BusinessBrainService
  beforeEach(async () => {
    service = makeService()
    await service.createBusinessBrain({ tenantId: TENANT, organizationId: ORG })
    await service.storeMemory({
      tenantId: TENANT,
      organizationId: ORG,
      memory: memoryInput({ type: 'knowledge', relevanceScope: ['all', 'seo'] }),
    })
    await service.storeMemory({
      tenantId: TENANT,
      organizationId: ORG,
      memory: memoryInput({ type: 'brand', relevanceScope: ['all'] }),
    })
  })

  it('returns an error when the brain is missing', async () => {
    const fresh = makeService()
    const result = await fresh.queryMemory({ organizationId: ORG })
    expect(result.ok).toBe(false)
  })

  it('returns all memories with a totalCount', async () => {
    const result = await service.queryMemory({ organizationId: ORG })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.totalCount).toBe(2)
  })

  it('filters by memory type', async () => {
    const result = await service.queryMemory({ organizationId: ORG, types: ['brand'] })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.memories).toHaveLength(1)
      expect(result.value.memories[0].type).toBe('brand')
    }
  })

  it('filters by relevance scope overlap', async () => {
    const result = await service.queryMemory({ organizationId: ORG, relevanceScope: ['seo'] })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.memories).toHaveLength(1)
  })

  it('respects the limit', async () => {
    const result = await service.queryMemory({ organizationId: ORG, limit: 1 })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.memories).toHaveLength(1)
  })
})

// ── contributeMemories ─────────────────────────────────────────────────────────

describe('BusinessBrainService — contributeMemories', () => {
  let service: BusinessBrainService
  beforeEach(async () => {
    service = makeService()
    await service.createBusinessBrain({ tenantId: TENANT, organizationId: ORG })
  })

  it('stores a batch and stamps the contribution source on each memory', async () => {
    const result = await service.contributeMemories({
      tenantId: TENANT,
      organizationId: ORG,
      source: 'engagement_run:run_1',
      memories: [memoryInput({ source: 'ignored' }), memoryInput({ type: 'brand' })],
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toHaveLength(2)
      expect(result.value.every((m) => m.source === 'engagement_run:run_1')).toBe(true)
      expect(result.value.every((m) => m.version === 1)).toBe(true)
    }
  })

  it('returns an empty array when there are no memories to contribute', async () => {
    const result = await service.contributeMemories({
      tenantId: TENANT,
      organizationId: ORG,
      source: 'engagement_run:run_2',
      memories: [],
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toHaveLength(0)
  })

  it('fails when the brain does not exist', async () => {
    const fresh = makeService()
    const result = await fresh.contributeMemories({
      tenantId: TENANT,
      organizationId: ORG,
      source: 's',
      memories: [memoryInput()],
    })
    expect(result.ok).toBe(false)
  })
})

// ── synthesizeInsights ─────────────────────────────────────────────────────────

describe('BusinessBrainService — synthesizeInsights', () => {
  let service: BusinessBrainService
  beforeEach(async () => {
    service = makeService()
    await service.createBusinessBrain({ tenantId: TENANT, organizationId: ORG })
  })

  it('returns an empty report with all types undocumented when there are no memories', async () => {
    const result = await service.synthesizeInsights(ORG)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.insights).toHaveLength(0)
      expect(result.value.trends.totalMemories).toBe(0)
      expect(result.value.trends.mostDocumented).toBeNull()
      expect(result.value.trends.undocumentedTypes).toContain('knowledge')
    }
  })

  it('surfaces a pattern insight when a type meets the threshold', async () => {
    for (let i = 0; i < PATTERN_INSIGHT_THRESHOLD; i++) {
      await service.storeMemory({
        tenantId: TENANT,
        organizationId: ORG,
        memory: memoryInput({ type: 'knowledge' }),
      })
    }
    const result = await service.synthesizeInsights(ORG)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.insights.some((i) => i.type === 'pattern')).toBe(true)
      expect(result.value.trends.mostDocumented).toBe('knowledge')
    }
  })

  it('surfaces gap insights for undocumented types', async () => {
    await service.storeMemory({
      tenantId: TENANT,
      organizationId: ORG,
      memory: memoryInput({ type: 'knowledge' }),
    })
    const result = await service.synthesizeInsights(ORG)
    expect(result.ok).toBe(true)
    if (result.ok) {
      const gaps = result.value.insights.filter((i) => i.type === 'gap')
      expect(gaps.length).toBeGreaterThan(0)
    }
  })

  it('surfaces a cross-cutting trend insight for memories spanning many scopes', async () => {
    await service.storeMemory({
      tenantId: TENANT,
      organizationId: ORG,
      memory: memoryInput({ relevanceScope: ['all', 'seo', 'content', 'brand'] }),
    })
    const result = await service.synthesizeInsights(ORG)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.insights.some((i) => i.type === 'trend')).toBe(true)
    }
  })

  it('returns an error when the brain is missing', async () => {
    const fresh = makeService()
    const result = await fresh.synthesizeInsights(ORG)
    expect(result.ok).toBe(false)
  })
})

// ── findRelatedMemories / list helpers ─────────────────────────────────────────

describe('BusinessBrainService — related & list helpers', () => {
  let service: BusinessBrainService
  beforeEach(async () => {
    service = makeService()
    await service.createBusinessBrain({ tenantId: TENANT, organizationId: ORG })
  })

  it('findRelatedMemories ranks by relevance-scope overlap and excludes the source', async () => {
    const source = await service.storeMemory({
      tenantId: TENANT,
      organizationId: ORG,
      memory: memoryInput({ relevanceScope: ['a', 'b', 'c'] }),
    })
    await service.storeMemory({
      tenantId: TENANT,
      organizationId: ORG,
      memory: memoryInput({ relevanceScope: ['a', 'b'] }), // overlap 2
    })
    await service.storeMemory({
      tenantId: TENANT,
      organizationId: ORG,
      memory: memoryInput({ relevanceScope: ['a'] }), // overlap 1
    })
    await service.storeMemory({
      tenantId: TENANT,
      organizationId: ORG,
      memory: memoryInput({ relevanceScope: ['z'] }), // no overlap
    })
    if (!source.ok) throw new Error('setup failed')

    const result = await service.findRelatedMemories(source.value.id, ORG)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toHaveLength(2)
      expect(result.value[0].relevanceScope).toEqual(['a', 'b'])
      expect(result.value.some((m) => m.id === source.value.id)).toBe(false)
    }
  })

  it('findRelatedMemories fails when the source memory is missing', async () => {
    const result = await service.findRelatedMemories('memory_missing' as BusinessMemoryId, ORG)
    expect(result.ok).toBe(false)
  })

  it('listAllMemories returns every memory for the organization', async () => {
    await service.storeMemory({
      tenantId: TENANT,
      organizationId: ORG,
      memory: memoryInput(),
    })
    await service.storeMemory({
      tenantId: TENANT,
      organizationId: ORG,
      memory: memoryInput({ type: 'brand' }),
    })
    const result = await service.listAllMemories(ORG)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toHaveLength(2)
  })

  it('listMemoriesByWorkforce returns only that workforce’s memories', async () => {
    const wfA = 'wf_a' as WorkforceId
    const wfB = 'wf_b' as WorkforceId
    await service.storeMemory({
      tenantId: TENANT,
      organizationId: ORG,
      memory: memoryInput({ workforceId: wfA }),
    })
    await service.storeMemory({
      tenantId: TENANT,
      organizationId: ORG,
      memory: memoryInput({ workforceId: wfB }),
    })
    const result = await service.listMemoriesByWorkforce(wfA, ORG)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toHaveLength(1)
      expect(result.value[0].workforceId).toBe(wfA)
    }
  })

  it('listAllMemories returns INTERNAL_ERROR when the repository throws', async () => {
    const failing = new BusinessBrainService(throwingRepo)
    const result = await failing.listAllMemories(ORG)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.INTERNAL_ERROR)
  })
})
