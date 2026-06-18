import { createBillingUsageSink } from '@/domains/billing'
import { billingService } from '@/domains/billing'
import { _registerUsageSink, modelGateway } from '@/shared/model-gateway'
import { logger } from '@/shared/lib/logger'

/**
 * Platform Bootstrap
 *
 * The composition root for the Koolerr platform. Wires all cross-cutting
 * singleton integrations and returns a status confirming what was initialized.
 *
 * Must be called once at application startup before the first request is
 * handled. The function is idempotent — calling it more than once is safe
 * and produces only a warning log on subsequent calls.
 *
 * What bootstrap does:
 * 1. Registers the billing usage sink with the Model Gateway so that every
 *    successful AI invocation automatically records a billing usage event
 *    (FOUNDATION_001 §4 — "The Model Gateway emits usage events to billing").
 *
 * What bootstrap does NOT do:
 * - Register AI provider adapters (those are registered separately when
 *   provider credentials are available — see _registerProvider).
 * - Connect to Supabase or any external service.
 * - Create tenants, organizations, or any business data.
 *
 * The infrastructure/ layer is the only place that may import from both
 * shared/ and domains/ in the same file. All other layers must respect
 * the shared → domain coupling prohibition.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §1.2 — Modular Monolith Philosophy.
 * See FOUNDATION_001_ARCHITECTURE.md §4 — Data Ownership Rules.
 */

let bootstrapped = false

export interface PlatformBootstrapResult {
  readonly status: 'ok'
  /** True if this call performed initialization; false if already bootstrapped. */
  readonly initialized: boolean
  /** AI providers currently registered with the Model Gateway. */
  readonly registeredProviders: string[]
  readonly usageSinkRegistered: true
}

export function bootstrapPlatform(): PlatformBootstrapResult {
  if (bootstrapped) {
    logger.warn(
      '[PLATFORM] bootstrapPlatform() called more than once — skipping re-initialization.'
    )
    return {
      status: 'ok',
      initialized: false,
      registeredProviders: modelGateway.registeredProviders(),
      usageSinkRegistered: true,
    }
  }

  // Wire the billing usage sink into the Model Gateway.
  // From this point forward, every successful Model Gateway invocation
  // automatically emits a model_invocation usage event to the billing domain.
  const usageSink = createBillingUsageSink(billingService)
  _registerUsageSink(usageSink)

  bootstrapped = true

  const registeredProviders = modelGateway.registeredProviders()

  logger.info('[PLATFORM] Platform bootstrapped successfully', {
    registeredProviders:
      registeredProviders.length > 0
        ? registeredProviders
        : '(none — register a provider adapter before invoking the Model Gateway)',
    usageSinkRegistered: true,
  })

  return {
    status: 'ok',
    initialized: true,
    registeredProviders,
    usageSinkRegistered: true,
  }
}

/** Returns true if bootstrapPlatform() has been called. */
export function isPlatformBootstrapped(): boolean {
  return bootstrapped
}
