import type { ModelProvider } from '@/shared/types'
import type {
  IModelProviderAdapter,
  NormalizedModelRequest,
  NormalizedModelResponse,
} from './types'

/**
 * ElevenLabs provider adapter stub for the Model Gateway.
 *
 * ElevenLabs synthesises human-quality voice audio from text scripts.
 * This adapter is the Phase 4 plug-in point — the Creative Department
 * produces voiceDirection describing exactly how the Voice Department
 * should configure ElevenLabs for each engagement.
 *
 * When ELEVENLABS_API_KEY is set and Phase 4 voice generation is active,
 * replace the stub invoke() with the ElevenLabs Text-to-Speech API:
 *   POST /v1/text-to-speech/{voice_id} → audio/mpeg
 *
 * Environment variables:
 *   ELEVENLABS_API_KEY  — required for voice synthesis
 *   ELEVENLABS_API_URL  — optional; defaults to https://api.elevenlabs.io
 *
 * See FOUNDATION_001_ARCHITECTURE.md §6.3 — Provider-Specific Code Boundary.
 */
export class ElevenLabsAdapter implements IModelProviderAdapter {
  readonly provider: ModelProvider = 'elevenlabs'

  constructor(_apiKey?: string) {
    // API key validation deferred to invoke() so bootstrap does not throw
    // when the key is absent — the gateway logs a warning instead.
  }

  async invoke(_request: NormalizedModelRequest): Promise<NormalizedModelResponse> {
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      throw new Error(
        '[ELEVENLABS_ADAPTER] ELEVENLABS_API_KEY is not set. ' +
          'Set ELEVENLABS_API_KEY to enable AI voice synthesis via ElevenLabs.'
      )
    }

    // Phase 4: replace with ElevenLabs Text-to-Speech API call.
    // voiceDirection from CreativeBrief drives the voice style and tone.
    throw new Error(
      '[ELEVENLABS_ADAPTER] Voice synthesis not yet implemented. ' +
        'This adapter is the Phase 4 plug-in point for ElevenLabs voice generation.'
    )
  }
}
