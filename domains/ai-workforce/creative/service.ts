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
import { buildCreativePrompt, parseCreativeBrief, CREATIVE_SYSTEM_CONTEXT } from './prompt'
import type {
  CreativeBrief,
  CreativeError,
  CreativeErrorCode,
  CreativeJob,
  CreativeRequest,
} from './types'

const MAX_RETRIES = 3
const CREATIVE_ACTION = 'create_creative_brief'

// Text-capable providers for brief generation.
// HeyGen / Higgsfield / ElevenLabs are the downstream consumers of the brief,
// not the producers of it — they are wired in Phase 4 for actual media output.
const CREATIVE_TEXT_PROVIDERS: ModelProvider[] = ['openai', 'anthropic']

/** Public interface consumed by the orchestrator and downstream departments. */
export interface ICreativeDepartmentService {
  createBrief(request: CreativeRequest): Promise<Result<CreativeJob, CreativeError>>
  getJob(jobId: string): CreativeJob | undefined
  listJobs(): CreativeJob[]
}

export class CreativeDepartmentService implements ICreativeDepartmentService {
  private readonly jobs = new Map<string, CreativeJob>()
  private readonly gateway: IModelGateway

  constructor(gateway?: IModelGateway) {
    this.gateway = gateway ?? modelGateway
  }

  async createBrief(request: CreativeRequest): Promise<Result<CreativeJob, CreativeError>> {
    // Select the creative employee (defaults to creative-director).
    const employeeId = request.preferredEmployee ?? 'creative-director'
    const employee =
      WORKFORCE_REGISTRY.find((e) => e.id === employeeId) ??
      WORKFORCE_REGISTRY.find((e) => e.id === 'creative-director')!

    // Register trust rules for this employee scoped to the calling organization.
    // registerRule() is idempotent — safe to call on every request.
    this.ensureTrustRule(employee.id as DigitalEmployeeId, request.organizationId)

    const jobId = crypto.randomUUID()
    const job: CreativeJob = {
      id: jobId,
      status: 'running',
      strategyBrief: request.strategyBrief,
      attempts: 0,
      employeeId: employee.id,
      providerId: CREATIVE_TEXT_PROVIDERS[0],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.jobs.set(jobId, { ...job })

    logger.info('[CREATIVE_DEPT] Job started', { jobId, employee: employee.id })

    return this.executeWithRetry(job, request, CREATIVE_TEXT_PROVIDERS)
  }

  private async executeWithRetry(
    job: CreativeJob,
    request: CreativeRequest,
    providerOrder: ModelProvider[]
  ): Promise<Result<CreativeJob, CreativeError>> {
    let lastError = ''

    for (const providerId of providerOrder) {
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        job.attempts++
        job.updatedAt = new Date()

        if (attempt > 1) {
          job.status = 'retrying'
          this.jobs.set(job.id, { ...job })
          logger.info('[CREATIVE_DEPT] Retrying', { jobId: job.id, provider: providerId, attempt })
        }

        try {
          const brief = await this.invokeBriefGeneration(request, job, providerId)

          job.status = 'completed'
          job.creativeBrief = brief
          job.providerId = providerId
          job.updatedAt = new Date()
          this.jobs.set(job.id, { ...job })

          logger.info('[CREATIVE_DEPT] Job completed', {
            jobId: job.id,
            provider: providerId,
            attempts: job.attempts,
          })

          return ok({ ...job })
        } catch (error) {
          lastError = String(error)
          logger.warn('[CREATIVE_DEPT] Attempt failed', {
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

    logger.error('[CREATIVE_DEPT] Job failed — all providers exhausted', {
      jobId: job.id,
      attempts: job.attempts,
      error: lastError,
    })

    return err({
      code: errorCode,
      message: `Creative job failed after ${job.attempts} attempt(s): ${lastError}`,
      retriable: errorCode !== 'MAX_RETRIES_EXCEEDED' && errorCode !== 'TRUST_ENGINE_DENIED',
    })
  }

  private async invokeBriefGeneration(
    request: CreativeRequest,
    job: CreativeJob,
    providerId: ModelProvider
  ): Promise<CreativeBrief> {
    const prompt = buildCreativePrompt(request.strategyBrief)

    const response = await this.gateway.invoke({
      tenantId: request.tenantId,
      organizationId: request.organizationId,
      workforceId: request.workforceId,
      digitalEmployeeId: job.employeeId as DigitalEmployeeId,
      engagementRunId: request.engagementRunId,
      action: CREATIVE_ACTION,
      prompt,
      systemContext: CREATIVE_SYSTEM_CONTEXT,
      provider: providerId,
      maxTokens: 8192,
    })

    return parseCreativeBrief(response.content, request.strategyBrief)
  }

  private ensureTrustRule(employeeId: DigitalEmployeeId, organizationId: OrganizationId): void {
    const rule: TrustRule = {
      id: `creative-${employeeId}-${CREATIVE_ACTION}`,
      organizationId,
      digitalEmployeeId: employeeId,
      action: CREATIVE_ACTION,
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

  private classifyError(error: string): CreativeErrorCode {
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

  getJob(jobId: string): CreativeJob | undefined {
    const job = this.jobs.get(jobId)
    return job ? { ...job } : undefined
  }

  listJobs(): CreativeJob[] {
    return Array.from(this.jobs.values()).map((j) => ({ ...j }))
  }
}

/** Singleton creative department service. Injected with the platform Model Gateway. */
export const creativeDepartment: ICreativeDepartmentService = new CreativeDepartmentService()
