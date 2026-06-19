import { businessBrainService } from '@/domains/business-brain'
import { billingService, ENTITLEMENT_FEATURES } from '@/domains/billing'
import { deliverablesService } from '@/domains/deliverables'
import { workforceEngineService } from '@/domains/workforce-engine'
import { orchestrationEngine } from '@/shared/orchestration'
import { modelGateway } from '@/shared/model-gateway'
import { logger } from '@/shared/lib/logger'
import { PlatformErrorCode } from '@/shared/types'
import type { DeliverableId, DeliverableType, EngagementRunId, WorkforceId } from '@/shared/types'
import type { PlatformContext } from '@/shared/context'
import type { WorkflowStepId } from '@/shared/types'
import type { Workflow } from '@/shared/orchestration/types'
import { CTO_WORKFORCE_ACTIONS, CTO_WORKFORCE_ROLES } from './provision'
import { createGitHubIssue } from '@/shared/integrations/github'

/**
 * CTO Engagement Run Executor
 *
 * Executes a CTO Agent Engagement Run. Atlas reads its full knowledge base
 * from the Business Brain, produces the appropriate Deliverable, and
 * contributes the resulting decision or insight back to the Brain.
 *
 * Run types dispatched from the objective:
 *   implementation_plan  — "Generate implementation plan for..."
 *   code_review          — "Review...", "Audit...", "Assess..."
 *   milestone_report     — "Milestone status", "V1 readiness", "Progress..."
 *   blocker_report       — "Blockers", "Risks", "Issues blocking..."
 *
 * Atlas never modifies production code. Atlas recommends; humans authorize.
 * Every invocation passes through the Trust Engine (requiresApproval: false
 * for planning/review actions — Atlas operates in supervised autonomy).
 *
 * See docs/adr/ADR-018-cto-agent-workforce.md
 */

export interface CTORunResult {
  engagementRunId: EngagementRunId
  deliverableId: DeliverableId
  deliverableType: DeliverableType
}

const ATLAS_STEP = 'atlas_analysis' as WorkflowStepId
const MAX_ITERATIONS = 5

function detectRunType(objective: string): {
  action: string
  deliverableType: DeliverableType
  stepName: string
} {
  const lower = objective.toLowerCase()
  if (
    lower.includes('coordinate') ||
    lower.includes('coordination') ||
    lower.includes('orchestrate') ||
    lower.includes('brief') ||
    lower.includes('across platforms') ||
    lower.includes('github issue')
  ) {
    return {
      action: CTO_WORKFORCE_ACTIONS.coordinate,
      deliverableType: 'coordination_brief',
      stepName: 'Platform Coordination Brief',
    }
  }
  if (
    lower.includes('readiness report') ||
    lower.includes('v1 readiness') ||
    lower.includes('launch readiness') ||
    lower.includes('assess readiness') ||
    lower.includes('overall readiness')
  ) {
    return {
      action: CTO_WORKFORCE_ACTIONS.readiness,
      deliverableType: 'v1_readiness_report',
      stepName: 'V1 Launch Readiness Assessment',
    }
  }
  if (
    lower.includes('review') ||
    lower.includes('audit') ||
    lower.includes('assess') ||
    lower.includes('check') ||
    lower.includes('evaluate')
  ) {
    return {
      action: CTO_WORKFORCE_ACTIONS.review,
      deliverableType: 'code_review',
      stepName: 'Code & Architecture Review',
    }
  }
  if (
    lower.includes('milestone') ||
    lower.includes('progress') ||
    lower.includes('status') ||
    lower.includes('readiness') ||
    lower.includes('launch') ||
    lower.includes('v1')
  ) {
    return {
      action: CTO_WORKFORCE_ACTIONS.milestone,
      deliverableType: 'milestone_report',
      stepName: 'Milestone Status Report',
    }
  }
  if (
    lower.includes('block') ||
    lower.includes('risk') ||
    lower.includes('issue') ||
    lower.includes('problem') ||
    lower.includes('gap') ||
    lower.includes('debt')
  ) {
    return {
      action: CTO_WORKFORCE_ACTIONS.blockers,
      deliverableType: 'blocker_report',
      stepName: 'Launch Blocker Identification',
    }
  }
  return {
    action: CTO_WORKFORCE_ACTIONS.plan,
    deliverableType: 'implementation_plan',
    stepName: 'Implementation Plan Generation',
  }
}

function readySteps(workflow: Workflow) {
  const completedIds = new Set(
    workflow.steps.filter((s) => s.status === 'completed').map((s) => s.id)
  )
  return workflow.steps.filter((s) => {
    if (s.status !== 'pending') return false
    return (s.dependsOn ?? []).every((dep) => completedIds.has(dep))
  })
}

function buildSystemPrompt(context: string): string {
  return `You are Atlas, the CTO Agent for Koolerr — an AI Workforce platform being built to let businesses deploy and manage AI Digital Employees.

Your role is to accelerate the Koolerr V1 launch by providing precise, actionable engineering intelligence. You have deep knowledge of the platform loaded from the Business Brain below.

AUTHORITY HIERARCHY (highest to lowest):
1. Foundation documents (FOUNDATION_000–005) — never violate these
2. Architecture Decision Records (ADRs) — must be followed or superseded by a new ADR
3. CLAUDE.md operating instructions — session-level constraints
4. Your own analysis and recommendations

CORE CONSTRAINTS:
- Never recommend bypassing the Trust Engine for any AI invocation
- Never recommend modifying production code without explicit founder authorization
- Never introduce architecture that contradicts Foundation decisions without an ADR
- Always reference specific existing files and patterns when generating implementation plans
- Flag technical debt, Foundation violations, and launch risks you identify

Platform Knowledge (from Business Brain):
---
${context}
---

When generating IMPLEMENTATION PLANS:
- Reference specific file paths (e.g., infrastructure/cto-workforce/executor.ts)
- Follow patterns established in Foundation documents and existing code
- Output steps executable by a developer or Claude Code instance directly
- Estimate commit count and identify what can be done in parallel

When generating CODE REVIEWS:
- Check for Foundation violations (provider-specific code outside Gateway, domain cross-imports, etc.)
- Assess ADR compliance
- Identify security concerns (injection, credential exposure, RLS gaps)
- Assess test coverage gaps
- Conclude with a clear verdict: APPROVED / APPROVED WITH NOTES / CHANGES REQUIRED

When generating MILESTONE REPORTS:
- State each milestone: COMPLETE / IN PROGRESS / NOT STARTED
- Compute a V1 Readiness Score (0–100%) with clear methodology
- Identify the single highest-priority action to advance V1 launch

When identifying LAUNCH BLOCKERS:
- Rank by severity: CRITICAL / MAJOR / MINOR
- For each blocker: what it is, why it blocks V1, proposed resolution, estimated effort
- Conclude with a critical path recommendation

When generating V1 READINESS REPORTS:
- Open with "## V1 Launch Readiness Report" and an **Overall Launch Readiness: XX%** score with explicit methodology
- Phase Status section: COMPLETE / IN PROGRESS / NOT STARTED for every Phase 3 milestone
- Critical Blockers (CRITICAL): anything that prevents launch. For each: what it is, why it blocks V1, proposed resolution, effort estimate
- Major Blockers (MAJOR): items that would degrade the V1 experience significantly
- Recommended Execution Order: ordered list of next actions, each with assigned platform (Claude Code / Lovable / Supabase / GitHub / HeyGen / ElevenLabs)
- Platform Integration Priorities: which external platform should be integrated first, second, third — and why
- Estimated Timeline: calendar estimate to V1 launch given the recommended execution order
- Cross-Workforce Intelligence: what each Workforce has learned that informs V1 strategy
- Close with a single sentence: "The highest-leverage action to advance V1 launch is: [ACTION]."

When generating COORDINATION BRIEFS:
- Structure output with one section per platform: ## Claude Code, ## Lovable, ## Supabase, ## GitHub, ## HeyGen, ## ElevenLabs (only include platforms relevant to this objective)
- For each platform: specific task description, exact inputs/outputs, estimated effort
- The ## GitHub section will be automatically created as a real GitHub issue — write it as a complete, self-contained issue body
- End with a CRITICAL PATH recommendation: which platform must move first and why`
}

function buildPrompt(action: string, objective: string, contextSummary: string): string {
  const prompts: Record<string, string> = {
    [CTO_WORKFORCE_ACTIONS.plan]: `Generate a precise implementation plan for the following objective:\n\n"${objective}"\n\n${contextSummary}\n\nOutput a numbered step-by-step plan with specific files to create or modify, code patterns to follow, estimated commits, and any ADRs required. Flag any Foundation risks.`,
    [CTO_WORKFORCE_ACTIONS.review]: `Perform a thorough code and architecture review for:\n\n"${objective}"\n\n${contextSummary}\n\nCheck Foundation compliance, ADR adherence, security, test coverage, and technical debt. Provide a clear verdict.`,
    [CTO_WORKFORCE_ACTIONS.milestone]: `Generate a milestone status report for:\n\n"${objective}"\n\n${contextSummary}\n\nState completion status for every Phase 3 milestone, compute a V1 Readiness Score, and identify the single highest-priority next action.`,
    [CTO_WORKFORCE_ACTIONS.blockers]: `Identify all launch blockers relevant to:\n\n"${objective}"\n\n${contextSummary}\n\nRank by severity (CRITICAL / MAJOR / MINOR). For each: what it is, why it blocks V1, proposed resolution, estimated effort. End with a critical path recommendation.`,
    [CTO_WORKFORCE_ACTIONS.coordinate]: `Generate a platform coordination brief for the following objective:\n\n"${objective}"\n\n${contextSummary}\n\nStructure output with one ## section per relevant platform. The ## GitHub section will become a real GitHub issue — write a complete, self-contained issue body. End with the CRITICAL PATH recommendation.`,
    [CTO_WORKFORCE_ACTIONS.readiness]: `Generate a comprehensive V1 Launch Readiness Report.\n\n${contextSummary}\n\nThis report will be used to drive all Koolerr V1 execution decisions. Be precise about the readiness percentage, honest about blockers, and specific about which platform integrations (GitHub, Lovable, Supabase, HeyGen, ElevenLabs) should begin immediately. Every recommendation must reference a concrete next action.`,
  }
  return (
    prompts[action] ??
    `Complete the following CTO Agent task:\n\n"${objective}"\n\n${contextSummary}`
  )
}

function extractGitHubSection(output: string): string | null {
  const match = output.match(/##\s+GitHub\s*\n([\s\S]*?)(?=\n##\s|\s*$)/)
  return match ? match[1].trim() : null
}

export async function executeCTOEngagementRun(
  ctx: PlatformContext,
  workforceId: WorkforceId,
  objective: string
): Promise<CTORunResult> {
  const { tenantId, organizationId } = ctx
  const { action, deliverableType, stepName } = detectRunType(objective)

  // -------------------------------------------------------------------------
  // Step 1: Entitlement check.
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
        new Error(`[CTO_EXECUTOR] Engagement run limit reached (${used}/${limit}).`),
        { code: PlatformErrorCode.BILLING_ERROR }
      )
    }
  }

  // -------------------------------------------------------------------------
  // Step 2: Load Atlas Digital Employee.
  // -------------------------------------------------------------------------
  const employeesResult = await workforceEngineService.listDigitalEmployees(
    workforceId,
    organizationId
  )
  if (!employeesResult.ok) {
    throw new Error(
      `[CTO_EXECUTOR] Failed to load digital employees: ${employeesResult.error.message}`
    )
  }
  const atlas = employeesResult.value.find((e) => e.role === CTO_WORKFORCE_ROLES.atlas)
  if (!atlas) {
    throw new Error(
      '[CTO_EXECUTOR] Atlas Digital Employee not found — is the CTO Workforce provisioned?'
    )
  }

  // -------------------------------------------------------------------------
  // Step 3: Load CTO context from Business Brain.
  // All memories tagged cto_agent are Atlas's persistent knowledge base.
  // -------------------------------------------------------------------------
  const memoriesResult = await businessBrainService.listAllMemories(organizationId)
  const ctoMemories = memoriesResult.ok
    ? memoriesResult.value.filter((m) => m.relevanceScope.includes('cto_agent'))
    : []

  const contextText =
    ctoMemories.length > 0
      ? ctoMemories
          .map((m) => {
            const body = m.content as { title?: string; body?: string }
            return `## ${body.title ?? m.type}\n${body.body ?? JSON.stringify(m.content)}`
          })
          .join('\n\n---\n\n')
      : '(No CTO context loaded — seed context via seedCTOContext() or trigger a context refresh run)'

  const contextSummary =
    ctoMemories.length > 0
      ? `\n\nNote: Full platform context is in your system prompt. Reference it in your analysis.`
      : `\n\nWarning: No CTO context is loaded. Base your analysis on the objective alone.`

  // -------------------------------------------------------------------------
  // Step 3b: For V1 readiness runs, add cross-Workforce intelligence.
  // Load per-Workforce memory counts so Atlas can reason across all Workforces.
  // -------------------------------------------------------------------------
  let workforceIntelligence = ''
  if (deliverableType === 'v1_readiness_report') {
    const allWorkforcesResult = await workforceEngineService.listWorkforces(organizationId)
    if (allWorkforcesResult.ok && allWorkforcesResult.value.length > 0) {
      const wfLines = await Promise.all(
        allWorkforcesResult.value.map(async (wf) => {
          const wfMemoriesResult = await businessBrainService.listMemoriesByWorkforce(
            wf.id,
            organizationId
          )
          const count = wfMemoriesResult.ok ? wfMemoriesResult.value.length : 0
          return `- **${wf.name}** (${wf.businessFunction}): ${count} attributed Brain memories, status: ${wf.status}`
        })
      )
      workforceIntelligence = `\n\n## Cross-Workforce Intelligence\n${wfLines.join('\n')}\n`
    }
  }

  // -------------------------------------------------------------------------
  // Step 4: Trigger Engagement Run record.
  // -------------------------------------------------------------------------
  const runResult = await workforceEngineService.triggerEngagementRun({
    tenantId,
    workforceId,
    organizationId,
    objective,
    participantIds: [atlas.id],
  })
  if (!runResult.ok) {
    throw new Error(`[CTO_EXECUTOR] Failed to trigger engagement run: ${runResult.error.message}`)
  }
  const engagementRun = runResult.value

  await workforceEngineService.updateEngagementRunStatus({
    tenantId,
    id: engagementRun.id,
    status: 'running',
    updatedAt: new Date(),
  })

  // -------------------------------------------------------------------------
  // Step 5: Create single-step Orchestration Workflow.
  // -------------------------------------------------------------------------
  const workflow = await orchestrationEngine.createWorkflow(
    { tenantId, organizationId, engagementRunId: engagementRun.id },
    [
      {
        id: ATLAS_STEP,
        name: stepName,
        digitalEmployeeId: atlas.id,
        action,
        input: { objective },
      },
    ]
  )

  await orchestrationEngine.executeWorkflow(workflow.id)

  // -------------------------------------------------------------------------
  // Step 6: Execute via Model Gateway (Trust Engine enforced inside gateway).
  // -------------------------------------------------------------------------
  let currentWorkflow = await orchestrationEngine.getWorkflow(workflow.id)
  let iterations = 0

  while (currentWorkflow.status === 'running' && iterations < MAX_ITERATIONS) {
    iterations++
    const ready = readySteps(currentWorkflow)
    if (ready.length === 0) break

    for (const step of ready) {
      const systemContext = buildSystemPrompt(contextText + workforceIntelligence)
      const prompt = buildPrompt(action, objective, contextSummary)

      logger.info(`[CTO_EXECUTOR] Atlas invoking model for "${stepName}"`, {
        organizationId,
        engagementRunId: engagementRun.id,
        action,
      })

      try {
        const response = await modelGateway.invoke({
          tenantId,
          organizationId,
          workforceId,
          digitalEmployeeId: atlas.id,
          engagementRunId: engagementRun.id,
          action,
          prompt,
          systemContext,
          model: 'claude-sonnet-4-6',
          maxTokens: 4096,
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
      `[CTO_EXECUTOR] Workflow did not complete. Final status: "${currentWorkflow.status}"`
    )
  }

  // -------------------------------------------------------------------------
  // Step 7: Store Deliverable.
  // -------------------------------------------------------------------------
  const atlasOutput =
    (currentWorkflow.steps.find((s) => s.id === ATLAS_STEP)?.output?.content as string) ?? ''

  // -------------------------------------------------------------------------
  // Step 7a: For coordination briefs, extract the GitHub section and create
  // a real GitHub issue. Non-fatal — the deliverable is stored regardless.
  // -------------------------------------------------------------------------
  let githubIssueUrl: string | undefined
  let githubIssueNumber: number | undefined

  if (deliverableType === 'coordination_brief' && atlasOutput) {
    const githubSection = extractGitHubSection(atlasOutput)
    if (githubSection) {
      const issueResult = await createGitHubIssue({
        title: `[Atlas] ${objective.slice(0, 80)}`,
        body: githubSection,
        labels: ['atlas', 'cto-agent', 'coordination'],
      })
      if (issueResult) {
        githubIssueUrl = issueResult.url
        githubIssueNumber = issueResult.number
        logger.info('[CTO_EXECUTOR] GitHub issue created from coordination brief', {
          url: githubIssueUrl,
          number: githubIssueNumber,
          organizationId,
        })
      }
    }
  }

  const deliverableResult = await deliverablesService.storeDeliverable({
    tenantId,
    organizationId,
    engagementRunId: engagementRun.id,
    type: deliverableType,
    title: objective.slice(0, 120),
    content: {
      objective,
      output: atlasOutput,
      action,
      contextMemoriesLoaded: ctoMemories.length,
      ...(githubIssueUrl && { githubIssueUrl, githubIssueNumber }),
    },
    attributedTo: [atlas.id],
  })
  if (!deliverableResult.ok) {
    throw new Error(
      `[CTO_EXECUTOR] Failed to store deliverable: ${deliverableResult.error.message}`
    )
  }
  const deliverable = deliverableResult.value

  // CTO deliverables go directly to completed (no human approval gate for planning/review outputs)
  await workforceEngineService.updateEngagementRunStatus({
    tenantId,
    id: engagementRun.id,
    status: 'completed',
    updatedAt: new Date(),
  })

  // -------------------------------------------------------------------------
  // Step 8: Record usage.
  // -------------------------------------------------------------------------
  await billingService.recordUsageEvent({
    tenantId,
    organizationId,
    type: 'engagement_run',
    quantity: 1,
    metadata: { engagementRunId: engagementRun.id, workforceId },
  })

  // -------------------------------------------------------------------------
  // Step 9: Contribute insight back to Business Brain.
  // -------------------------------------------------------------------------
  await businessBrainService.contributeMemories({
    tenantId,
    organizationId,
    source: `engagement_run:${engagementRun.id}`,
    memories: [
      {
        organizationId,
        workforceId,
        type: 'decision',
        source: `engagement_run:${engagementRun.id}`,
        content: {
          objective,
          deliverableId: deliverable.id,
          deliverableType,
          summary: atlasOutput.slice(0, 600),
        },
        relevanceScope: [CTO_CONTEXT_SCOPE, 'engineering_intelligence'],
      },
    ],
  })

  logger.info('[CTO_EXECUTOR] CTO Engagement Run completed', {
    organizationId,
    engagementRunId: engagementRun.id,
    deliverableId: deliverable.id,
    deliverableType,
  })

  return { engagementRunId: engagementRun.id, deliverableId: deliverable.id, deliverableType }
}

const CTO_CONTEXT_SCOPE = 'cto_agent'
