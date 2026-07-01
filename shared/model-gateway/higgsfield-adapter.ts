import type { ModelProvider } from '@/shared/types'
import type {
  IModelProviderAdapter,
  NormalizedModelRequest,
  NormalizedModelResponse,
} from './types'

/**
 * Higgsfield provider adapter stub for the Model Gateway.
 *
 * Higgsfield generates cinematic video and image assets from scene prompts.
 * This adapter is the Phase 4 plug-in point — the Creative Department
 * produces scenePrompts[] and imagePrompts[] targeting this adapter.
 *
 * When HIGGSFIELD_API_KEY is set and Phase 4 creative generation is active,
 * replace the stub invoke() with the Higgsfield Generation API.
 *
 * Environment variables:
 *   HIGGSFIELD_API_KEY  — required for creative generation
 *   HIGGSFIELD_API_URL  — optional; defaults to https://api.higgsfield.ai
 *
 * See FOUNDATION_001_ARCHITECTURE.md §6.3 — Provider-Specific Code Boundary.
 */
export class HiggsfieldAdapter implements IModelProviderAdapter {
  readonly provider: ModelProvider = 'higgsfield'

  constructor(_apiKey?: string) {
    // API key validation deferred to invoke() so bootstrap does not throw
    // when the key is absent — the gateway logs a warning instead.
  }

  async invoke(_request: NormalizedModelRequest): Promise<NormalizedModelResponse> {
    const apiKey = process.env.HIGGSFIELD_API_KEY
    if (!apiKey) {
      throw new Error(
        '[HIGGSFIELD_ADAPTER] HIGGSFIELD_API_KEY is not set. ' +
          'Set HIGGSFIELD_API_KEY to enable cinematic video and image generation via Higgsfield.'
      )
    }

    // Phase 4: replace with Higgsfield Generation API call.
    // scenePrompts[] and imagePrompts[] from CreativeBrief drive the content.
    throw new Error(
      '[HIGGSFIELD_ADAPTER] Creative generation not yet implemented. ' +
        'This adapter is the Phase 4 plug-in point for Higgsfield video and image generation.'
    )
  }
}
