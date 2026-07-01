import { PROVIDER_REGISTRY } from '../providers'
import type {
  VideoProductionDepartmentHealth,
  VideoProductionProviderReadiness,
  VideoProductionProviderStatus,
} from './types'

function providerStatus(
  id: 'heygen' | 'higgsfield' | 'elevenlabs' | 'openai',
  purpose: string
): VideoProductionProviderStatus {
  const entry = PROVIDER_REGISTRY[id]
  const configured = entry.configuredInEnv
  const readiness: VideoProductionProviderReadiness = configured ? 'ready' : 'not-configured'

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
 * Returns current health status for the Video Production Department.
 * Derived entirely from the Provider Registry — no external calls.
 *
 * readyForPlanGeneration: true when OpenAI is available (produces the VideoProductionBrief text).
 * readyForProduction:     true when all media providers are configured for Phase 5 rendering.
 */
export function getVideoProductionDepartmentHealth(): VideoProductionDepartmentHealth {
  const heygen = providerStatus('heygen', 'AI spokesperson video rendering')
  const higgsfield = providerStatus('higgsfield', 'Cinematic video and image rendering')
  const elevenlabs = providerStatus('elevenlabs', 'AI voice synthesis and audio rendering')
  const openai = providerStatus('openai', 'Video production plan generation')

  const videoProviders = [heygen, higgsfield]
  const allProviders = [heygen, higgsfield, elevenlabs, openai]

  const configuredCount = allProviders.filter((p) => p.readiness === 'ready').length
  const allVideoConfigured = videoProviders.every((p) => p.readiness === 'ready')
  const planGenerationReady = openai.readiness === 'ready'

  const overall: VideoProductionProviderReadiness =
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
      allVideoConfigured && elevenlabs.readiness === 'ready' && planGenerationReady,
    readyForPlanGeneration: planGenerationReady,
    configuredProviderCount: configuredCount,
    totalProviderCount: allProviders.length,
  }
}
