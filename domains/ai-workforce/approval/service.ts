import { modelGateway } from '@/shared/model-gateway'
import type { IModelGateway } from '@/shared/model-gateway'
import { trustEngine } from '@/shared/trust'
import { logger } from '@/shared/lib/logger'
import { ok, err } from '@/shared/types'
import type {
  DigitalEmployeeId,
  ModelProvider,
  OrganizationId,
  Result,
  TrustRule,
} from '@/shared/types'
import { WORKFORCE_REGISTRY } from '../employees'
import { buildApprovalPrompt, parseApprovalDecision, APPROVAL_SYSTEM_CONTEXT } from './prompt'
import type {
  ApprovalDecision,
  ApprovalError,
  ApprovalErrorCode,
  ApprovalJob,
  ApprovalRequest,
} from './types'

const MAX_RETRIES = 3
const APPROVAL_ACTION = 'review_publishing_packages'

// Text providers for approval decisions.
// buildProviderOrder() starts from qa-lead's primaryProvider ('openai'),
// which IS in this list — so the order is ['openai', 'anthropic'] as intended.
const APPROVAL_PROVIDERS: ModelProvider[] = ['openai', 'anthropic']

/** Public interface consumed by the orchestrator and downstream systems. */
export interface IApprovalDepartmentService {
  reviewPackages(request: ApprovalRequest): Promise<Result<ApprovalJob, ApprovalError>>
  getJob(jobId: string): ApprovalJob | undefined
  listJobs(): ApprovalJob[]
}

export class ApprovalDepartmentService implements IApprovalDepartmentService {
  private readonly jobs = new Map<string, ApprovalJob>()
  private readonly gateway: IModelGateway

  constructor(gateway?: IModelGateway) {
    this.gateway = gateway ?? modelGateway
  }

  async reviewPackages(request: ApprovalRequest): Promise<Result<ApprovalJob, ApprovalError>> {
    const employeeId = request.preferredEmployee ?? 'qa-lead'
    const employee =
      WORKFORCE_REGISTRY.find((e) => e.id === employeeId) ??
      WORKFORCE_REGISTRY.find((e) => e.id === 'qa-lead')!

    this.ensureTrustRule(employee.id as DigitalEmployeeId, request.organizationId)

    const jobId = crypto.randomUUID()
    const job: ApprovalJob = {
      id: jobId,
      status: 'running',
      publishingJob: request.publishingJob,
      attempts: 0,
      employeeId: employee.id,
      providerId: APPROVAL_PROVIDERS[0],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.jobs.set(jobId, { ...job })

    logger.info('[APPROVAL_DEPT] Job started', { jobId, employee: employee.id })

    const providerOrder = this.buildProviderOrder(
      employee.primaryProvider,
      employee.fallbackProvider
    )

    return this.executeWithRetry(job, request, providerOrder)
  }

  /**
   * Resolves provider order for approval decisions.
   *
   * The qa-lead has primaryProvider: 'openai' which IS in APPROVAL_PROVIDERS,
   * so buildProviderOrder('openai', null) → ['openai', 'anthropic'].
   * The implicit fallback loop appends any remaining providers not yet in the order.
   */
  private buildProviderOrder(primary: string, fallback: string | null): ModelProvider[] {
    const order: ModelProvider[] = []

    if (APPROVAL_PROVIDERS.includes(primary as ModelProvider)) {
      order.push(primary as ModelProvider)
    }

    if (
      fallback &&
      APPROVAL_PROVIDERS.includes(fallback as ModelProvider) &&
      fallback !== primary
    ) {
      order.push(fallback as ModelProvider)
    }

    for (const provider of APPROVAL_PROVIDERS) {
      if (!order.includes(provider)) order.push(provider)
    }

    if (order.length === 0) order.push('openai')

    return order
  }

  private async executeWithRetry(
    job: ApprovalJob,
    request: ApprovalRequest,
    providerOrder: ModelProvider[]
  ): Promise<Result<ApprovalJob, ApprovalError>> {
    let lastError = ''

    for (const providerId of providerOrder) {
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        job.attempts++
        job.updatedAt = new Date()

        if (attempt > 1) {
          job.status = 'retrying'
          this.jobs.set(job.id, { ...job })
          logger.info('[APPROVAL_DEPT] Retrying', {
            jobId: job.id,
            provider: providerId,
            attempt,
          })
        }

        try {
          const decision = await this.invokeReview(request, job, providerId)

          job.status = 'completed'
          job.approvalDecision = decision
          job.providerId = providerId
          job.updatedAt = new Date()
          this.jobs.set(job.id, { ...job })

          logger.info('[APPROVAL_DEPT] Job completed', {
            jobId: job.id,
            provider: providerId,
            outcome: decision.overallDecision,
            qualityScore: decision.qualityScore,
            attempts: job.attempts,
          })

          return ok({ ...job })
        } catch (error) {
          lastError = String(error)
          logger.warn('[APPROVAL_DEPT] Attempt failed', {
            jobId: job.id,
            provider: providerId,
            attempt,
            error: lastError,
          })

          if (this.isNonRetriable(lastError)) {
            break
          }
        }
      }
    }

    const errorCode = this.classifyError(lastError)
    job.status = 'failed'
    job.error = lastError
    job.updatedAt = new Date()
    this.jobs.set(job.id, { ...job })

    logger.error('[APPROVAL_DEPT] Job failed — all providers exhausted', {
      jobId: job.id,
      attempts: job.attempts,
      error: lastError,
    })

    return err({
      code: errorCode,
      message: `Approval job failed after ${job.attempts} attempt(s): ${lastError}`,
      retriable: errorCode !== 'MAX_RETRIES_EXCEEDED' && errorCode !== 'TRUST_ENGINE_DENIED',
    })
  }

  private async invokeReview(
    request: ApprovalRequest,
    job: ApprovalJob,
    providerId: ModelProvider
  ): Promise<ApprovalDecision> {
    const prompt = buildApprovalPrompt(request.publishingJob)

    const response = await this.gateway.invoke({
      tenantId: request.tenantId,
      organizationId: request.organizationId,
      workforceId: request.workforceId,
      digitalEmployeeId: job.employeeId as DigitalEmployeeId,
      engagementRunId: request.engagementRunId,
      action: APPROVAL_ACTION,
      prompt,
      systemContext: APPROVAL_SYSTEM_CONTEXT,
      provider: providerId,
      maxTokens: 4096,
    })

    return parseApprovalDecision(response.content, request.publishingJob)
  }

  private ensureTrustRule(employeeId: DigitalEmployeeId, organizationId: OrganizationId): void {
    const rule: TrustRule = {
      id: `approval-${employeeId}-${APPROVAL_ACTION}`,
      organizationId,
      digitalEmployeeId: employeeId,
      action: APPROVAL_ACTION,
      requiresApproval: false,
      autonomyLevel: 'autonomous',
    }
    trustEngine.registerRule(rule)
  }

  private isNonRetriable(error: string): boolean {
    return (
      error.includes('OPENAI_API_KEY') ||
      error.includes('No provider available') ||
      error.includes('trust_engine_denied') ||
      error.includes('Trust Engine denied')
    )
  }

  private classifyError(error: string): ApprovalErrorCode {
    if (error.includes('OPENAI_API_KEY') || error.includes('No provider available')) {
      return 'PROVIDER_NOT_CONFIGURED'
    }
    if (error.includes('trust_engine_denied') || error.includes('Trust Engine denied')) {
      return 'TRUST_ENGINE_DENIED'
    }
    if (error.includes('did not complete within') || error.includes('timeout')) {
      return 'TIMEOUT'
    }
    if (
      error.includes('non-JSON') ||
      error.includes('Invalid "overallDecision"') ||
      error.includes('Missing or invalid') ||
      error.includes('Missing array field')
    ) {
      return 'INVALID_RESPONSE'
    }
    return 'MAX_RETRIES_EXCEEDED'
  }

  getJob(jobId: string): ApprovalJob | undefined {
    const job = this.jobs.get(jobId)
    return job ? { ...job } : undefined
  }

  listJobs(): ApprovalJob[] {
    return Array.from(this.jobs.values()).map((j) => ({ ...j }))
  }
}

/** Singleton approval department service. Injected with the platform Model Gateway. */
export const approvalDepartment: IApprovalDepartmentService = new ApprovalDepartmentService()
