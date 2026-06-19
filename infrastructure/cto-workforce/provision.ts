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
 * CTO Workforce Provisioning
 *
 * Creates the CTO Workforce and its single Digital Employee, Atlas, for an
 * Organization. Atlas is the CTO Agent — the engineering orchestrator that
 * understands the full repository, generates implementation plans, reviews
 * completed work, and identifies V1 launch blockers.
 *
 * Atlas operates under the Trust Engine with requiresApproval: false for
 * planning and review actions. Atlas never modifies production code or
 * bypasses platform architecture without explicit authorization.
 *
 * Called during account provisioning so every Organization gets a CTO Workforce
 * at sign-up. The context-seeder loads Business Brain context separately.
 *
 * See docs/adr/ADR-018-cto-agent-workforce.md
 * See FOUNDATION_001_ARCHITECTURE.md §2.6, §2.7, §2.10.
 */

export interface CTOWorkforceIds {
  workforceId: WorkforceId
  atlasId: DigitalEmployeeId
}

export const CTO_WORKFORCE_ROLES = {
  atlas: 'CTO Agent',
} as const

export const CTO_WORKFORCE_ACTIONS = {
  plan: 'cto:generate_implementation_plan',
  review: 'cto:review_code_and_architecture',
  milestone: 'cto:generate_milestone_report',
  blockers: 'cto:identify_launch_blockers',
} as const

export const CTO_BUSINESS_FUNCTION = 'Engineering Intelligence'

/**
 * Provision the CTO Workforce for an Organization.
 * Creates the Workforce + Atlas Digital Employee + Trust Engine rules + consent grants.
 */
export async function provisionCTOWorkforce(
  organizationId: OrganizationId,
  tenantId: TenantId,
  grantedBy: UserId
): Promise<CTOWorkforceIds> {
  const workforceResult = await workforceEngineService.registerWorkforce({
    tenantId,
    organizationId,
    name: 'CTO Workforce',
    businessFunction: CTO_BUSINESS_FUNCTION,
    digitalEmployees: [],
  })
  if (!workforceResult.ok) {
    throw new Error(
      `[CTO_WORKFORCE] Failed to register workforce: ${workforceResult.error.message}`
    )
  }
  const workforceId = workforceResult.value.id

  const atlasResult = await workforceEngineService.registerDigitalEmployee({
    tenantId,
    workforceId,
    organizationId,
    name: 'Atlas',
    role: CTO_WORKFORCE_ROLES.atlas,
    responsibilities: [
      'Understand the complete repository, architecture, and roadmap',
      'Generate precise, actionable implementation plans for milestones',
      'Review code and architecture against Foundation decisions and ADRs',
      'Track milestone completion and V1 launch progress',
      'Identify and rank V1 launch blockers with proposed resolutions',
      'Coordinate work across Workforces by generating platform-specific task briefs',
    ],
    permittedTools: [
      'business_brain_read',
      'business_brain_write',
      'repository_read',
      'git_history_read',
    ],
  })
  if (!atlasResult.ok) {
    throw new Error(`[CTO_WORKFORCE] Failed to register Atlas: ${atlasResult.error.message}`)
  }
  const atlasId = atlasResult.value.id

  registerCTOTrustRules(organizationId, atlasId)

  for (const action of Object.values(CTO_WORKFORCE_ACTIONS)) {
    await consentLedger.grant({
      tenantId,
      organizationId,
      grantedBy,
      scope: 'engineering_intelligence',
      action,
    })
  }

  logger.info('[CTO_WORKFORCE] Provisioned CTO Workforce — Atlas online', {
    organizationId,
    workforceId,
    atlasId,
  })

  return { workforceId, atlasId }
}

/**
 * Register Trust Engine rules for Atlas.
 * All CTO planning and review actions are permitted without approval —
 * Atlas reads and recommends; it never executes production changes autonomously.
 * Safe to call multiple times (idempotent via action deduplication).
 */
export function registerCTOTrustRules(
  organizationId: OrganizationId,
  atlasId: DigitalEmployeeId
): void {
  const register = (action: string) => {
    const existing = trustEngine.rulesFor(atlasId)
    if (existing.some((r) => r.action === action)) return
    trustEngine.registerRule({
      id: `rule_${action}_${atlasId}`,
      organizationId,
      digitalEmployeeId: atlasId,
      action,
      requiresApproval: false,
      autonomyLevel: 'supervised',
      requiredConsentScope: 'engineering_intelligence',
    })
  }

  for (const action of Object.values(CTO_WORKFORCE_ACTIONS)) {
    register(action)
  }
}
