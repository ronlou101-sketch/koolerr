import { PROVIDER_REGISTRY } from '../providers'
import type {
  CreativeDepartmentHealth,
  CreativeProviderReadiness,
  CreativeProviderStatus,
} from './types'

function providerStatus(
  id: 'heygen' | 'higgsfield' | 'elevenlabs' | 'openai',
  purpose: string
): CreativeProviderStatus {
  const entry = PROVIDER_REGISTRY[id]
  const configured = entry.configuredInEnv
  const readiness: CreativeProviderReadiness = configured ? 'ready' : 'not-configured'

  return {
    providerId: id,
    name: entry.name,
    readiness,
    purpose,
    notes: configured
      ? `${entry.name} is configured and ready`
      : `${entry.name} — set ${id.toUpperCase().replace(/-/g, '_')}_API_KEY to activate`,
  }
}

/**
 * Returns current health status for the Creative Department.
 * Derived entirely from the Provider Registry — no external calls.
 *
 * readyForBriefGeneration: true when OpenAI is available (produces the CreativeBrief text).
 * readyForProduction:      true when all media providers are configured for Phase 4.
 */
export function getCreativeDepartmentHealth(): CreativeDepartmentHealth {
  const heygen = providerStatus('heygen', 'AI spokesperson video generation')
  const higgsfield = providerStatus('higgsfield', 'Cinematic video and image generation')
  const elevenlabs = providerStatus('elevenlabs', 'AI voice synthesis')
  const openai = providerStatus('openai', 'Creative brief text generation')

  const videoProviders = [heygen, higgsfield]
  const allProviders = [heygen, higgsfield, elevenlabs, openai]

  const configuredCount = allProviders.filter((p) => p.readiness === 'ready').length
  const allVideoConfigured = videoProviders.every((p) => p.readiness === 'ready')
  const briefGenerationReady = openai.readiness === 'ready'

  const overall: CreativeProviderReadiness =
    configuredCount === 0
      ? 'not-configured'
      : configuredCount === allProviders.length
        ? 'ready'
        : 'not-configured'

  return {
    overall,
    videoProviders,
    voiceProvider: elevenlabs,
    textProvider: openai,
    readyForProduction:
      allVideoConfigured && elevenlabs.readiness === 'ready' && briefGenerationReady,
    readyForBriefGeneration: briefGenerationReady,
    configuredProviderCount: configuredCount,
    totalProviderCount: allProviders.length,
  }
}
