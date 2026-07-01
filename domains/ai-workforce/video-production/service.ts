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
import {
  buildVideoProductionPrompt,
  parseVideoProductionBrief,
  VIDEO_PRODUCTION_SYSTEM_CONTEXT,
} from './prompt'
import type {
  VideoProductionBrief,
  VideoProductionError,
  VideoProductionErrorCode,
  VideoProductionJob,
  VideoProductionRequest,
} from './types'

const MAX_RETRIES = 3
const VIDEO_PRODUCTION_ACTION = 'plan_video_production'

// Text-capable providers for production plan generation.
// HeyGen / Higgsfield / ElevenLabs are the downstream rendering targets, not plan producers.
// buildProviderOrder() resolves to these providers when the employee's primaryProvider
// (heygen/higgsfield) is not in this list — ensuring clean implicit fallback.
const VIDEO_PLAN_PROVIDERS: ModelProvider[] = ['openai', 'anthropic']

/** Public interface consumed by the orchestrator and downstream departments. */
export interface IVideoProductionDepartmentService {
  planProduction(
    request: VideoProductionRequest
  ): Promise<Result<VideoProductionJob, VideoProductionError>>
  getJob(jobId: string): VideoProductionJob | undefined
  listJobs(): VideoProductionJob[]
}

export class VideoProductionDepartmentService implements IVideoProductionDepartmentService {
  private readonly jobs = new Map<string, VideoProductionJob>()
  private readonly gateway: IModelGateway

  constructor(gateway?: IModelGateway) {
    this.gateway = gateway ?? modelGateway
  }

  async planProduction(
    request: VideoProductionRequest
  ): Promise<Result<VideoProductionJob, VideoProductionError>> {
    const employeeId = request.preferredEmployee ?? 'video-producer'
    const employee =
      WORKFORCE_REGISTRY.find((e) => e.id === employeeId) ??
      WORKFORCE_REGISTRY.find((e) => e.id === 'video-producer')!

    this.ensureTrustRule(employee.id as DigitalEmployeeId, request.organizationId)

    const jobId = crypto.randomUUID()
    const job: VideoProductionJob = {
      id: jobId,
      status: 'running',
      creativeBrief: request.creativeBrief,
      attempts: 0,
      employeeId: employee.id,
      providerId: VIDEO_PLAN_PROVIDERS[0],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.jobs.set(jobId, { ...job })

    logger.info('[VIDEO_PRODUCTION_DEPT] Job started', { jobId, employee: employee.id })

    const providerOrder = this.buildProviderOrder(
      employee.primaryProvider,
      employee.fallbackProvider
    )

    return this.executeWithRetry(job, request, providerOrder)
  }

  /**
   * Resolves provider order for plan generation.
   *
   * The employee registry uses heygen/higgsfield as primaryProvider — these are
   * the rendering targets, not text generators. buildProviderOrder() checks each
   * against VIDEO_PLAN_PROVIDERS and falls through to the implicit loop, which
   * appends the full text provider list (openai → anthropic).
   */
  private buildProviderOrder(primary: string, fallback: string | null): ModelProvider[] {
    const order: ModelProvider[] = []

    if (VIDEO_PLAN_PROVIDERS.includes(primary as ModelProvider)) {
      order.push(primary as ModelProvider)
    }

    if (
      fallback &&
      VIDEO_PLAN_PROVIDERS.includes(fallback as ModelProvider) &&
      fallback !== primary
    ) {
      order.push(fallback as ModelProvider)
    }

    for (const provider of VIDEO_PLAN_PROVIDERS) {
      if (!order.includes(provider)) order.push(provider)
    }

    if (order.length === 0) order.push('openai')

    return order
  }

  private async executeWithRetry(
    job: VideoProductionJob,
    request: VideoProductionRequest,
    providerOrder: ModelProvider[]
  ): Promise<Result<VideoProductionJob, VideoProductionError>> {
    let lastError = ''

    for (const providerId of providerOrder) {
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        job.attempts++
        job.updatedAt = new Date()

        if (attempt > 1) {
          job.status = 'retrying'
          this.jobs.set(job.id, { ...job })
          logger.info('[VIDEO_PRODUCTION_DEPT] Retrying', {
            jobId: job.id,
            provider: providerId,
            attempt,
          })
        }

        try {
          const brief = await this.invokePlanGeneration(request, job, providerId)

          job.status = 'completed'
          job.videoProductionBrief = brief
          job.providerId = providerId
          job.updatedAt = new Date()
          this.jobs.set(job.id, { ...job })

          logger.info('[VIDEO_PRODUCTION_DEPT] Job completed', {
            jobId: job.id,
            provider: providerId,
            attempts: job.attempts,
          })

          return ok({ ...job })
        } catch (error) {
          lastError = String(error)
          logger.warn('[VIDEO_PRODUCTION_DEPT] Attempt failed', {
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

    logger.error('[VIDEO_PRODUCTION_DEPT] Job failed — all providers exhausted', {
      jobId: job.id,
      attempts: job.attempts,
      error: lastError,
    })

    return err({
      code: errorCode,
      message: `Video production job failed after ${job.attempts} attempt(s): ${lastError}`,
      retriable: errorCode !== 'MAX_RETRIES_EXCEEDED' && errorCode !== 'TRUST_ENGINE_DENIED',
    })
  }

  private async invokePlanGeneration(
    request: VideoProductionRequest,
    job: VideoProductionJob,
    providerId: ModelProvider
  ): Promise<VideoProductionBrief> {
    const prompt = buildVideoProductionPrompt(request.creativeBrief)

    const response = await this.gateway.invoke({
      tenantId: request.tenantId,
      organizationId: request.organizationId,
      workforceId: request.workforceId,
      digitalEmployeeId: job.employeeId as DigitalEmployeeId,
      engagementRunId: request.engagementRunId,
      action: VIDEO_PRODUCTION_ACTION,
      prompt,
      systemContext: VIDEO_PRODUCTION_SYSTEM_CONTEXT,
      provider: providerId,
      maxTokens: 8192,
    })

    return parseVideoProductionBrief(response.content, request.creativeBrief)
  }

  private ensureTrustRule(employeeId: DigitalEmployeeId, organizationId: OrganizationId): void {
    const rule: TrustRule = {
      id: `video-production-${employeeId}-${VIDEO_PRODUCTION_ACTION}`,
      organizationId,
      digitalEmployeeId: employeeId,
      action: VIDEO_PRODUCTION_ACTION,
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

  private classifyError(error: string): VideoProductionErrorCode {
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

  getJob(jobId: string): VideoProductionJob | undefined {
    const job = this.jobs.get(jobId)
    return job ? { ...job } : undefined
  }

  listJobs(): VideoProductionJob[] {
    return Array.from(this.jobs.values()).map((j) => ({ ...j }))
  }
}

/** Singleton video production department service. Injected with the platform Model Gateway. */
export const videoProductionDepartment: IVideoProductionDepartmentService =
  new VideoProductionDepartmentService()
