import { workforceEngineService } from '@/domains/workforce-engine'
import { brandAmbassadorService, pickDefaultAmbassador } from '@/domains/brand-ambassador'
import { logger } from '@/shared/lib/logger'
import type {
  DigitalEmployeeId,
  OrganizationId,
  TenantId,
  UserId,
  WorkforceId,
} from '@/shared/types'

/**
 * Brand Ambassador Provisioning
 *
 * Every organization gets a persistent Brand Ambassador — a first-class Digital
 * Employee that represents the company itself (across marketing, sales, support,
 * onboarding, and future conversational experiences). It is provisioned ALONGSIDE
 * the Digital Workforce but is NOT part of the Content Workforce or any single
 * department, so it is hosted in its own dedicated "Brand" workforce.
 *
 * The employee's provider-agnostic identity (persona, appearance, voice, brand
 * assets, provider references) lives in the Business Brain as a `visual_identity`
 * memory — never on the employee row, never coupled to a render provider.
 *
 * Idempotent: safe to call more than once (reuses an existing Brand workforce and
 * never creates a second identity).
 *
 * See docs/adr/ADR-024-brand-ambassador.md.
 */

export const BRAND_AMBASSADOR_BUSINESS_FUNCTION = 'Brand Representation'
export const BRAND_AMBASSADOR_ROLE = 'Brand Ambassador'
export const BRAND_WORKFORCE_NAME = 'Brand'

export interface BrandAmbassadorIds {
  workforceId: WorkforceId
  ambassadorEmployeeId: DigitalEmployeeId
}

/** Responsibilities for the Brand Ambassador Digital Employee. */
const AMBASSADOR_RESPONSIBILITIES = [
  'Represent the organization as its recognizable spokesperson across every channel',
  'Present a consistent face and voice in videos and images across all campaigns',
  'Carry the brand identity into marketing, sales, support, and onboarding content',
]

export async function provisionBrandAmbassador(
  organizationId: OrganizationId,
  tenantId: TenantId,
  _grantedBy: UserId
): Promise<BrandAmbassadorIds> {
  // 1. Reuse the dedicated Brand workforce if it already exists, else create it.
  const workforcesResult = await workforceEngineService.listWorkforces(organizationId)
  const existingBrandWorkforce = workforcesResult.ok
    ? workforcesResult.value.find((w) => w.businessFunction === BRAND_AMBASSADOR_BUSINESS_FUNCTION)
    : undefined

  let workforceId: WorkforceId
  if (existingBrandWorkforce) {
    workforceId = existingBrandWorkforce.id
  } else {
    const created = await workforceEngineService.registerWorkforce({
      tenantId,
      organizationId,
      name: BRAND_WORKFORCE_NAME,
      businessFunction: BRAND_AMBASSADOR_BUSINESS_FUNCTION,
      digitalEmployees: [],
    })
    if (!created.ok) {
      throw new Error(
        `[BRAND_AMBASSADOR] Failed to register Brand workforce: ${created.error.message}`
      )
    }
    workforceId = created.value.id
  }

  // 2. If an identity already exists, reuse its employee binding (idempotent).
  const existingIdentity = await brandAmbassadorService.resolveBrandAmbassador(organizationId)
  if (existingIdentity.ok && existingIdentity.value) {
    return { workforceId, ambassadorEmployeeId: existingIdentity.value.ambassadorEmployeeId }
  }

  // 3. Register the Brand Ambassador Digital Employee (name from the deterministic
  //    default library entry, so the employee and its stored identity agree).
  const entry = pickDefaultAmbassador(organizationId)
  const employeeResult = await workforceEngineService.registerDigitalEmployee({
    tenantId,
    workforceId,
    organizationId,
    name: entry.displayName,
    role: BRAND_AMBASSADOR_ROLE,
    responsibilities: AMBASSADOR_RESPONSIBILITIES,
    permittedTools: ['business_brain_read'],
  })
  if (!employeeResult.ok) {
    throw new Error(
      `[BRAND_AMBASSADOR] Failed to register Brand Ambassador employee: ${employeeResult.error.message}`
    )
  }
  const ambassadorEmployeeId = employeeResult.value.id

  // 4. Store the provider-agnostic identity in the Business Brain, bound to the employee.
  const assigned = await brandAmbassadorService.assignDefaultBrandAmbassador({
    tenantId,
    organizationId,
    ambassadorEmployeeId,
  })
  if (!assigned.ok) {
    throw new Error(
      `[BRAND_AMBASSADOR] Failed to store Brand Ambassador identity: ${assigned.error.message}`
    )
  }

  logger.info('[BRAND_AMBASSADOR] Provisioned Brand Ambassador', {
    organizationId,
    workforceId,
    ambassadorEmployeeId,
    libraryId: entry.id,
  })

  return { workforceId, ambassadorEmployeeId }
}
