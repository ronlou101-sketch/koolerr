import type { ModelProvider } from '@/shared/types'
import type {
  IModelProviderAdapter,
  NormalizedModelRequest,
  NormalizedModelResponse,
} from './types'

/**
 * HeyGen provider adapter for the Model Gateway.
 *
 * Generates AI spokesperson/avatar videos from a script prompt.
 * Follows the async submit-and-poll pattern: submits a video job then
 * polls until the video is rendered or the timeout is reached.
 *
 * API shape:
 *   POST /v2/video/generate      → { data: { video_id } }
 *   GET  /v1/video_status.get    → { data: { status, video_url?, error? } }
 *
 * Environment variables:
 *   HEYGEN_API_KEY    — required; account API key
 *   HEYGEN_AVATAR_ID  — required; avatar ID from your HeyGen account
 *   HEYGEN_VOICE_ID   — required; voice ID for the spokesperson
 *   HEYGEN_API_URL    — optional; defaults to https://api.heygen.com
 *
 * See FOUNDATION_001_ARCHITECTURE.md §6.3 — Provider-Specific Code Boundary.
 */

const DEFAULT_HEYGEN_URL = 'https://api.heygen.com'
const POLL_INTERVAL_MS = 5_000
const POLL_TIMEOUT_MS = 600_000 // 10 minutes — video rendering is slower than text generation

interface HeyGenVideoCreated {
  video_id: string
}

interface HeyGenVideoStatus {
  status: 'waiting' | 'processing' | 'completed' | 'failed'
  video_url?: string
  error?: string
}

export class HeyGenAdapter implements IModelProviderAdapter {
  readonly provider: ModelProvider = 'heygen'

  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly avatarId: string
  private readonly voiceId: string

  constructor() {
    // Validation deferred to invoke() — bootstrap registers when HEYGEN_API_KEY is set
    // but HEYGEN_AVATAR_ID / HEYGEN_VOICE_ID may still be absent at registration time.
    this.apiKey = process.env.HEYGEN_API_KEY ?? ''
    this.baseUrl = (process.env.HEYGEN_API_URL ?? DEFAULT_HEYGEN_URL).replace(/\/$/, '')
    this.avatarId = process.env.HEYGEN_AVATAR_ID ?? ''
    this.voiceId = process.env.HEYGEN_VOICE_ID ?? ''
  }

  async invoke(request: NormalizedModelRequest): Promise<NormalizedModelResponse> {
    if (!this.apiKey) {
      throw new Error(
        '[HEYGEN_ADAPTER] HEYGEN_API_KEY is not set. ' +
          'Set HEYGEN_API_KEY to enable AI video generation via HeyGen.'
      )
    }
    if (!this.avatarId) {
      throw new Error(
        '[HEYGEN_ADAPTER] HEYGEN_AVATAR_ID is not set. ' +
          'Set HEYGEN_AVATAR_ID to the avatar ID from your HeyGen account.'
      )
    }
    if (!this.voiceId) {
      throw new Error(
        '[HEYGEN_ADAPTER] HEYGEN_VOICE_ID is not set. ' +
          'Set HEYGEN_VOICE_ID to the voice ID for the spokesperson.'
      )
    }

    const startMs = Date.now()
    const { video_id } = await this.createVideo(request.prompt)
    const { video_url } = await this.pollForCompletion(video_id)

    return {
      content: video_url,
      model: 'heygen-avatar-video-v2',
      tokensUsed: 0, // HeyGen charges by video credits, not tokens
      latencyMs: Date.now() - startMs,
    }
  }

  private async createVideo(script: string): Promise<HeyGenVideoCreated> {
    const body = {
      video_inputs: [
        {
          character: {
            type: 'avatar',
            avatar_id: this.avatarId,
            avatar_style: 'normal',
          },
          voice: {
            type: 'text',
            input_text: script,
            voice_id: this.voiceId,
          },
        },
      ],
      dimension: { width: 1280, height: 720 },
    }

    const response = await fetch(`${this.baseUrl}/v2/video/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': this.apiKey,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => response.statusText)
      throw new Error(`[HEYGEN_ADAPTER] Video creation failed (${response.status}): ${text}`)
    }

    const json = (await response.json()) as { data?: { video_id?: string }; error?: string | null }

    if (json.error) {
      throw new Error(`[HEYGEN_ADAPTER] Video creation error: ${json.error}`)
    }
    if (!json.data?.video_id) {
      throw new Error('[HEYGEN_ADAPTER] No video_id in creation response')
    }

    return { video_id: json.data.video_id }
  }

  private async pollForCompletion(videoId: string): Promise<{ video_url: string }> {
    const deadline = Date.now() + POLL_TIMEOUT_MS

    while (Date.now() < deadline) {
      const status = await this.fetchVideoStatus(videoId)

      if (status.status === 'completed') {
        if (!status.video_url) {
          throw new Error(`[HEYGEN_ADAPTER] Video ${videoId} completed with no video_url`)
        }
        return { video_url: status.video_url }
      }

      if (status.status === 'failed') {
        throw new Error(
          `[HEYGEN_ADAPTER] Video ${videoId} failed: ${status.error ?? 'unknown error'}`
        )
      }

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
    }

    throw new Error(
      `[HEYGEN_ADAPTER] Video ${videoId} did not complete within ${POLL_TIMEOUT_MS / 1000}s`
    )
  }

  private async fetchVideoStatus(videoId: string): Promise<HeyGenVideoStatus> {
    const response = await fetch(
      `${this.baseUrl}/v1/video_status.get?video_id=${encodeURIComponent(videoId)}`,
      { headers: { 'X-Api-Key': this.apiKey } }
    )

    if (!response.ok) {
      const text = await response.text().catch(() => response.statusText)
      throw new Error(
        `[HEYGEN_ADAPTER] Status poll failed for ${videoId} (${response.status}): ${text}`
      )
    }

    const json = (await response.json()) as { data?: HeyGenVideoStatus }

    if (!json.data) {
      throw new Error(`[HEYGEN_ADAPTER] No data in status response for video ${videoId}`)
    }

    return json.data
  }
}
