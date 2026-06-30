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
import { buildResearchPrompt, parseResearchBrief, RESEARCH_SYSTEM_CONTEXT } from './prompt'
import type {
  BusinessProfile,
  ResearchBrief,
  ResearchError,
  ResearchErrorCode,
  ResearchJob,
  ResearchJobStatus,
  ResearchRequest,
} from './types'

const MAX_RETRIES = 3
const RESEARCH_ACTION = 'conduct_research'

// Providers valid for the research department — must be registered in the Model Gateway.
const RESEARCH_PROVIDERS: ModelProvider[] = ['manus', 'openai']

/** Public interface consumed by the orchestrator and downstream departments. */
export interface IResearchDepartmentService {
  conductResearch(request: ResearchRequest): Promise<Result<ResearchJob, ResearchError>>
  getJob(jobId: string): ResearchJob | undefined
  listJobs(): ResearchJob[]
}

export class ResearchDepartmentService implements IResearchDepartmentService {
  private readonly jobs = new Map<string, ResearchJob>()
  private readonly gateway: IModelGateway

  constructor(gateway?: IModelGateway) {
    this.gateway = gateway ?? modelGateway
  }

  async conductResearch(request: ResearchRequest): Promise<Result<ResearchJob, ResearchError>> {
    // Select the research employee (defaults to research-lead / Manus).
    const employeeId = request.preferredEmployee ?? 'research-lead'
    const employee =
      WORKFORCE_REGISTRY.find((e) => e.id === employeeId) ??
      WORKFORCE_REGISTRY.find((e) => e.id === 'research-lead')!

    // Register trust rules for this employee scoped to the calling organization.
    // registerRule() is idempotent — safe to call on every request.
    this.ensureTrustRule(employee.id as DigitalEmployeeId, request.organizationId)

    const jobId = crypto.randomUUID()
    const job: ResearchJob = {
      id: jobId,
      status: 'running',
      profile: request.profile,
      attempts: 0,
      employeeId: employee.id,
      providerId: employee.primaryProvider,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.jobs.set(jobId, { ...job })

    logger.info('[RESEARCH_DEPT] Job started', { jobId, employee: employee.id })

    // Build the provider preference order: primary first, then fallback.
    const providerOrder = this.buildProviderOrder(
      employee.primaryProvider,
      employee.fallbackProvider
    )

    return this.executeWithRetry(job, request, providerOrder)
  }

  private async executeWithRetry(
    job: ResearchJob,
    request: ResearchRequest,
    providerOrder: ModelProvider[]
  ): Promise<Result<ResearchJob, ResearchError>> {
    let lastError = ''

    for (const providerId of providerOrder) {
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        job.attempts++
        job.updatedAt = new Date()

        if (attempt > 1) {
          job.status = 'retrying'
          this.jobs.set(job.id, { ...job })
          logger.info('[RESEARCH_DEPT] Retrying', { jobId: job.id, provider: providerId, attempt })
        }

        try {
          const brief = await this.invokeResearch(request, job, providerId)

          job.status = 'completed'
          job.brief = brief
          job.providerId = providerId
          job.updatedAt = new Date()
          this.jobs.set(job.id, { ...job })

          logger.info('[RESEARCH_DEPT] Job completed', {
            jobId: job.id,
            provider: providerId,
            attempts: job.attempts,
          })

          return ok({ ...job })
        } catch (error) {
          lastError = String(error)
          logger.warn('[RESEARCH_DEPT] Attempt failed', {
            jobId: job.id,
            provider: providerId,
            attempt,
            error: lastError,
          })

          // Non-retriable errors skip remaining attempts for this provider.
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

    logger.error('[RESEARCH_DEPT] Job failed — all providers exhausted', {
      jobId: job.id,
      attempts: job.attempts,
      error: lastError,
    })

    return err({
      code: errorCode,
      message: `Research job failed after ${job.attempts} attempt(s): ${lastError}`,
      retriable: errorCode !== 'MAX_RETRIES_EXCEEDED' && errorCode !== 'TRUST_ENGINE_DENIED',
    })
  }

  private async invokeResearch(
    request: ResearchRequest,
    job: ResearchJob,
    providerId: ModelProvider
  ): Promise<ResearchBrief> {
    const prompt = buildResearchPrompt(request.profile)

    const response = await this.gateway.invoke({
      tenantId: request.tenantId,
      organizationId: request.organizationId,
      workforceId: request.workforceId,
      digitalEmployeeId: job.employeeId as DigitalEmployeeId,
      engagementRunId: request.engagementRunId,
      action: RESEARCH_ACTION,
      prompt,
      systemContext: RESEARCH_SYSTEM_CONTEXT,
      provider: providerId,
      maxTokens: 4096,
    })

    return parseResearchBrief(response.content, request.profile)
  }

  private buildProviderOrder(primary: string, fallback: string | null): ModelProvider[] {
    const order: ModelProvider[] = []

    if (RESEARCH_PROVIDERS.includes(primary as ModelProvider)) {
      order.push(primary as ModelProvider)
    }
    if (
      fallback &&
      RESEARCH_PROVIDERS.includes(fallback as ModelProvider) &&
      fallback !== primary
    ) {
      order.push(fallback as ModelProvider)
    }

    // Ensure at least one provider is attempted even if registry is stale.
    if (order.length === 0) {
      order.push('openai')
    }

    return order
  }

  private ensureTrustRule(employeeId: DigitalEmployeeId, organizationId: OrganizationId): void {
    const rule: TrustRule = {
      id: `research-${employeeId}-${RESEARCH_ACTION}`,
      organizationId,
      digitalEmployeeId: employeeId,
      action: RESEARCH_ACTION,
      requiresApproval: false,
      autonomyLevel: 'autonomous',
    }
    trustEngine.registerRule(rule)
  }

  private isNonRetriable(error: string): boolean {
    return (
      error.includes('MANUS_API_KEY') ||
      error.includes('No provider available') ||
      error.includes('trust_engine_denied') ||
      error.includes('Trust Engine denied')
    )
  }

  private classifyError(error: string): ResearchErrorCode {
    if (error.includes('MANUS_API_KEY') || error.includes('No provider available')) {
      return 'PROVIDER_NOT_CONFIGURED'
    }
    if (error.includes('trust_engine_denied') || error.includes('Trust Engine denied')) {
      return 'TRUST_ENGINE_DENIED'
    }
    if (error.includes('did not complete within') || error.includes('timeout')) {
      return 'TIMEOUT'
    }
    if (error.includes('non-JSON') || error.includes('Missing or invalid field')) {
      return 'INVALID_RESPONSE'
    }
    return 'MAX_RETRIES_EXCEEDED'
  }

  getJob(jobId: string): ResearchJob | undefined {
    const job = this.jobs.get(jobId)
    return job ? { ...job } : undefined
  }

  listJobs(): ResearchJob[] {
    return Array.from(this.jobs.values()).map((j) => ({ ...j }))
  }
}

/** Singleton research department service. Injected with the platform Model Gateway. */
export const researchDepartment: IResearchDepartmentService = new ResearchDepartmentService()
