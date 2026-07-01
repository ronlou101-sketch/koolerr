import type { ModelProvider } from '@/shared/types'
import type {
  IModelProviderAdapter,
  NormalizedModelRequest,
  NormalizedModelResponse,
} from './types'

/**
 * ElevenLabs provider adapter for the Model Gateway.
 *
 * Synthesises human-quality voice audio from a text prompt.
 * The ElevenLabs TTS API is synchronous — no polling required.
 * Audio is returned as a base64 data URL in NormalizedModelResponse.content.
 *
 * API shape:
 *   POST /v1/text-to-speech/{voice_id}
 *     Headers: xi-api-key, Content-Type: application/json, Accept: audio/mpeg
 *     Body:    { text, model_id, voice_settings: { stability, similarity_boost } }
 *     Response: audio/mpeg binary
 *
 * Environment variables:
 *   ELEVENLABS_API_KEY   — required; account API key
 *   ELEVENLABS_VOICE_ID  — required; voice ID from your ElevenLabs account
 *   ELEVENLABS_MODEL_ID  — optional; defaults to eleven_monolingual_v1
 *   ELEVENLABS_API_URL   — optional; defaults to https://api.elevenlabs.io
 *
 * See FOUNDATION_001_ARCHITECTURE.md §6.3 — Provider-Specific Code Boundary.
 */

const DEFAULT_ELEVENLABS_URL = 'https://api.elevenlabs.io'
const DEFAULT_MODEL_ID = 'eleven_monolingual_v1'

export class ElevenLabsAdapter implements IModelProviderAdapter {
  readonly provider: ModelProvider = 'elevenlabs'

  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly voiceId: string
  private readonly modelId: string

  constructor() {
    // Validation deferred to invoke() — bootstrap registers when ELEVENLABS_API_KEY is set
    // but ELEVENLABS_VOICE_ID may still be absent at registration time.
    this.apiKey = process.env.ELEVENLABS_API_KEY ?? ''
    this.baseUrl = (process.env.ELEVENLABS_API_URL ?? DEFAULT_ELEVENLABS_URL).replace(/\/$/, '')
    this.voiceId = process.env.ELEVENLABS_VOICE_ID ?? ''
    this.modelId = process.env.ELEVENLABS_MODEL_ID ?? DEFAULT_MODEL_ID
  }

  async invoke(request: NormalizedModelRequest): Promise<NormalizedModelResponse> {
    if (!this.apiKey) {
      throw new Error(
        '[ELEVENLABS_ADAPTER] ELEVENLABS_API_KEY is not set. ' +
          'Set ELEVENLABS_API_KEY to enable AI voice synthesis via ElevenLabs.'
      )
    }
    if (!this.voiceId) {
      throw new Error(
        '[ELEVENLABS_ADAPTER] ELEVENLABS_VOICE_ID is not set. ' +
          'Set ELEVENLABS_VOICE_ID to the voice ID from your ElevenLabs account.'
      )
    }

    const startMs = Date.now()
    const audioBuffer = await this.synthesizeSpeech(request.prompt)

    // Encode binary audio as a base64 data URL — the gateway content field is string-typed.
    const base64 = Buffer.from(audioBuffer).toString('base64')
    const content = `data:audio/mpeg;base64,${base64}`

    return {
      content,
      model: `elevenlabs-${this.modelId}`,
      tokensUsed: 0, // ElevenLabs charges by character, not tokens
      latencyMs: Date.now() - startMs,
    }
  }

  private async synthesizeSpeech(text: string): Promise<ArrayBuffer> {
    const response = await fetch(
      `${this.baseUrl}/v1/text-to-speech/${encodeURIComponent(this.voiceId)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: this.modelId,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      throw new Error(
        `[ELEVENLABS_ADAPTER] Speech synthesis failed (${response.status}): ${errorText}`
      )
    }

    return response.arrayBuffer()
  }
}
