import type { IUsageEventSink, GatewayUsageData } from '@/shared/model-gateway'
import { logger } from '@/shared/lib/logger'
import type { IBillingService } from './service'

/**
 * Billing Usage Sink Adapter
 *
 * Adapts IBillingService to the IUsageEventSink interface so the
 * Model Gateway can emit usage events without importing from the
 * billing domain directly (which would create a shared → domain dependency).
 *
 * Registered at startup via _registerUsageSink() in the platform bootstrap.
 * Once registered, every successful Model Gateway invocation automatically
 * records a model_invocation usage event to the billing domain.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §4 — Data Ownership:
 * "The Model Gateway emits usage events to billing."
 */
export function createBillingUsageSink(billing: IBillingService): IUsageEventSink {
  return {
    async recordUsage(data: GatewayUsageData): Promise<void> {
      const result = await billing.recordUsageEvent({
        tenantId: data.tenantId,
        organizationId: data.organizationId,
        type: 'model_invocation',
        quantity: data.tokensUsed,
        metadata: {
          workforceId: data.workforceId,
          engagementRunId: data.engagementRunId,
          action: data.action,
          provider: data.provider,
          model: data.model,
          latencyMs: data.latencyMs,
        },
      })

      if (!result.ok) {
        logger.warn('[BILLING_SINK] Failed to record model_invocation usage event', {
          organizationId: data.organizationId,
          error: result.error,
        })
      }
    },
  }
}
