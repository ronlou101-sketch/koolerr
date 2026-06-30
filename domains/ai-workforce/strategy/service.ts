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
import { buildStrategyPrompt, parseStrategyBrief, STRATEGY_SYSTEM_CONTEXT } from './prompt'
import type {
  StrategyBrief,
  StrategyError,
  StrategyErrorCode,
  StrategyJob,
  StrategyRequest,
} from './types'

const MAX_RETRIES = 3
const STRATEGY_ACTION = 'develop_strategy'

// Providers valid for the Strategy Department — must be registered in the Model Gateway.
const STRATEGY_PROVIDERS: ModelProvider[] = ['openai', 'anthropic']

/** Public interface consumed by the orchestrator and downstream departments. */
export interface IStrategyDepartmentService {
  developStrategy(request: StrategyRequest): Promise<Result<StrategyJob, StrategyError>>
  getJob(jobId: string): StrategyJob | undefined
  listJobs(): StrategyJob[]
}

export class StrategyDepartmentService implements IStrategyDepartmentService {
  private readonly jobs = new Map<string, StrategyJob>()
  private readonly gateway: IModelGateway

  constructor(gateway?: IModelGateway) {
    this.gateway = gateway ?? modelGateway
  }

  async developStrategy(request: StrategyRequest): Promise<Result<StrategyJob, StrategyError>> {
    // Select the strategy employee (defaults to content-strategist / OpenAI).
    const employeeId = request.preferredEmployee ?? 'content-strategist'
    const employee =
      WORKFORCE_REGISTRY.find((e) => e.id === employeeId) ??
      WORKFORCE_REGISTRY.find((e) => e.id === 'content-strategist')!

    // Register trust rules for this employee scoped to the calling organization.
    // registerRule() is idempotent — safe to call on every request.
    this.ensureTrustRule(employee.id as DigitalEmployeeId, request.organizationId)

    const jobId = crypto.randomUUID()
    const job: StrategyJob = {
      id: jobId,
      status: 'running',
      researchBrief: request.researchBrief,
      attempts: 0,
      employeeId: employee.id,
      providerId: employee.primaryProvider,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.jobs.set(jobId, { ...job })

    logger.info('[STRATEGY_DEPT] Job started', { jobId, employee: employee.id })

    const providerOrder = this.buildProviderOrder(
      employee.primaryProvider,
      employee.fallbackProvider
    )

    return this.executeWithRetry(job, request, providerOrder)
  }

  private async executeWithRetry(
    job: StrategyJob,
    request: StrategyRequest,
    providerOrder: ModelProvider[]
  ): Promise<Result<StrategyJob, StrategyError>> {
    let lastError = ''

    for (const providerId of providerOrder) {
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        job.attempts++
        job.updatedAt = new Date()

        if (attempt > 1) {
          job.status = 'retrying'
          this.jobs.set(job.id, { ...job })
          logger.info('[STRATEGY_DEPT] Retrying', { jobId: job.id, provider: providerId, attempt })
        }

        try {
          const brief = await this.invokeStrategy(request, job, providerId)

          job.status = 'completed'
          job.strategyBrief = brief
          job.providerId = providerId
          job.updatedAt = new Date()
          this.jobs.set(job.id, { ...job })

          logger.info('[STRATEGY_DEPT] Job completed', {
            jobId: job.id,
            provider: providerId,
            attempts: job.attempts,
          })

          return ok({ ...job })
        } catch (error) {
          lastError = String(error)
          logger.warn('[STRATEGY_DEPT] Attempt failed', {
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

    logger.error('[STRATEGY_DEPT] Job failed — all providers exhausted', {
      jobId: job.id,
      attempts: job.attempts,
      error: lastError,
    })

    return err({
      code: errorCode,
      message: `Strategy job failed after ${job.attempts} attempt(s): ${lastError}`,
      retriable: errorCode !== 'MAX_RETRIES_EXCEEDED' && errorCode !== 'TRUST_ENGINE_DENIED',
    })
  }

  private async invokeStrategy(
    request: StrategyRequest,
    job: StrategyJob,
    providerId: ModelProvider
  ): Promise<StrategyBrief> {
    const prompt = buildStrategyPrompt(request.researchBrief)

    const response = await this.gateway.invoke({
      tenantId: request.tenantId,
      organizationId: request.organizationId,
      workforceId: request.workforceId,
      digitalEmployeeId: job.employeeId as DigitalEmployeeId,
      engagementRunId: request.engagementRunId,
      action: STRATEGY_ACTION,
      prompt,
      systemContext: STRATEGY_SYSTEM_CONTEXT,
      provider: providerId,
      maxTokens: 8192,
    })

    return parseStrategyBrief(response.content, request.researchBrief)
  }

  private buildProviderOrder(primary: string, fallback: string | null): ModelProvider[] {
    const order: ModelProvider[] = []

    if (STRATEGY_PROVIDERS.includes(primary as ModelProvider)) {
      order.push(primary as ModelProvider)
    }
    if (
      fallback &&
      STRATEGY_PROVIDERS.includes(fallback as ModelProvider) &&
      fallback !== primary
    ) {
      order.push(fallback as ModelProvider)
    }

    // When the employee registry defines no fallback, add remaining STRATEGY_PROVIDERS
    // so the department can recover from a single-provider outage.
    for (const provider of STRATEGY_PROVIDERS) {
      if (!order.includes(provider)) {
        order.push(provider)
      }
    }

    if (order.length === 0) {
      order.push('openai')
    }

    return order
  }

  private ensureTrustRule(employeeId: DigitalEmployeeId, organizationId: OrganizationId): void {
    const rule: TrustRule = {
      id: `strategy-${employeeId}-${STRATEGY_ACTION}`,
      organizationId,
      digitalEmployeeId: employeeId,
      action: STRATEGY_ACTION,
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

  private classifyError(error: string): StrategyErrorCode {
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
      error.includes('Missing or invalid field') ||
      error.includes('Missing or empty')
    ) {
      return 'INVALID_RESPONSE'
    }
    return 'MAX_RETRIES_EXCEEDED'
  }

  getJob(jobId: string): StrategyJob | undefined {
    const job = this.jobs.get(jobId)
    return job ? { ...job } : undefined
  }

  listJobs(): StrategyJob[] {
    return Array.from(this.jobs.values()).map((j) => ({ ...j }))
  }
}

/** Singleton strategy department service. Injected with the platform Model Gateway. */
export const strategyDepartment: IStrategyDepartmentService = new StrategyDepartmentService()
