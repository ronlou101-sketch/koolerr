import { describe, it, expect } from 'vitest'
import type { OrganizationId, TenantId } from '@/shared/types'
// Import order matters: the Brand Ambassador singleton is loaded BEFORE the
// Business Brain is reconfigured, mirroring production module load → bootstrap.
import { brandAmbassadorService, BrandAmbassadorService } from './service'
import {
  BusinessBrainService,
  _configureBusinessBrainRepository,
  businessBrainService,
} from '@/domains/business-brain'
import { InMemoryBusinessBrainRepository } from '@/domains/business-brain/in-memory-repository'

const tenantId = 'tenant_live_brain' as TenantId

/**
 * Regression: signup failed with
 * "[BRAND_AMBASSADOR] Failed to provision Brand Ambassador identity: Business Brain not found"
 * because the singleton captured the pre-bootstrap Business Brain service at module load.
 * bootstrapPlatform() reconfigures the Business Brain (the swap below), and provisioning
 * then creates the Brain through the live exported service.
 */
describe('BrandAmbassadorService — live Business Brain service binding', () => {
  it('singleton uses the reconfigured (live) Business Brain service, not the module-load instance', async () => {
    // Same swap bootstrapPlatform() performs (infrastructure/platform/bootstrap.ts).
    _configureBusinessBrainRepository(new InMemoryBusinessBrainRepository())

    const organizationId = 'org_live_brain_singleton' as OrganizationId
    const created = await businessBrainService.createBusinessBrain({ tenantId, organizationId })
    expect(created.ok).toBe(true)

    const assigned = await brandAmbassadorService.assignDefaultBrandAmbassador({
      tenantId,
      organizationId,
    })
    expect(assigned.ok).toBe(true)

    const resolved = await brandAmbassadorService.resolveBrandAmbassador(organizationId)
    expect(resolved.ok).toBe(true)
    if (assigned.ok && resolved.ok) {
      expect(resolved.value?.ambassadorId).toBe(assigned.value.ambassadorId)
    }
  })

  it('an explicitly injected Business Brain service takes precedence over the live binding', async () => {
    const injected = new BusinessBrainService(new InMemoryBusinessBrainRepository())
    const service = new BrandAmbassadorService(injected)

    const organizationId = 'org_live_brain_injected' as OrganizationId
    // Brain exists ONLY in the injected service, not in the live exported one.
    expect((await injected.createBusinessBrain({ tenantId, organizationId })).ok).toBe(true)

    const assigned = await service.assignDefaultBrandAmbassador({ tenantId, organizationId })
    expect(assigned.ok).toBe(true)

    const viaInjected = await injected.queryMemory({ organizationId, types: ['visual_identity'] })
    expect(viaInjected.ok && viaInjected.value.memories.length).toBe(1)
    expect((await businessBrainService.getBusinessBrain(organizationId)).ok).toBe(false)
  })
})
