import { PROVIDER_REGISTRY } from '../providers'
import type {
  ApprovalDepartmentHealth,
  ApprovalProviderReadiness,
  ApprovalProviderStatus,
} from './types'

/**
 * Returns current health status for the Approval Department.
 * Derived from the Provider Registry (OpenAI) and the runtime environment (Anthropic).
 * No external calls are made.
 *
 * readyForApproval: true when at least the primary provider (OpenAI) is configured.
 *
 * Note: Anthropic is a platform-level ModelProvider and is not tracked in the
 * domain PROVIDER_REGISTRY. Its configuration is derived from ANTHROPIC_API_KEY.
 */
export function getApprovalDepartmentHealth(): ApprovalDepartmentHealth {
  const openaiEntry = PROVIDER_REGISTRY['openai']
  const primaryConfigured = openaiEntry.configuredInEnv

  const anthropicConfigured = !!process.env.ANTHROPIC_API_KEY

  const primaryStatus: ApprovalProviderStatus = {
    providerId: 'openai',
    name: openaiEntry.name,
    readiness: primaryConfigured ? 'ready' : ('not-configured' as ApprovalProviderReadiness),
    purpose: 'Approval decision generation (primary)',
    notes: primaryConfigured
      ? 'OpenAI is configured and ready'
      : 'OpenAI — set OPENAI_API_KEY to activate',
  }

  const fallbackStatus: ApprovalProviderStatus = {
    providerId: 'anthropic',
    name: 'Anthropic',
    readiness: anthropicConfigured ? 'ready' : ('not-configured' as ApprovalProviderReadiness),
    purpose: 'Approval decision generation (fallback)',
    notes: anthropicConfigured
      ? 'Anthropic is configured and ready'
      : 'Anthropic — set ANTHROPIC_API_KEY to activate',
  }

  const configuredCount = [primaryConfigured, anthropicConfigured].filter(Boolean).length

  const overall: ApprovalProviderReadiness =
    configuredCount === 0 ? 'not-configured' : configuredCount === 2 ? 'ready' : 'not-configured'

  return {
    overall,
    primaryProvider: primaryStatus,
    fallbackProvider: fallbackStatus,
    readyForApproval: primaryConfigured,
    configuredProviderCount: configuredCount,
    totalProviderCount: 2,
  }
}
