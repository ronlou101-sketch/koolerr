import type {
  BusinessBrainId,
  BusinessMemoryId,
  BusinessMemoryType,
  DigitalEmployeeId,
  EngagementRunId,
  OrganizationId,
  TenantId,
} from '@/shared/types'
import { InMemoryBusinessBrainRepository } from './in-memory-repository'
import { BusinessBrainService } from './service'

export function makeBusinessBrainService() {
  const repo = new InMemoryBusinessBrainRepository()
  const service = new BusinessBrainService(repo)
  return { service, repo }
}

// ---------------------------------------------------------------------------
// Fixture factories
// ---------------------------------------------------------------------------

export const TEST_TENANT_ID = 'tenant_test' as TenantId
export const TEST_ORG_ID = 'org_test' as OrganizationId
export const OTHER_ORG_ID = 'org_other' as OrganizationId

export function makeMemoryInput(
  overrides: Partial<{
    type: BusinessMemoryType
    content: Record<string, unknown>
    source: string
    relevanceScope: string[]
    organizationId: OrganizationId
  }> = {}
) {
  return {
    tenantId: TEST_TENANT_ID,
    organizationId: overrides.organizationId ?? TEST_ORG_ID,
    memory: {
      type: (overrides.type ?? 'knowledge') as BusinessMemoryType,
      content: overrides.content ?? { text: 'test knowledge' },
      source: overrides.source ?? 'test',
      relevanceScope: overrides.relevanceScope ?? ['general'],
      organizationId: overrides.organizationId ?? TEST_ORG_ID,
    },
  }
}

/** Create a brain and return its ID — convenience for test setup. */
export async function seedBrain(
  service: BusinessBrainService,
  organizationId: OrganizationId = TEST_ORG_ID
): Promise<BusinessBrainId> {
  const result = await service.createBusinessBrain({ tenantId: TEST_TENANT_ID, organizationId })
  if (!result.ok) throw new Error(`seedBrain failed: ${result.error.message}`)
  return result.value.id
}

/** Store N memories of a given type and return their IDs. */
export async function seedMemories(
  service: BusinessBrainService,
  type: BusinessMemoryType,
  count: number,
  relevanceScope?: string[],
  organizationId: OrganizationId = TEST_ORG_ID
): Promise<BusinessMemoryId[]> {
  const ids: BusinessMemoryId[] = []
  for (let i = 0; i < count; i++) {
    const result = await service.storeMemory(
      makeMemoryInput({ type, relevanceScope: relevanceScope ?? ['general'], organizationId })
    )
    if (!result.ok) throw new Error(`seedMemories failed: ${result.error.message}`)
    ids.push(result.value.id)
  }
  return ids
}
