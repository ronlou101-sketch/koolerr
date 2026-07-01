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
import { buildDeliveryPrompt, parseDeliveryPackage, DELIVERY_SYSTEM_CONTEXT } from './prompt'
import type {
  DeliveryError,
  DeliveryErrorCode,
  DeliveryJob,
  DeliveryPackage,
  DeliveryRequest,
} from './types'

const MAX_RETRIES = 3
const DELIVERY_ACTION = 'prepare_customer_delivery'

// Text providers for delivery package generation.
// buildProviderOrder() starts from delivery-manager's primaryProvider ('openai'),
// which IS in this list — so the order is ['openai', 'anthropic'] as intended.
const DELIVERY_PROVIDERS: ModelProvider[] = ['openai', 'anthropic']

/** Public interface consumed by the orchestrator and downstream systems. */
export interface IDeliveryDepartmentService {
  prepareDelivery(request: DeliveryRequest): Promise<Result<DeliveryJob, DeliveryError>>
  getJob(jobId: string): DeliveryJob | undefined
  listJobs(): DeliveryJob[]
}

export class DeliveryDepartmentService implements IDeliveryDepartmentService {
  private readonly jobs = new Map<string, DeliveryJob>()
  private readonly gateway: IModelGateway

  constructor(gateway?: IModelGateway) {
    this.gateway = gateway ?? modelGateway
  }

  async prepareDelivery(request: DeliveryRequest): Promise<Result<DeliveryJob, DeliveryError>> {
    const employeeId = request.preferredEmployee ?? 'delivery-manager'
    const employee =
      WORKFORCE_REGISTRY.find((e) => e.id === employeeId) ??
      WORKFORCE_REGISTRY.find((e) => e.id === 'delivery-manager')!

    this.ensureTrustRule(employee.id as DigitalEmployeeId, request.organizationId)

    const jobId = crypto.randomUUID()
    const job: DeliveryJob = {
      id: jobId,
      status: 'running',
      approvalDecision: request.approvalDecision,
      attempts: 0,
      employeeId: employee.id,
      providerId: DELIVERY_PROVIDERS[0],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.jobs.set(jobId, { ...job })

    logger.info('[DELIVERY_DEPT] Job started', { jobId, employee: employee.id })

    const providerOrder = this.buildProviderOrder(
      employee.primaryProvider,
      employee.fallbackProvider
    )

    return this.executeWithRetry(job, request, providerOrder)
  }

  /**
   * Resolves provider order for delivery package generation.
   *
   * The delivery-manager has primaryProvider: 'openai' which IS in DELIVERY_PROVIDERS,
   * so buildProviderOrder('openai', null) → ['openai', 'anthropic'].
   * The implicit fallback loop appends any remaining providers not yet in the order.
   */
  private buildProviderOrder(primary: string, fallback: string | null): ModelProvider[] {
    const order: ModelProvider[] = []

    if (DELIVERY_PROVIDERS.includes(primary as ModelProvider)) {
      order.push(primary as ModelProvider)
    }

    if (
      fallback &&
      DELIVERY_PROVIDERS.includes(fallback as ModelProvider) &&
      fallback !== primary
    ) {
      order.push(fallback as ModelProvider)
    }

    for (const provider of DELIVERY_PROVIDERS) {
      if (!order.includes(provider)) order.push(provider)
    }

    if (order.length === 0) order.push('openai')

    return order
  }

  private async executeWithRetry(
    job: DeliveryJob,
    request: DeliveryRequest,
    providerOrder: ModelProvider[]
  ): Promise<Result<DeliveryJob, DeliveryError>> {
    let lastError = ''

    for (const providerId of providerOrder) {
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        job.attempts++
        job.updatedAt = new Date()

        if (attempt > 1) {
          job.status = 'retrying'
          this.jobs.set(job.id, { ...job })
          logger.info('[DELIVERY_DEPT] Retrying', {
            jobId: job.id,
            provider: providerId,
            attempt,
          })
        }

        try {
          const pkg = await this.invokeDelivery(request, job, providerId)

          job.status = 'completed'
          job.deliveryPackage = pkg
          job.providerId = providerId
          job.updatedAt = new Date()
          this.jobs.set(job.id, { ...job })

          logger.info('[DELIVERY_DEPT] Job completed', {
            jobId: job.id,
            provider: providerId,
            packageId: pkg.packageId,
            deliverables: pkg.deliverables.length,
            attempts: job.attempts,
          })

          return ok({ ...job })
        } catch (error) {
          lastError = String(error)
          logger.warn('[DELIVERY_DEPT] Attempt failed', {
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

    logger.error('[DELIVERY_DEPT] Job failed — all providers exhausted', {
      jobId: job.id,
      attempts: job.attempts,
      error: lastError,
    })

    return err({
      code: errorCode,
      message: `Delivery job failed after ${job.attempts} attempt(s): ${lastError}`,
      retriable: errorCode !== 'MAX_RETRIES_EXCEEDED' && errorCode !== 'TRUST_ENGINE_DENIED',
    })
  }

  private async invokeDelivery(
    request: DeliveryRequest,
    job: DeliveryJob,
    providerId: ModelProvider
  ): Promise<DeliveryPackage> {
    const prompt = buildDeliveryPrompt(request.approvalDecision)

    const response = await this.gateway.invoke({
      tenantId: request.tenantId,
      organizationId: request.organizationId,
      workforceId: request.workforceId,
      digitalEmployeeId: job.employeeId as DigitalEmployeeId,
      engagementRunId: request.engagementRunId,
      action: DELIVERY_ACTION,
      prompt,
      systemContext: DELIVERY_SYSTEM_CONTEXT,
      provider: providerId,
      maxTokens: 4096,
    })

    return parseDeliveryPackage(response.content, request.approvalDecision)
  }

  private ensureTrustRule(employeeId: DigitalEmployeeId, organizationId: OrganizationId): void {
    const rule: TrustRule = {
      id: `delivery-${employeeId}-${DELIVERY_ACTION}`,
      organizationId,
      digitalEmployeeId: employeeId,
      action: DELIVERY_ACTION,
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

  private classifyError(error: string): DeliveryErrorCode {
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
      error.includes('Missing or invalid') ||
      error.includes('Missing or empty') ||
      error.includes('Missing array field')
    ) {
      return 'INVALID_RESPONSE'
    }
    return 'MAX_RETRIES_EXCEEDED'
  }

  getJob(jobId: string): DeliveryJob | undefined {
    const job = this.jobs.get(jobId)
    return job ? { ...job } : undefined
  }

  listJobs(): DeliveryJob[] {
    return Array.from(this.jobs.values()).map((j) => ({ ...j }))
  }
}

/** Singleton delivery department service. Injected with the platform Model Gateway. */
export const deliveryDepartment: IDeliveryDepartmentService = new DeliveryDepartmentService()
