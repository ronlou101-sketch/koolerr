import { PROVIDER_REGISTRY } from '../providers'
import type {
  DeliveryDepartmentHealth,
  DeliveryProviderReadiness,
  DeliveryProviderStatus,
} from './types'

/**
 * Returns current health status for the Delivery Department.
 * Derived from the Provider Registry (OpenAI) and the runtime environment (Anthropic).
 * No external calls are made.
 *
 * readyForDelivery: true when at least the primary provider (OpenAI) is configured.
 *
 * Note: Anthropic is a platform-level ModelProvider and is not tracked in the
 * domain PROVIDER_REGISTRY. Its configuration is derived from ANTHROPIC_API_KEY.
 */
export function getDeliveryDepartmentHealth(): DeliveryDepartmentHealth {
  const openaiEntry = PROVIDER_REGISTRY['openai']
  const primaryConfigured = openaiEntry.configuredInEnv

  const anthropicConfigured = !!process.env.ANTHROPIC_API_KEY

  const primaryStatus: DeliveryProviderStatus = {
    providerId: 'openai',
    name: openaiEntry.name,
    readiness: primaryConfigured ? 'ready' : ('not-configured' as DeliveryProviderReadiness),
    purpose: 'Delivery package generation (primary)',
    notes: primaryConfigured
      ? 'OpenAI is configured and ready'
      : 'OpenAI — set OPENAI_API_KEY to activate',
  }

  const fallbackStatus: DeliveryProviderStatus = {
    providerId: 'anthropic',
    name: 'Anthropic',
    readiness: anthropicConfigured ? 'ready' : ('not-configured' as DeliveryProviderReadiness),
    purpose: 'Delivery package generation (fallback)',
    notes: anthropicConfigured
      ? 'Anthropic is configured and ready'
      : 'Anthropic — set ANTHROPIC_API_KEY to activate',
  }

  const configuredCount = [primaryConfigured, anthropicConfigured].filter(Boolean).length

  const overall: DeliveryProviderReadiness =
    configuredCount === 0 ? 'not-configured' : configuredCount === 2 ? 'ready' : 'not-configured'

  return {
    overall,
    primaryProvider: primaryStatus,
    fallbackProvider: fallbackStatus,
    readyForDelivery: primaryConfigured,
    configuredProviderCount: configuredCount,
    totalProviderCount: 2,
  }
}
