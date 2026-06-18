import { describe, expect, it } from 'vitest'
import type { BusinessMemoryId, OrganizationId } from '@/shared/types'
import { PlatformErrorCode } from '@/shared/types'
import { PATTERN_INSIGHT_THRESHOLD } from './service'
import {
  OTHER_ORG_ID,
  TEST_ORG_ID,
  TEST_TENANT_ID,
  makeBusinessBrainService,
  makeMemoryInput,
  seedBrain,
  seedMemories,
} from './service.test-helpers'

// ---------------------------------------------------------------------------
// synthesizeInsights()
// ---------------------------------------------------------------------------

describe('synthesizeInsights()', () => {
  it('returns NOT_FOUND when no brain exists for the organization', async () => {
    const { service } = makeBusinessBrainService()
    const result = await service.synthesizeInsights(TEST_ORG_ID)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.NOT_FOUND)
  })

  it('returns an empty insight list and zero total when the brain has no memories', async () => {
    const { service } = makeBusinessBrainService()
    const brainId = await seedBrain(service)
    const result = await service.synthesizeInsights(TEST_ORG_ID)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.insights).toHaveLength(0)
    expect(result.value.trends.totalMemories).toBe(0)
    expect(result.value.trends.mostDocumented).toBeNull()
    expect(result.value.businessBrainId).toBe(brainId)
    expect(result.value.organizationId).toBe(TEST_ORG_ID)
  })

  it(`generates a 'pattern' insight when a type has >= ${PATTERN_INSIGHT_THRESHOLD} memories`, async () => {
    const { service } = makeBusinessBrainService()
    await seedBrain(service)
    await seedMemories(service, 'brand', PATTERN_INSIGHT_THRESHOLD)

    const result = await service.synthesizeInsights(TEST_ORG_ID)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const patternInsights = result.value.insights.filter((i) => i.type === 'pattern')
    expect(patternInsights).toHaveLength(1)
    expect(patternInsights[0].title).toContain('brand')
    expect(patternInsights[0].supportingMemoryIds).toHaveLength(PATTERN_INSIGHT_THRESHOLD)
  })

  it(`does NOT generate a 'pattern' insight when a type has < ${PATTERN_INSIGHT_THRESHOLD} memories`, async () => {
    const { service } = makeBusinessBrainService()
    await seedBrain(service)
    await seedMemories(service, 'brand', PATTERN_INSIGHT_THRESHOLD - 1)

    const result = await service.synthesizeInsights(TEST_ORG_ID)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const patternInsights = result.value.insights.filter((i) => i.type === 'pattern')
    expect(patternInsights).toHaveLength(0)
  })

  it("generates 'gap' insights for memory types with no entries", async () => {
    const { service } = makeBusinessBrainService()
    await seedBrain(service)
    await seedMemories(service, 'brand', 1) // only brand documented

    const result = await service.synthesizeInsights(TEST_ORG_ID)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const gapInsights = result.value.insights.filter((i) => i.type === 'gap')
    // all types except 'brand' are gaps
    expect(gapInsights.length).toBeGreaterThan(0)
    const gapTypes = gapInsights.map((i) => i.title)
    expect(gapTypes.some((t) => t.includes('brand'))).toBe(false)
    expect(gapTypes.some((t) => t.includes('product'))).toBe(true)
  })

  it("does NOT generate a 'gap' insight for a type that has at least one memory", async () => {
    const { service } = makeBusinessBrainService()
    await seedBrain(service)
    await seedMemories(service, 'product', 1)

    const result = await service.synthesizeInsights(TEST_ORG_ID)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const productGap = result.value.insights.find(
      (i) => i.type === 'gap' && i.title.includes('product')
    )
    expect(productGap).toBeUndefined()
  })

  it("generates a 'trend' insight when memories span 3+ relevance scopes", async () => {
    const { service } = makeBusinessBrainService()
    await seedBrain(service)
    // Two memories each with 3+ scopes sharing a common scope
    await service.storeMemory(
      makeMemoryInput({ type: 'knowledge', relevanceScope: ['marketing', 'seo', 'content'] })
    )
    await service.storeMemory(
      makeMemoryInput({ type: 'brand', relevanceScope: ['marketing', 'social', 'content'] })
    )

    const result = await service.synthesizeInsights(TEST_ORG_ID)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const trendInsights = result.value.insights.filter((i) => i.type === 'trend')
    expect(trendInsights).toHaveLength(1)
    expect(trendInsights[0].title).toContain('marketing')
    expect(trendInsights[0].supportingMemoryIds).toHaveLength(2)
  })

  it("does NOT generate a 'trend' insight when no memory spans 3+ scopes", async () => {
    const { service } = makeBusinessBrainService()
    await seedBrain(service)
    await service.storeMemory(makeMemoryInput({ relevanceScope: ['marketing', 'seo'] })) // only 2 scopes

    const result = await service.synthesizeInsights(TEST_ORG_ID)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const trendInsights = result.value.insights.filter((i) => i.type === 'trend')
    expect(trendInsights).toHaveLength(0)
  })

  it('identifies the most documented type correctly', async () => {
    const { service } = makeBusinessBrainService()
    await seedBrain(service)
    await seedMemories(service, 'policy', 4)
    await seedMemories(service, 'brand', 2)

    const result = await service.synthesizeInsights(TEST_ORG_ID)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.value.trends.mostDocumented).toBe('policy')
  })

  it('lists undocumented types accurately', async () => {
    const { service } = makeBusinessBrainService()
    await seedBrain(service)
    await seedMemories(service, 'brand', 1)
    await seedMemories(service, 'product', 1)

    const result = await service.synthesizeInsights(TEST_ORG_ID)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const { undocumentedTypes } = result.value.trends
    expect(undocumentedTypes).not.toContain('brand')
    expect(undocumentedTypes).not.toContain('product')
    expect(undocumentedTypes).toContain('policy')
    expect(undocumentedTypes).toContain('customer')
  })

  it('totals memory count correctly', async () => {
    const { service } = makeBusinessBrainService()
    await seedBrain(service)
    await seedMemories(service, 'brand', 3)
    await seedMemories(service, 'product', 2)

    const result = await service.synthesizeInsights(TEST_ORG_ID)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.value.trends.totalMemories).toBe(5)
    expect(result.value.trends.countsByType['brand']).toBe(3)
    expect(result.value.trends.countsByType['product']).toBe(2)
  })

  it('can surface both pattern and gap insights in the same report', async () => {
    const { service } = makeBusinessBrainService()
    await seedBrain(service)
    await seedMemories(service, 'brand', PATTERN_INSIGHT_THRESHOLD) // generates pattern
    // all other types → generate gap insights

    const result = await service.synthesizeInsights(TEST_ORG_ID)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const patterns = result.value.insights.filter((i) => i.type === 'pattern')
    const gaps = result.value.insights.filter((i) => i.type === 'gap')
    expect(patterns).toHaveLength(1)
    expect(gaps.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// findRelatedMemories()
// ---------------------------------------------------------------------------

describe('findRelatedMemories()', () => {
  it('returns NOT_FOUND when the target memory does not exist', async () => {
    const { service } = makeBusinessBrainService()
    await seedBrain(service)

    const result = await service.findRelatedMemories(
      'memory_nonexistent' as BusinessMemoryId,
      TEST_ORG_ID
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.NOT_FOUND)
  })

  it('returns TENANT_ISOLATION_VIOLATION when the memory belongs to a different org', async () => {
    const { service } = makeBusinessBrainService()
    await seedBrain(service, TEST_ORG_ID)
    await seedBrain(service, OTHER_ORG_ID)

    // Store a memory in the other org
    const memResult = await service.storeMemory(
      makeMemoryInput({ organizationId: OTHER_ORG_ID, relevanceScope: ['marketing'] })
    )
    expect(memResult.ok).toBe(true)
    if (!memResult.ok) return

    // Request it as if we are TEST_ORG_ID
    const result = await service.findRelatedMemories(memResult.value.id, TEST_ORG_ID)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.TENANT_ISOLATION_VIOLATION)
  })

  it('returns an empty array when no other memories share a scope', async () => {
    const { service } = makeBusinessBrainService()
    await seedBrain(service)

    const memResult = await service.storeMemory(
      makeMemoryInput({ relevanceScope: ['unique-scope'] })
    )
    expect(memResult.ok).toBe(true)
    if (!memResult.ok) return

    const result = await service.findRelatedMemories(memResult.value.id, TEST_ORG_ID)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.value).toHaveLength(0)
  })

  it('returns memories sorted by descending scope overlap', async () => {
    const { service } = makeBusinessBrainService()
    await seedBrain(service)

    const targetResult = await service.storeMemory(
      makeMemoryInput({ type: 'brand', relevanceScope: ['seo', 'content', 'marketing'] })
    )
    if (!targetResult.ok) throw new Error('target store failed')
    const targetId = targetResult.value.id

    // high overlap: shares 2 scopes with target
    const highResult = await service.storeMemory(
      makeMemoryInput({ type: 'product', relevanceScope: ['seo', 'content'] })
    )
    // low overlap: shares 1 scope with target
    const lowResult = await service.storeMemory(
      makeMemoryInput({ type: 'knowledge', relevanceScope: ['marketing', 'unrelated'] })
    )

    if (!highResult.ok || !lowResult.ok) throw new Error('store failed')

    const result = await service.findRelatedMemories(targetId, TEST_ORG_ID)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.value).toHaveLength(2)
    expect(result.value[0].id).toBe(highResult.value.id)
    expect(result.value[1].id).toBe(lowResult.value.id)
  })

  it('excludes the target memory from results', async () => {
    const { service } = makeBusinessBrainService()
    await seedBrain(service)

    const memResult = await service.storeMemory(makeMemoryInput({ relevanceScope: ['marketing'] }))
    if (!memResult.ok) throw new Error('store failed')
    const targetId = memResult.value.id

    // another memory sharing the scope
    await service.storeMemory(makeMemoryInput({ type: 'brand', relevanceScope: ['marketing'] }))

    const result = await service.findRelatedMemories(targetId, TEST_ORG_ID)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const ids = result.value.map((m) => m.id)
    expect(ids).not.toContain(targetId)
    expect(ids).toHaveLength(1)
  })

  it('respects the limit parameter', async () => {
    const { service } = makeBusinessBrainService()
    await seedBrain(service)

    const targetResult = await service.storeMemory(
      makeMemoryInput({ relevanceScope: ['marketing'] })
    )
    if (!targetResult.ok) throw new Error('store failed')

    // Store 5 related memories
    for (let i = 0; i < 5; i++) {
      await service.storeMemory(makeMemoryInput({ type: 'brand', relevanceScope: ['marketing'] }))
    }

    const result = await service.findRelatedMemories(targetResult.value.id, TEST_ORG_ID, 3)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.value).toHaveLength(3)
  })

  it('only returns memories from the same organization', async () => {
    const { service } = makeBusinessBrainService()
    await seedBrain(service, TEST_ORG_ID)
    await seedBrain(service, OTHER_ORG_ID)

    const targetResult = await service.storeMemory(
      makeMemoryInput({ organizationId: TEST_ORG_ID, relevanceScope: ['marketing'] })
    )
    if (!targetResult.ok) throw new Error('store failed')

    // Related memory in OTHER org — must not appear in results
    await service.storeMemory(
      makeMemoryInput({ organizationId: OTHER_ORG_ID, relevanceScope: ['marketing'] })
    )

    const result = await service.findRelatedMemories(targetResult.value.id, TEST_ORG_ID)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    // Only memories from TEST_ORG_ID appear; OTHER_ORG_ID memory is excluded
    for (const m of result.value) {
      expect(m.organizationId).toBe(TEST_ORG_ID)
    }
    expect(result.value).toHaveLength(0)
  })
})
