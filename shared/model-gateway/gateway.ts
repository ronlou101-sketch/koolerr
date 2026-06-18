import { auditLogger } from '@/shared/audit'
import { logger } from '@/shared/lib/logger'
import { trustEngine } from '@/shared/trust'
import type { ModelProvider } from '@/shared/types'
import type {
  GatewayRequest,
  GatewayResponse,
  GatewayUsageData,
  IModelGateway,
  IModelProviderAdapter,
  IUsageEventSink,
} from './types'

/**
 * Model Gateway — stub implementation.
 *
 * Satisfies IModelGateway with in-memory provider registration.
 *
 * Enforcement order on every invoke():
 *   1. Trust Engine check — action must be 'permitted'; throws on deny/approval
 *   2. Provider dispatch — throws if no matching provider registered
 *   3. Usage event emission via registered IUsageEventSink (billing domain)
 *   4. Audit logging of every outcome
 *
 * Provider adapters and the usage sink are registered at application startup
 * via _registerProvider() and _registerUsageSink(). This module never imports
 * from a domain directly (shared → domain coupling is prohibited by §3).
 *
 * See FOUNDATION_001_ARCHITECTURE.md §6.3 — Provider-Specific Code Boundary.
 * See FOUNDATION_001_ARCHITECTURE.md §4 — Data Ownership (Model Gateway → Billing).
 * See FOUNDATION_001_ARCHITECTURE.md §9 — Rule 1 (Trust Engine, Rule 4).
 */
class ModelGateway implements IModelGateway {
  private readonly providers = new Map<ModelProvider, IModelProviderAdapter>()
  private defaultProvider: ModelProvider | null = null
  private usageSink: IUsageEventSink | null = null

  registerProvider(adapter: IModelProviderAdapter, isDefault = false): void {
    this.providers.set(adapter.provider, adapter)
    if (isDefault || this.defaultProvider === null) {
      this.defaultProvider = adapter.provider
    }
    logger.info(`[MODEL_GATEWAY] Provider registered: ${adapter.provider}`)
  }

  registerUsageSink(sink: IUsageEventSink): void {
    this.usageSink = sink
    logger.info('[MODEL_GATEWAY] Usage event sink registered')
  }

  registeredProviders(): ModelProvider[] {
    return Array.from(this.providers.keys())
  }

  async invoke(request: GatewayRequest): Promise<GatewayResponse> {
    const startMs = Date.now()
    const targetProvider = request.provider ?? this.defaultProvider

    // -------------------------------------------------------------------------
    // Step 1: Trust Engine check.
    // No AI invocation proceeds without a permitted outcome.
    // See FOUNDATION_001 §9 Rule 4: "No bypassing the Trust Engine."
    // -------------------------------------------------------------------------
    const trustResult = await trustEngine.check({
      tenantId: request.tenantId,
      organizationId: request.organizationId,
      workforceId: request.workforceId,
      digitalEmployeeId: request.digitalEmployeeId,
      engagementRunId: request.engagementRunId,
      action: request.action,
    })

    if (trustResult.outcome === 'denied') {
      await auditLogger.log({
        tenantId: request.tenantId,
        organizationId: request.organizationId,
        actor: { type: 'digital_employee', id: request.digitalEmployeeId },
        action: 'model_gateway.invocation_rejected',
        resourceType: 'model_invocation',
        resourceId: request.engagementRunId,
        outcome: 'denied',
        metadata: {
          reason: 'trust_engine_denied',
          checkedAction: request.action,
          trustReason: trustResult.reason,
        },
      })
      throw new Error(
        `[MODEL_GATEWAY] Trust Engine denied action "${request.action}" ` +
          `for Digital Employee "${request.digitalEmployeeId}". ` +
          `Reason: ${trustResult.reason ?? 'unspecified'}`
      )
    }

    if (trustResult.outcome === 'requires_approval') {
      await auditLogger.log({
        tenantId: request.tenantId,
        organizationId: request.organizationId,
        actor: { type: 'digital_employee', id: request.digitalEmployeeId },
        action: 'model_gateway.invocation_rejected',
        resourceType: 'model_invocation',
        resourceId: request.engagementRunId,
        outcome: 'failure',
        metadata: {
          reason: 'trust_engine_requires_approval',
          checkedAction: request.action,
          trustReason: trustResult.reason,
        },
      })
      throw new Error(
        `[MODEL_GATEWAY] Action "${request.action}" requires customer approval ` +
          `before proceeding. ` +
          `Reason: ${trustResult.reason ?? 'unspecified'}`
      )
    }

    // -------------------------------------------------------------------------
    // Step 2: Audit the invocation request (post Trust Engine, pre dispatch).
    // -------------------------------------------------------------------------
    await auditLogger.log({
      tenantId: request.tenantId,
      organizationId: request.organizationId,
      actor: { type: 'digital_employee', id: request.digitalEmployeeId },
      action: 'model_gateway.invocation_requested',
      resourceType: 'model_invocation',
      resourceId: request.engagementRunId,
      outcome: 'success',
      metadata: {
        provider: targetProvider,
        workforceId: request.workforceId,
        checkedAction: request.action,
        autonomyLevel: trustResult.autonomyLevel,
      },
    })

    // -------------------------------------------------------------------------
    // Step 3: Provider dispatch.
    // -------------------------------------------------------------------------
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
      systemContext: request.systemContext,
    })

    const gatewayResponse: GatewayResponse = {
      ...response,
      provider: targetProvider,
      latencyMs: Date.now() - startMs,
    }

    // -------------------------------------------------------------------------
    // Step 4: Audit the completed invocation.
    // -------------------------------------------------------------------------
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
        checkedAction: request.action,
      },
    })

    // -------------------------------------------------------------------------
    // Step 5: Usage event emission.
    // FOUNDATION_001 §4: "The Model Gateway emits usage events to billing."
    // The sink is the billing domain's adapter, registered at startup.
    // -------------------------------------------------------------------------
    if (this.usageSink) {
      const usageData: GatewayUsageData = {
        tenantId: request.tenantId,
        organizationId: request.organizationId,
        workforceId: request.workforceId,
        engagementRunId: request.engagementRunId,
        action: request.action,
        provider: gatewayResponse.provider,
        model: gatewayResponse.model,
        tokensUsed: gatewayResponse.tokensUsed,
        latencyMs: gatewayResponse.latencyMs,
      }
      await this.usageSink.recordUsage(usageData)
    } else {
      logger.warn(
        '[MODEL_GATEWAY] No usage event sink registered — model_invocation usage will not be tracked. ' +
          'Register a sink via _registerUsageSink() at startup.'
      )
    }

    return gatewayResponse
  }
}

/** Singleton gateway instance. Register provider adapters and usage sink on application startup. */
export const modelGateway: IModelGateway = new ModelGateway()

/** Exposed for provider registration at startup. Internal use only. */
export const _registerProvider = (adapter: IModelProviderAdapter, isDefault = false): void => {
  ;(modelGateway as ModelGateway).registerProvider(adapter, isDefault)
}

/**
 * Register the usage event sink at startup.
 * Must be called with the billing domain's IBillingService adapter before
 * the first Model Gateway invocation, or usage will go untracked.
 * Internal use only.
 */
export const _registerUsageSink = (sink: IUsageEventSink): void => {
  ;(modelGateway as ModelGateway).registerUsageSink(sink)
}
