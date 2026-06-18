import { auditLogger } from '@/shared/audit'
import { logger } from '@/shared/lib/logger'
import type { ModelProvider } from '@/shared/types'
import type { GatewayRequest, GatewayResponse, IModelGateway, IModelProviderAdapter } from './types'

/**
 * Model Gateway — stub implementation.
 *
 * Satisfies the IModelGateway interface with a no-provider stub so that
 * all call sites are written against the permanent contract. Actual provider
 * adapters (Anthropic, OpenAI, etc.) are registered via registerProvider()
 * and will be added when AI capabilities are introduced.
 *
 * The gateway enforces the platform rule: no domain may invoke an AI provider
 * directly. All invocations must pass through invoke() on this gateway.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §6.3 — Provider-Specific Code Boundary.
 */
class ModelGateway implements IModelGateway {
  private readonly providers = new Map<ModelProvider, IModelProviderAdapter>()
  private defaultProvider: ModelProvider | null = null

  registerProvider(adapter: IModelProviderAdapter, isDefault = false): void {
    this.providers.set(adapter.provider, adapter)
    if (isDefault || this.defaultProvider === null) {
      this.defaultProvider = adapter.provider
    }
    logger.info(`[MODEL_GATEWAY] Provider registered: ${adapter.provider}`)
  }

  registeredProviders(): ModelProvider[] {
    return Array.from(this.providers.keys())
  }

  async invoke(request: GatewayRequest): Promise<GatewayResponse> {
    const startMs = Date.now()
    const targetProvider = request.provider ?? this.defaultProvider

    await auditLogger.log({
      tenantId: request.tenantId,
      organizationId: request.organizationId,
      actor: { type: 'digital_employee', id: request.digitalEmployeeId },
      action: 'model_gateway.invocation_requested',
      resourceType: 'model_invocation',
      resourceId: request.engagementRunId,
      outcome: 'success',
      metadata: { provider: targetProvider, workforceId: request.workforceId },
    })

    if (!targetProvider || !this.providers.has(targetProvider)) {
      await auditLogger.log({
        tenantId: request.tenantId,
        organizationId: request.organizationId,
        actor: { type: 'digital_employee', id: request.digitalEmployeeId },
        action: 'model_gateway.invocation_rejected',
        resourceType: 'model_invocation',
        resourceId: request.engagementRunId,
        outcome: 'failure',
        metadata: {
          reason: 'no_provider_registered',
          requestedProvider: targetProvider,
        },
      })

      throw new Error(
        `[MODEL_GATEWAY] No provider available. ` +
          `Requested: "${targetProvider ?? 'default'}". ` +
          `Register a provider adapter before invoking the gateway.`
      )
    }

    const adapter = this.providers.get(targetProvider)!

    const response = await adapter.invoke({
      prompt: request.prompt,
      model: request.model,
      maxTokens: request.maxTokens,
    })

    const gatewayResponse: GatewayResponse = {
      ...response,
      provider: targetProvider,
      latencyMs: Date.now() - startMs,
    }

    await auditLogger.log({
      tenantId: request.tenantId,
      organizationId: request.organizationId,
      actor: { type: 'digital_employee', id: request.digitalEmployeeId },
      action: 'model_gateway.invocation_completed',
      resourceType: 'model_invocation',
      resourceId: request.engagementRunId,
      outcome: 'success',
      metadata: {
        provider: gatewayResponse.provider,
        model: gatewayResponse.model,
        tokensUsed: gatewayResponse.tokensUsed,
        latencyMs: gatewayResponse.latencyMs,
      },
    })

    return gatewayResponse
  }
}

/** Singleton gateway instance. Register provider adapters on application startup. */
export const modelGateway: IModelGateway = new ModelGateway()

/** Exposed for provider registration at startup. Internal use only. */
export const _registerProvider = (adapter: IModelProviderAdapter, isDefault = false): void => {
  ;(modelGateway as ModelGateway).registerProvider(adapter, isDefault)
}
