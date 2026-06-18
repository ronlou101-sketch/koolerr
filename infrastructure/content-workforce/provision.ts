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
 * Content Workforce Provisioning
 *
 * Creates the Content Workforce (strategist, copywriter, editor) for an
 * Organization and registers Trust Engine rules for each Digital Employee.
 *
 * Called during account provisioning so every new Organization gets a
 * ready-to-run Content Workforce. Also called by the executor on each run
 * to re-register trust rules that may have been lost on server restart
 * (the in-memory Trust Engine does not survive process restarts).
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.6, §2.7, §2.10.
 */

export interface ContentWorkforceIds {
  workforceId: WorkforceId
  strategistId: DigitalEmployeeId
  copywriterId: DigitalEmployeeId
  editorId: DigitalEmployeeId
}

/** Role names used to identify employees when re-registering trust rules. */
export const CONTENT_WORKFORCE_ROLES = {
  strategist: 'Content Strategist',
  copywriter: 'Copywriter',
  editor: 'Editor',
} as const

/** Actions each role is permitted to perform. */
export const CONTENT_WORKFORCE_ACTIONS = {
  strategist: 'research_topic',
  copywriter: 'write_blog_post',
  editor: 'review_content',
} as const

/**
 * Provision the Content Workforce for a new Organization.
 * Creates Workforce + 3 Digital Employees + registers Trust Engine rules
 * + grants consent for all 3 content actions on behalf of the owner.
 */
export async function provisionContentWorkforce(
  organizationId: OrganizationId,
  tenantId: TenantId,
  grantedBy: UserId
): Promise<ContentWorkforceIds> {
  // 1. Create the Workforce (no inline employees — we register them individually
  //    so we can capture the generated IDs for Trust Engine rule registration).
  const workforceResult = await workforceEngineService.registerWorkforce({
    tenantId,
    organizationId,
    name: 'Content Workforce',
    businessFunction: 'Content Marketing',
    digitalEmployees: [],
  })
  if (!workforceResult.ok) {
    throw new Error(
      `[CONTENT_WORKFORCE] Failed to register workforce: ${workforceResult.error.message}`
    )
  }
  const workforceId = workforceResult.value.id

  // 2. Register Digital Employees and capture their IDs.
  const strategistResult = await workforceEngineService.registerDigitalEmployee({
    tenantId,
    workforceId,
    organizationId,
    name: 'Alex',
    role: CONTENT_WORKFORCE_ROLES.strategist,
    responsibilities: [
      'Research topics and identify audience insights',
      'Plan content structure and key messages',
      'Produce a detailed content brief for the copywriter',
    ],
    permittedTools: ['business_brain_read'],
  })
  if (!strategistResult.ok) {
    throw new Error(
      `[CONTENT_WORKFORCE] Failed to register strategist: ${strategistResult.error.message}`
    )
  }
  const strategistId = strategistResult.value.id

  const copywriterResult = await workforceEngineService.registerDigitalEmployee({
    tenantId,
    workforceId,
    organizationId,
    name: 'Jordan',
    role: CONTENT_WORKFORCE_ROLES.copywriter,
    responsibilities: [
      'Write compelling, audience-focused content',
      'Apply brand voice and messaging guidelines',
      'Follow the content brief provided by the strategist',
    ],
    permittedTools: ['business_brain_read', 'write_content'],
  })
  if (!copywriterResult.ok) {
    throw new Error(
      `[CONTENT_WORKFORCE] Failed to register copywriter: ${copywriterResult.error.message}`
    )
  }
  const copywriterId = copywriterResult.value.id

  const editorResult = await workforceEngineService.registerDigitalEmployee({
    tenantId,
    workforceId,
    organizationId,
    name: 'Sam',
    role: CONTENT_WORKFORCE_ROLES.editor,
    responsibilities: [
      'Review content for quality, clarity, and brand consistency',
      'Polish the draft into a final publishable output',
      'Ensure the content achieves the stated objective',
    ],
    permittedTools: ['business_brain_read', 'review_content'],
  })
  if (!editorResult.ok) {
    throw new Error(`[CONTENT_WORKFORCE] Failed to register editor: ${editorResult.error.message}`)
  }
  const editorId = editorResult.value.id

  // 3. Register Trust Engine rules for each Digital Employee.
  //    Rules include requiredConsentScope so the Trust Engine enforces
  //    that active consent exists before every content action.
  registerContentTrustRules(organizationId, strategistId, copywriterId, editorId)

  // 4. Grant consent for all 3 content actions on behalf of the owner.
  //    This represents the customer's acceptance of the Terms of Service during
  //    account creation and activates the Consent & Rights Ledger for content work.
  const contentActions = [
    CONTENT_WORKFORCE_ACTIONS.strategist,
    CONTENT_WORKFORCE_ACTIONS.copywriter,
    CONTENT_WORKFORCE_ACTIONS.editor,
  ]
  for (const action of contentActions) {
    await consentLedger.grant({
      tenantId,
      organizationId,
      grantedBy,
      scope: 'content_creation',
      action,
    })
  }

  logger.info('[CONTENT_WORKFORCE] Provisioned content workforce', {
    organizationId,
    workforceId,
  })

  return { workforceId, strategistId, copywriterId, editorId }
}

/**
 * Register (or re-register) Trust Engine rules for the 3 Content Workforce roles.
 * Safe to call multiple times — uses rulesFor() to skip already-registered actions.
 */
export function registerContentTrustRules(
  organizationId: OrganizationId,
  strategistId: DigitalEmployeeId,
  copywriterId: DigitalEmployeeId,
  editorId: DigitalEmployeeId
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

  register(strategistId, CONTENT_WORKFORCE_ACTIONS.strategist)
  register(copywriterId, CONTENT_WORKFORCE_ACTIONS.copywriter)
  register(editorId, CONTENT_WORKFORCE_ACTIONS.editor)
}
