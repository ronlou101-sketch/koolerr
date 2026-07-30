import { describe, it, expect } from 'vitest'
import type { DigitalEmployeeId, OrganizationId, TenantId } from '@/shared/types'
import { businessBrainService } from '@/domains/business-brain'
import { brandAmbassadorService } from './service'
import { pickDefaultAmbassador } from './library'

const tenantId = 'tenant_test' as TenantId

/** Each test uses a unique org id to isolate the shared in-memory Business Brain. */
function newOrg(suffix: string): OrganizationId {
  return `org_ba_${suffix}` as OrganizationId
}

async function seedBrain(organizationId: OrganizationId) {
  await businessBrainService.createBusinessBrain({ tenantId, organizationId })
}

describe('BrandAmbassadorService', () => {
  it('resolves null before any ambassador is assigned', async () => {
    const organizationId = newOrg('empty')
    await seedBrain(organizationId)
    const result = await brandAmbassadorService.resolveBrandAmbassador(organizationId)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toBeNull()
  })

  it('assigns a deterministic default ambassador and persists a provider-agnostic identity', async () => {
    const organizationId = newOrg('assign')
    await seedBrain(organizationId)
    const employeeId = 'emp_ambassador_1' as DigitalEmployeeId

    const assigned = await brandAmbassadorService.assignDefaultBrandAmbassador({
      tenantId,
      organizationId,
      ambassadorEmployeeId: employeeId,
    })
    expect(assigned.ok).toBe(true)
    if (!assigned.ok) return

    const expectedEntry = pickDefaultAmbassador(organizationId)
    expect(assigned.value.libraryId).toBe(expectedEntry.id)
    expect(assigned.value.displayName).toBe(expectedEntry.displayName)
    expect(assigned.value.role).toBe('Brand Ambassador')
    expect(assigned.value.ambassadorEmployeeId).toBe(employeeId)
    expect(assigned.value.source).toBe('auto-assigned')
    expect(assigned.value.seed).toBe(expectedEntry.seed)
    // Provider-agnostic: no provider ids invented at assignment time.
    expect(assigned.value.providerRefs).toEqual({})
    expect(assigned.value.appearance.referenceImageUrls).toEqual([])
  })

  it('round-trips: the assigned identity is what resolveBrandAmbassador returns', async () => {
    const organizationId = newOrg('roundtrip')
    await seedBrain(organizationId)
    const employeeId = 'emp_ambassador_2' as DigitalEmployeeId

    const assigned = await brandAmbassadorService.assignDefaultBrandAmbassador({
      tenantId,
      organizationId,
      ambassadorEmployeeId: employeeId,
    })
    const resolved = await brandAmbassadorService.resolveBrandAmbassador(organizationId)
    expect(assigned.ok && resolved.ok).toBe(true)
    if (assigned.ok && resolved.ok) {
      expect(resolved.value?.libraryId).toBe(assigned.value.libraryId)
      expect(resolved.value?.ambassadorEmployeeId).toBe(employeeId)
    }
  })

  it('is idempotent: a second assignment returns the same identity, not a new one', async () => {
    const organizationId = newOrg('idempotent')
    await seedBrain(organizationId)

    const first = await brandAmbassadorService.assignDefaultBrandAmbassador({
      tenantId,
      organizationId,
      ambassadorEmployeeId: 'emp_first' as DigitalEmployeeId,
    })
    const second = await brandAmbassadorService.assignDefaultBrandAmbassador({
      tenantId,
      organizationId,
      ambassadorEmployeeId: 'emp_second' as DigitalEmployeeId,
    })
    expect(first.ok && second.ok).toBe(true)
    if (first.ok && second.ok) {
      // Same identity is returned — the original employee binding is preserved.
      expect(second.value.ambassadorEmployeeId).toBe('emp_first')
      expect(second.value.libraryId).toBe(first.value.libraryId)
    }
  })
})
