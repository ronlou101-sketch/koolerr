import type { DigitalEmployeeId, OrganizationId, TenantId, WorkforceId } from '@/shared/types'
import { InMemoryWorkforceEngineRepository } from './in-memory-repository'
import { WorkforceEngineService } from './service'

export function makeWorkforceEngineService() {
  const repo = new InMemoryWorkforceEngineRepository()
  const service = new WorkforceEngineService(repo)
  return { service, repo }
}

export const TEST_TENANT_ID = 'tenant_test' as TenantId
export const TEST_ORG_ID = 'org_test' as OrganizationId
export const OTHER_ORG_ID = 'org_other' as OrganizationId

export async function seedWorkforce(
  service: WorkforceEngineService,
  organizationId: OrganizationId = TEST_ORG_ID
): Promise<WorkforceId> {
  const result = await service.registerWorkforce({
    tenantId: TEST_TENANT_ID,
    organizationId,
    name: 'Content Team',
    businessFunction: 'Content production',
    digitalEmployees: [],
  })
  if (!result.ok) throw new Error(`seedWorkforce failed: ${result.error.message}`)
  return result.value.id
}

export async function seedDigitalEmployee(
  service: WorkforceEngineService,
  workforceId: WorkforceId,
  organizationId: OrganizationId = TEST_ORG_ID
): Promise<DigitalEmployeeId> {
  const result = await service.registerDigitalEmployee({
    tenantId: TEST_TENANT_ID,
    workforceId,
    organizationId,
    name: 'Writer',
    role: 'Content Writer',
    responsibilities: ['Draft blog posts', 'Review drafts'],
    permittedTools: ['web_search', 'document_editor'],
  })
  if (!result.ok) throw new Error(`seedDigitalEmployee failed: ${result.error.message}`)
  return result.value.id
}
