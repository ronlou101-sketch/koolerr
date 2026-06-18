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
import { CONTENT_WORKFORCE_ACTIONS, CONTENT_WORKFORCE_ROLES } from './provision'

/**
 * Content Engagement Run Executor
 *
 * Orchestrates the end-to-end execution of a Content Engagement Run.
 * This is the cross-domain execution layer — it coordinates workforce-engine,
 * business-brain, orchestration-engine, model-gateway, and deliverables.
 *
 * The infrastructure layer is the only place where cross-domain orchestration
 * of this kind is permitted. Domain services may not import each other directly.
 *
 * Execution flow:
 *   1. Check engagement_run entitlement (enforces free-tier run limit)
 *   2. Load Digital Employees for the Content Workforce
 *   3. Query Business Brain for brand/company context
 *   4. Trigger an Engagement Run record
 *   5. Create a 3-step Orchestration Workflow (research → write → review)
 *   6. Execute steps sequentially via the Model Gateway
 *   7. Store the Deliverable and submit for review
 *   8. Record engagement_run usage event + update run status
 *   9. Contribute memories back to the Business Brain
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.13 — Orchestration Engine.
 * See FOUNDATION_001_ARCHITECTURE.md §9 — Rule 4 (Trust Engine must not be bypassed).
 */

export interface ContentRunResult {
  engagementRunId: EngagementRunId
  deliverableId: DeliverableId
}

const RESEARCH_STEP = 'research' as WorkflowStepId
const WRITE_STEP = 'write' as WorkflowStepId
const REVIEW_STEP = 'review' as WorkflowStepId
const MAX_ITERATIONS = 10

/** Returns pending steps whose all dependencies are completed. */
function readySteps(workflow: Workflow) {
  const completedIds = new Set(
    workflow.steps.filter((s) => s.status === 'completed').map((s) => s.id)
  )
  return workflow.steps.filter((s) => {
    if (s.status !== 'pending') return false
    return (s.dependsOn ?? []).every((dep) => completedIds.has(dep))
  })
}

export async function executeContentEngagementRun(
  ctx: PlatformContext,
  workforceId: WorkforceId,
  objective: string
): Promise<ContentRunResult> {
  const { tenantId, organizationId } = ctx

  // -------------------------------------------------------------------------
  // Step 1: Check engagement_run entitlement.
  // Enforce the free-tier run limit before any work is done.
  // -------------------------------------------------------------------------
  const entitlementResult = await billingService.checkEntitlement({
    organizationId,
    feature: ENTITLEMENT_FEATURES.engagementRun,
    quantityRequested: 1,
  })
  if (entitlementResult.ok) {
    const { limit, used } = entitlementResult.value
    if (limit !== Infinity && used >= limit) {
      throw Object.assign(
        new Error(
          `[EXECUTOR] Engagement run limit reached (${used}/${limit}). ` +
            'Upgrade your plan to run more content this period.'
        ),
        { code: PlatformErrorCode.BILLING_ERROR }
      )
    }
  }
  // Entitlement check failure is non-fatal — proceed so billing issues
  // never silently block a customer who has not hit their limit.

  // -------------------------------------------------------------------------
  // Step 2: Load Digital Employees for this Content Workforce.
  // -------------------------------------------------------------------------
  const employeesResult = await workforceEngineService.listDigitalEmployees(
    workforceId,
    organizationId
  )
  if (!employeesResult.ok) {
    throw new Error(`[EXECUTOR] Failed to load digital employees: ${employeesResult.error.message}`)
  }
  const employees = employeesResult.value

  const strategist = employees.find((e) => e.role === CONTENT_WORKFORCE_ROLES.strategist)
  const copywriter = employees.find((e) => e.role === CONTENT_WORKFORCE_ROLES.copywriter)
  const editor = employees.find((e) => e.role === CONTENT_WORKFORCE_ROLES.editor)

  if (!strategist || !copywriter || !editor) {
    throw new Error(
      '[EXECUTOR] Content Workforce is missing one or more required Digital Employees ' +
        `(strategist=${!!strategist}, copywriter=${!!copywriter}, editor=${!!editor})`
    )
  }

  // -------------------------------------------------------------------------
  // Step 2: Query Business Brain for organizational context.
  // -------------------------------------------------------------------------
  const brainResult = await businessBrainService.queryMemory({
    organizationId,
    types: ['brand', 'company_identity', 'product', 'preference'],
    limit: 10,
  })

  const brainContext =
    brainResult.ok && brainResult.value.memories.length > 0
      ? brainResult.value.memories.map((m) => `[${m.type}] ${JSON.stringify(m.content)}`).join('\n')
      : '(No business context stored yet. Proceed with general best practices.)'

  // -------------------------------------------------------------------------
  // Step 3: Trigger Engagement Run record.
  // -------------------------------------------------------------------------
  const runResult = await workforceEngineService.triggerEngagementRun({
    tenantId,
    workforceId,
    organizationId,
    objective,
    participantIds: [strategist.id, copywriter.id, editor.id],
  })
  if (!runResult.ok) {
    throw new Error(`[EXECUTOR] Failed to trigger engagement run: ${runResult.error.message}`)
  }
  const engagementRun = runResult.value

  await workforceEngineService.updateEngagementRunStatus({
    tenantId,
    id: engagementRun.id,
    status: 'running',
    updatedAt: new Date(),
  })

  // -------------------------------------------------------------------------
  // Step 4: Create Orchestration Workflow.
  // -------------------------------------------------------------------------
  const workflow = await orchestrationEngine.createWorkflow(
    { tenantId, organizationId, engagementRunId: engagementRun.id },
    [
      {
        id: RESEARCH_STEP,
        name: 'Research Topic',
        digitalEmployeeId: strategist.id,
        action: CONTENT_WORKFORCE_ACTIONS.strategist,
        input: { objective, brainContext },
      },
      {
        id: WRITE_STEP,
        name: 'Write Content',
        digitalEmployeeId: copywriter.id,
        action: CONTENT_WORKFORCE_ACTIONS.copywriter,
        dependsOn: [RESEARCH_STEP],
        input: { objective },
      },
      {
        id: REVIEW_STEP,
        name: 'Review & Finalize',
        digitalEmployeeId: editor.id,
        action: CONTENT_WORKFORCE_ACTIONS.editor,
        dependsOn: [WRITE_STEP],
        input: { objective },
      },
    ]
  )

  await orchestrationEngine.executeWorkflow(workflow.id)

  // -------------------------------------------------------------------------
  // Step 5: Execution loop — run each step via the Model Gateway.
  // -------------------------------------------------------------------------
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

      logger.info(`[EXECUTOR] Invoking model for step "${step.name}"`, {
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
      `[EXECUTOR] Workflow did not complete. Final status: "${currentWorkflow.status}"`
    )
  }

  // -------------------------------------------------------------------------
  // Step 6: Extract outputs and store Deliverable.
  // -------------------------------------------------------------------------
  const researchOutput =
    (currentWorkflow.steps.find((s) => s.id === RESEARCH_STEP)?.output?.content as string) ?? ''
  const draftOutput =
    (currentWorkflow.steps.find((s) => s.id === WRITE_STEP)?.output?.content as string) ?? ''
  const finalOutput =
    (currentWorkflow.steps.find((s) => s.id === REVIEW_STEP)?.output?.content as string) ?? ''

  const deliverableResult = await deliverablesService.storeDeliverable({
    tenantId,
    organizationId,
    engagementRunId: engagementRun.id,
    type: 'blog_post',
    title: objective.slice(0, 120),
    content: {
      body: finalOutput,
      contentBrief: researchOutput,
      draft: draftOutput,
    },
    attributedTo: [strategist.id, copywriter.id, editor.id],
  })
  if (!deliverableResult.ok) {
    throw new Error(`[EXECUTOR] Failed to store deliverable: ${deliverableResult.error.message}`)
  }
  const deliverable = deliverableResult.value

  // -------------------------------------------------------------------------
  // Step 7: Submit Deliverable for review + update run status.
  // -------------------------------------------------------------------------
  await deliverablesService.submitForReview(deliverable.id, organizationId, tenantId)

  await workforceEngineService.updateEngagementRunStatus({
    tenantId,
    id: engagementRun.id,
    status: 'awaiting_approval',
    updatedAt: new Date(),
  })

  // -------------------------------------------------------------------------
  // Step 8: Record engagement_run usage event.
  // Increments the entitlement counter so the billing UI and enforcement
  // gate reflect actual usage.
  // -------------------------------------------------------------------------
  const usageResult = await billingService.recordUsageEvent({
    tenantId,
    organizationId,
    type: 'engagement_run',
    quantity: 1,
    metadata: { engagementRunId: engagementRun.id, workforceId },
  })
  if (!usageResult.ok) {
    logger.warn('[EXECUTOR] Failed to record engagement_run usage event', {
      organizationId,
      engagementRunId: engagementRun.id,
      error: usageResult.error.message,
    })
  }

  // -------------------------------------------------------------------------
  // Step 8: Contribute memories back to the Business Brain.
  // -------------------------------------------------------------------------
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
          summary: finalOutput.slice(0, 500),
        },
        relevanceScope: ['content_marketing'],
      },
    ],
  })

  logger.info('[EXECUTOR] Content engagement run completed', {
    organizationId,
    engagementRunId: engagementRun.id,
    deliverableId: deliverable.id,
  })

  return { engagementRunId: engagementRun.id, deliverableId: deliverable.id }
}

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

function buildSystemContext(action: string, brainContext: string): string {
  const base = `You are a Digital Employee at a content marketing agency. Use the following business context to inform your work:\n\n${brainContext}`

  const roleContext: Record<string, string> = {
    [CONTENT_WORKFORCE_ACTIONS.strategist]: `${base}\n\nYou are Alex, the Content Strategist. Your role is to research topics, identify audience insights, and produce a detailed content brief for the copywriter.`,
    [CONTENT_WORKFORCE_ACTIONS.copywriter]: `${base}\n\nYou are Jordan, the Copywriter. Your role is to write compelling, well-structured blog posts that engage the target audience and achieve the stated objective.`,
    [CONTENT_WORKFORCE_ACTIONS.editor]: `${base}\n\nYou are Sam, the Editor. Your role is to review content for quality, clarity, and brand alignment, then produce the final polished version ready for the customer's review.`,
  }

  return roleContext[action] ?? base
}

function buildPrompt(action: string, objective: string, previousContent: string): string {
  const context = previousContent ? `\n\nWork from your teammates:\n\n${previousContent}` : ''

  const prompts: Record<string, string> = {
    [CONTENT_WORKFORCE_ACTIONS.strategist]: `Create a detailed content brief for the following objective:\n\n"${objective}"${context}\n\nInclude: target audience, key messages, content structure, talking points, and recommended tone.`,
    [CONTENT_WORKFORCE_ACTIONS.copywriter]: `Write a complete blog post for the following objective:\n\n"${objective}"${context}\n\nFollow the content brief from your strategist teammate.`,
    [CONTENT_WORKFORCE_ACTIONS.editor]: `Review and finalize the following content for the objective:\n\n"${objective}"${context}\n\nProvide the final polished version of the content, ready for publication.`,
  }

  return prompts[action] ?? `Complete the following task: "${objective}"${context}`
}
