import type { ModelProvider } from '@/shared/types'
import type {
  IModelProviderAdapter,
  NormalizedModelRequest,
  NormalizedModelResponse,
} from './types'

/**
 * HeyGen provider adapter stub for the Model Gateway.
 *
 * HeyGen generates AI spokesperson and avatar videos from scripts.
 * This adapter is the Phase 4 plug-in point — the Creative Department
 * already produces videoPrompts[] targeting this adapter.
 *
 * When HEYGEN_API_KEY is set and Phase 4 video generation is active,
 * replace the stub invoke() with the HeyGen Video Generation API:
 *   POST /v2/video/generate → { video_id }
 *   GET  /v1/video_status.get?video_id= → { status, video_url }
 *
 * Environment variables:
 *   HEYGEN_API_KEY  — required for video generation
 *   HEYGEN_API_URL  — optional; defaults to https://api.heygen.com
 *
 * See FOUNDATION_001_ARCHITECTURE.md §6.3 — Provider-Specific Code Boundary.
 */
export class HeyGenAdapter implements IModelProviderAdapter {
  readonly provider: ModelProvider = 'heygen'

  constructor(_apiKey?: string) {
    // API key validation deferred to invoke() so bootstrap does not throw
    // when the key is absent — the gateway logs a warning instead.
  }

  async invoke(_request: NormalizedModelRequest): Promise<NormalizedModelResponse> {
    const apiKey = process.env.HEYGEN_API_KEY
    if (!apiKey) {
      throw new Error(
        '[HEYGEN_ADAPTER] HEYGEN_API_KEY is not set. ' +
          'Set HEYGEN_API_KEY to enable AI video generation via HeyGen.'
      )
    }

    // Phase 4: replace with HeyGen Video Generation API call.
    // The videoPrompts[] from CreativeBrief drive the script/scene content.
    throw new Error(
      '[HEYGEN_ADAPTER] Video generation not yet implemented. ' +
        'This adapter is the Phase 4 plug-in point for HeyGen video generation.'
    )
  }
}
