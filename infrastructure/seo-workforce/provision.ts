import { workforceEngineService } from '@/domains/workforce-engine'
import { consentLedger } from '@/shared/consent'
import { trustEngine } from '@/shared/trust'
import { logger } from '@/shared/lib/logger'
import type {
  DigitalEmployeeId,
  OrganizationId,
  TenantId,
  UserId,
  WorkforceId,
} from '@/shared/types'

/**
 * SEO Workforce Provisioning — Architectural Proof of Concept
 *
 * Provisions a two-person SEO Workforce (Researcher + Writer) using ONLY
 * the existing platform primitives established in Phase 1. Zero changes to
 * Trust Engine, Orchestration Engine, Model Gateway, Business Brain, or any
 * domain service are required.
 *
 * This is the Phase 1 exit-criterion proof:
 * "The engineering team can demonstrate that a second Workforce could be
 * registered without touching platform architecture."
 *
 * Architecture used (all Phase 1 primitives, unchanged):
 *   - workforceEngineService (Workforce + DigitalEmployee registration)
 *   - trustEngine (rule registration with consent scope)
 *   - consentLedger (consent grants for SEO actions)
 *
 * See FOUNDATION_003_DEVELOPMENT_ROADMAP.md — Phase 1 Exit Criteria.
 * See docs/adr/ADR-010-second-workforce-proof.md.
 */

export interface SeoWorkforceIds {
  workforceId: WorkforceId
  researcherId: DigitalEmployeeId
  writerId: DigitalEmployeeId
}

export const SEO_WORKFORCE_ROLES = {
  researcher: 'SEO Researcher',
  writer: 'SEO Writer',
} as const

export const SEO_WORKFORCE_ACTIONS = {
  researcher: 'seo_keyword_research',
  writer: 'write_seo_article',
} as const

/**
 * Provision the SEO Workforce for an Organization.
 * Creates Workforce + 2 Digital Employees + Trust Engine rules + consent grants.
 */
export async function provisionSeoWorkforce(
  organizationId: OrganizationId,
  tenantId: TenantId,
  grantedBy: UserId
): Promise<SeoWorkforceIds> {
  const workforceResult = await workforceEngineService.registerWorkforce({
    tenantId,
    organizationId,
    name: 'SEO Workforce',
    businessFunction: 'SEO Content',
    digitalEmployees: [],
  })
  if (!workforceResult.ok) {
    throw new Error(
      `[SEO_WORKFORCE] Failed to register workforce: ${workforceResult.error.message}`
    )
  }
  const workforceId = workforceResult.value.id

  const researcherResult = await workforceEngineService.registerDigitalEmployee({
    tenantId,
    workforceId,
    organizationId,
    name: 'Zara',
    role: SEO_WORKFORCE_ROLES.researcher,
    responsibilities: [
      'Research target keywords and search intent',
      'Analyze competitor content and identify content gaps',
      'Produce an SEO brief with keyword targets and structure',
    ],
    permittedTools: ['business_brain_read'],
  })
  if (!researcherResult.ok) {
    throw new Error(
      `[SEO_WORKFORCE] Failed to register researcher: ${researcherResult.error.message}`
    )
  }
  const researcherId = researcherResult.value.id

  const writerResult = await workforceEngineService.registerDigitalEmployee({
    tenantId,
    workforceId,
    organizationId,
    name: 'Leo',
    role: SEO_WORKFORCE_ROLES.writer,
    responsibilities: [
      'Write SEO-optimized articles based on the keyword brief',
      'Structure content with appropriate headings for search ranking',
      'Ensure content satisfies search intent and brand voice',
    ],
    permittedTools: ['business_brain_read', 'write_content'],
  })
  if (!writerResult.ok) {
    throw new Error(`[SEO_WORKFORCE] Failed to register writer: ${writerResult.error.message}`)
  }
  const writerId = writerResult.value.id

  registerSeoTrustRules(organizationId, researcherId, writerId)

  const seoActions = [SEO_WORKFORCE_ACTIONS.researcher, SEO_WORKFORCE_ACTIONS.writer]
  for (const action of seoActions) {
    await consentLedger.grant({
      tenantId,
      organizationId,
      grantedBy,
      scope: 'content_creation',
      action,
    })
  }

  logger.info('[SEO_WORKFORCE] Provisioned SEO workforce', { organizationId, workforceId })

  return { workforceId, researcherId, writerId }
}

/**
 * Register Trust Engine rules for the SEO Workforce employees.
 * Safe to call multiple times — idempotent via action deduplication.
 */
export function registerSeoTrustRules(
  organizationId: OrganizationId,
  researcherId: DigitalEmployeeId,
  writerId: DigitalEmployeeId
): void {
  const register = (employeeId: DigitalEmployeeId, action: string) => {
    const existing = trustEngine.rulesFor(employeeId)
    if (existing.some((r) => r.action === action)) return
    trustEngine.registerRule({
      id: `rule_${action}_${employeeId}`,
      organizationId,
      digitalEmployeeId: employeeId,
      action,
      requiresApproval: false,
      autonomyLevel: 'supervised',
      requiredConsentScope: 'content_creation',
    })
  }

  register(researcherId, SEO_WORKFORCE_ACTIONS.researcher)
  register(writerId, SEO_WORKFORCE_ACTIONS.writer)
}
