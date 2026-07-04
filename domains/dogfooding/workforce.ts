import { trustEngine } from '@/shared/trust'
import { workforceEngineService } from '@/domains/workforce-engine'
import { logger } from '@/shared/lib/logger'
import type {
  DigitalEmployeeId,
  OrganizationId,
  TenantId,
  TrustRule,
  WorkforceId,
} from '@/shared/types'

const INTERNAL_MARKETING_FUNCTION = 'Internal Marketing'

export const MARKETING_AGENTS = [
  {
    id: 'marketing-cmo' as DigitalEmployeeId,
    name: 'Marketing CMO',
    role: 'Chief Marketing Officer',
    responsibilities: [
      'Define marketing strategy and KPIs',
      'Produce comprehensive marketing plans',
      'Align campaigns to business objectives',
      'Review and approve all marketing outputs',
    ],
    action: 'create_marketing_plan',
  },
  {
    id: 'marketing-researcher' as DigitalEmployeeId,
    name: 'Marketing Researcher',
    role: 'Market Research Analyst',
    responsibilities: [
      'Research ICP and buyer personas',
      'Competitive intelligence gathering',
      'Market sizing and opportunity analysis',
      'Trend and signal identification',
    ],
    action: 'market_research',
  },
  {
    id: 'marketing-strategist' as DigitalEmployeeId,
    name: 'Marketing Strategist',
    role: 'Campaign Strategist',
    responsibilities: [
      'Translate research into campaign strategy',
      'Define campaign objectives and targeting',
      'Develop channel and budget allocation',
      'Produce campaign briefs for execution teams',
    ],
    action: 'create_campaign_strategy',
  },
  {
    id: 'marketing-copywriter' as DigitalEmployeeId,
    name: 'Marketing Copywriter',
    role: 'Direct Response Copywriter',
    responsibilities: [
      'Write ad headlines and primary text',
      'Create multiple copy variants per campaign',
      'Apply brand voice and messaging pillars',
      'Optimize copy for conversion',
    ],
    action: 'write_ad_copy',
  },
  {
    id: 'marketing-creative-director' as DigitalEmployeeId,
    name: 'Marketing Creative Director',
    role: 'Creative Director',
    responsibilities: [
      'Design visual creative strategy',
      'Write Higgsfield image generation prompts',
      'Direct campaign visual identity',
      'Produce creative briefs for video and image assets',
    ],
    action: 'create_creative_direction',
  },
  {
    id: 'marketing-media-buyer' as DigitalEmployeeId,
    name: 'Marketing Media Buyer',
    role: 'Paid Media Specialist',
    responsibilities: [
      'Plan and structure Meta ad campaigns',
      'Define audience targeting and ad sets',
      'Configure bid strategies and budgets',
      'Execute campaigns via Meta API (Phase 2)',
    ],
    action: 'plan_media_buy',
  },
  {
    id: 'marketing-analyst' as DigitalEmployeeId,
    name: 'Marketing Analyst',
    role: 'Performance Analytics Specialist',
    responsibilities: [
      'Analyse campaign performance metrics',
      'Extract actionable learnings from data',
      'Produce performance reports',
      'Surface optimization opportunities',
    ],
    action: 'analyse_performance',
  },
  {
    id: 'marketing-optimizer' as DigitalEmployeeId,
    name: 'Marketing Optimizer',
    role: 'Campaign Optimization Specialist',
    responsibilities: [
      'Apply learnings to improve active campaigns',
      'Run creative and copy A/B experiments',
      'Adjust targeting based on performance signals',
      'Drive continuous improvement cycles',
    ],
    action: 'optimize_campaign',
  },
] as const

const registeredOrgs = new Set<OrganizationId>()

export function ensureMarketingTrustRules(organizationId: OrganizationId): void {
  if (registeredOrgs.has(organizationId)) return
  for (const agent of MARKETING_AGENTS) {
    const rule: TrustRule = {
      id: `dogfooding-${agent.id}-${agent.action}-${organizationId}`,
      organizationId,
      digitalEmployeeId: agent.id,
      action: agent.action,
      requiresApproval: false,
      autonomyLevel: 'autonomous',
    }
    trustEngine.registerRule(rule)
  }
  registeredOrgs.add(organizationId)
  logger.info('[DOGFOODING] Trust rules registered for Internal Marketing agents', {
    organizationId,
  })
}

export async function findOrCreateInternalMarketingWorkforce(ctx: {
  tenantId: TenantId
  organizationId: OrganizationId
}): Promise<{ workforceId: WorkforceId }> {
  const listResult = await workforceEngineService.listWorkforces(ctx.organizationId)
  if (listResult.ok) {
    const existing = listResult.value.find(
      (w) => w.businessFunction === INTERNAL_MARKETING_FUNCTION
    )
    if (existing) {
      return { workforceId: existing.id }
    }
  }

  const regResult = await workforceEngineService.registerWorkforce({
    tenantId: ctx.tenantId,
    organizationId: ctx.organizationId,
    name: 'Internal Marketing Department',
    businessFunction: INTERNAL_MARKETING_FUNCTION,
    digitalEmployees: MARKETING_AGENTS.map((a) => ({
      name: a.name,
      role: a.role,
      responsibilities: [...a.responsibilities],
      permittedTools: ['model-gateway', 'business-brain'],
    })),
  })

  if (!regResult.ok) {
    throw new Error(
      `[DOGFOODING] Failed to create Internal Marketing Workforce: ${regResult.error.message}`
    )
  }

  logger.info('[DOGFOODING] Internal Marketing Workforce created', {
    workforceId: regResult.value.id,
    organizationId: ctx.organizationId,
  })

  return { workforceId: regResult.value.id }
}
