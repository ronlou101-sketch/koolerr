import { businessBrainService } from '@/domains/business-brain'
import { billingService, ENTITLEMENT_FEATURES } from '@/domains/billing'
import { deliverablesService } from '@/domains/deliverables'
import { workforceEngineService } from '@/domains/workforce-engine'
import { orchestrationEngine } from '@/shared/orchestration'
import { modelGateway } from '@/shared/model-gateway'
import { logger } from '@/shared/lib/logger'
import { PlatformErrorCode } from '@/shared/types'
import type { PlatformContext } from '@/shared/context'
import type { DeliverableId, EngagementRunId, WorkflowStepId, WorkforceId } from '@/shared/types'
import type { Workflow } from '@/shared/orchestration/types'
import { SEO_WORKFORCE_ACTIONS, SEO_WORKFORCE_ROLES } from './provision'

/**
 * SEO Engagement Run Executor — Architectural Proof of Concept
 *
 * Orchestrates a two-step SEO content workflow (research → write) using ONLY
 * existing Phase 1 platform primitives. No changes to any platform service
 * were required to build this second executor.
 *
 * Primitives used (all unchanged from Phase 1):
 *   - billingService.checkEntitlement / recordUsageEvent
 *   - workforceEngineService.listDigitalEmployees / triggerEngagementRun / updateEngagementRunStatus
 *   - businessBrainService.queryMemory / contributeMemories
 *   - orchestrationEngine.createWorkflow / executeWorkflow / getWorkflow / reportStepCompletion
 *   - modelGateway.invoke (Trust Engine check is implicit via gateway)
 *   - deliverablesService.storeDeliverable / submitForReview
 *
 * See docs/adr/ADR-010-second-workforce-proof.md.
 */

export interface SeoRunResult {
  engagementRunId: EngagementRunId
  deliverableId: DeliverableId
}

const RESEARCH_STEP = 'seo_research' as WorkflowStepId
const WRITE_STEP = 'seo_write' as WorkflowStepId
const MAX_ITERATIONS = 10

function readySteps(workflow: Workflow) {
  const completedIds = new Set(
    workflow.steps.filter((s) => s.status === 'completed').map((s) => s.id)
  )
  return workflow.steps.filter((s) => {
    if (s.status !== 'pending') return false
    return (s.dependsOn ?? []).every((dep) => completedIds.has(dep))
  })
}

export async function executeSeoEngagementRun(
  ctx: PlatformContext,
  workforceId: WorkforceId,
  objective: string
): Promise<SeoRunResult> {
  const { tenantId, organizationId } = ctx

  // Check entitlement — reuses the same billing gate as Content Workforce.
  const entitlementResult = await billingService.checkEntitlement({
    organizationId,
    feature: ENTITLEMENT_FEATURES.engagementRun,
    quantityRequested: 1,
  })
  if (entitlementResult.ok) {
    const { limit, used } = entitlementResult.value
    if (limit !== Infinity && used >= limit) {
      throw Object.assign(
        new Error(`[SEO_EXECUTOR] Engagement run limit reached (${used}/${limit}).`),
        { code: PlatformErrorCode.BILLING_ERROR }
      )
    }
  }

  const employeesResult = await workforceEngineService.listDigitalEmployees(
    workforceId,
    organizationId
  )
  if (!employeesResult.ok) {
    throw new Error(`[SEO_EXECUTOR] Failed to load employees: ${employeesResult.error.message}`)
  }
  const employees = employeesResult.value

  const researcher = employees.find((e) => e.role === SEO_WORKFORCE_ROLES.researcher)
  const writer = employees.find((e) => e.role === SEO_WORKFORCE_ROLES.writer)

  if (!researcher || !writer) {
    throw new Error(
      '[SEO_EXECUTOR] SEO Workforce is missing required Digital Employees ' +
        `(researcher=${!!researcher}, writer=${!!writer})`
    )
  }

  const brainResult = await businessBrainService.queryMemory({
    organizationId,
    types: ['brand', 'company_identity', 'product', 'preference'],
    limit: 10,
  })
  const brainContext =
    brainResult.ok && brainResult.value.memories.length > 0
      ? brainResult.value.memories.map((m) => `[${m.type}] ${JSON.stringify(m.content)}`).join('\n')
      : '(No business context stored yet. Proceed with general SEO best practices.)'

  const runResult = await workforceEngineService.triggerEngagementRun({
    tenantId,
    workforceId,
    organizationId,
    objective,
    participantIds: [researcher.id, writer.id],
  })
  if (!runResult.ok) {
    throw new Error(`[SEO_EXECUTOR] Failed to trigger run: ${runResult.error.message}`)
  }
  const engagementRun = runResult.value

  await workforceEngineService.updateEngagementRunStatus({
    tenantId,
    id: engagementRun.id,
    status: 'running',
    updatedAt: new Date(),
  })

  const workflow = await orchestrationEngine.createWorkflow(
    { tenantId, organizationId, engagementRunId: engagementRun.id },
    [
      {
        id: RESEARCH_STEP,
        name: 'SEO Keyword Research',
        digitalEmployeeId: researcher.id,
        action: SEO_WORKFORCE_ACTIONS.researcher,
        input: { objective, brainContext },
      },
      {
        id: WRITE_STEP,
        name: 'Write SEO Article',
        digitalEmployeeId: writer.id,
        action: SEO_WORKFORCE_ACTIONS.writer,
        dependsOn: [RESEARCH_STEP],
        input: { objective },
      },
    ]
  )

  await orchestrationEngine.executeWorkflow(workflow.id)

  let currentWorkflow = await orchestrationEngine.getWorkflow(workflow.id)
  let iterations = 0

  while (currentWorkflow.status === 'running' && iterations < MAX_ITERATIONS) {
    iterations++
    const ready = readySteps(currentWorkflow)
    if (ready.length === 0) break

    for (const step of ready) {
      const previousContent = (step.dependsOn ?? [])
        .map(
          (depId) =>
            (currentWorkflow.steps.find((s) => s.id === depId)?.output?.content as string) ?? ''
        )
        .filter(Boolean)
        .join('\n\n---\n\n')

      const systemContext = buildSystemContext(step.action, brainContext)
      const prompt = buildPrompt(step.action, objective, previousContent)

      logger.info(`[SEO_EXECUTOR] Invoking model for step "${step.name}"`, {
        organizationId,
        engagementRunId: engagementRun.id,
        action: step.action,
      })

      try {
        const response = await modelGateway.invoke({
          tenantId,
          organizationId,
          workforceId,
          digitalEmployeeId: step.digitalEmployeeId,
          engagementRunId: engagementRun.id,
          action: step.action,
          prompt,
          systemContext,
          model: 'claude-haiku-4-5-20251001',
          maxTokens: 2048,
        })

        await orchestrationEngine.reportStepCompletion({
          workflowId: workflow.id,
          stepId: step.id,
          outcome: 'completed',
          output: {
            content: response.content,
            model: response.model,
            tokensUsed: response.tokensUsed,
          },
        })
      } catch (error) {
        await orchestrationEngine.reportStepCompletion({
          workflowId: workflow.id,
          stepId: step.id,
          outcome: 'failed',
          error: String(error),
        })
        await workforceEngineService.updateEngagementRunStatus({
          tenantId,
          id: engagementRun.id,
          status: 'failed',
          updatedAt: new Date(),
        })
        throw error
      }
    }

    currentWorkflow = await orchestrationEngine.getWorkflow(workflow.id)
  }

  if (currentWorkflow.status !== 'completed') {
    await workforceEngineService.updateEngagementRunStatus({
      tenantId,
      id: engagementRun.id,
      status: 'failed',
      updatedAt: new Date(),
    })
    throw new Error(
      `[SEO_EXECUTOR] Workflow did not complete. Final status: "${currentWorkflow.status}"`
    )
  }

  const researchOutput =
    (currentWorkflow.steps.find((s) => s.id === RESEARCH_STEP)?.output?.content as string) ?? ''
  const articleOutput =
    (currentWorkflow.steps.find((s) => s.id === WRITE_STEP)?.output?.content as string) ?? ''

  const deliverableResult = await deliverablesService.storeDeliverable({
    tenantId,
    organizationId,
    engagementRunId: engagementRun.id,
    type: 'blog_post',
    title: objective.slice(0, 120),
    content: { body: articleOutput, keywordBrief: researchOutput },
    attributedTo: [researcher.id, writer.id],
  })
  if (!deliverableResult.ok) {
    throw new Error(
      `[SEO_EXECUTOR] Failed to store deliverable: ${deliverableResult.error.message}`
    )
  }
  const deliverable = deliverableResult.value

  await deliverablesService.submitForReview(deliverable.id, organizationId, tenantId)

  await workforceEngineService.updateEngagementRunStatus({
    tenantId,
    id: engagementRun.id,
    status: 'awaiting_approval',
    updatedAt: new Date(),
  })

  await billingService.recordUsageEvent({
    tenantId,
    organizationId,
    type: 'engagement_run',
    quantity: 1,
    metadata: { engagementRunId: engagementRun.id, workforceId },
  })

  await businessBrainService.contributeMemories({
    tenantId,
    organizationId,
    source: `engagement_run:${engagementRun.id}`,
    memories: [
      {
        organizationId,
        type: 'knowledge',
        source: `engagement_run:${engagementRun.id}`,
        content: {
          objective,
          deliverableId: deliverable.id,
          summary: articleOutput.slice(0, 500),
        },
        relevanceScope: ['content_marketing'],
      },
    ],
  })

  logger.info('[SEO_EXECUTOR] SEO engagement run completed', {
    organizationId,
    engagementRunId: engagementRun.id,
    deliverableId: deliverable.id,
  })

  return { engagementRunId: engagementRun.id, deliverableId: deliverable.id }
}

function buildSystemContext(action: string, brainContext: string): string {
  const base = `You are a Digital Employee at an SEO content agency. Use the following business context:\n\n${brainContext}`

  const roleContext: Record<string, string> = {
    [SEO_WORKFORCE_ACTIONS.researcher]: `${base}\n\nYou are Zara, the SEO Researcher. Research target keywords, analyze search intent, and produce a detailed SEO brief.`,
    [SEO_WORKFORCE_ACTIONS.writer]: `${base}\n\nYou are Leo, the SEO Writer. Write a comprehensive, SEO-optimized article that ranks for the target keywords.`,
  }

  return roleContext[action] ?? base
}

function buildPrompt(action: string, objective: string, previousContent: string): string {
  const context = previousContent ? `\n\nSEO research from Zara:\n\n${previousContent}` : ''

  const prompts: Record<string, string> = {
    [SEO_WORKFORCE_ACTIONS.researcher]: `Create an SEO brief for the following objective:\n\n"${objective}"\n\nInclude: primary keyword, secondary keywords, search intent analysis, recommended headings, content structure, and competitor angle.`,
    [SEO_WORKFORCE_ACTIONS.writer]: `Write a complete SEO-optimized article for:\n\n"${objective}"${context}\n\nFollow the SEO brief. Include structured headings, keyword-rich content, and a strong conclusion.`,
  }

  return prompts[action] ?? `Complete the following SEO task: "${objective}"${context}`
}
