import { logger } from '@/shared/lib/logger'
import type { ModelProvider } from '@/shared/types'
import type {
  IModelProviderAdapter,
  NormalizedModelRequest,
  NormalizedModelResponse,
} from './types'

/**
 * Higgsfield provider adapter for the Model Gateway.
 *
 * Generates cinematic video and image assets from scene/image prompts.
 * Follows the async submit-and-poll pattern: submits a generation job then
 * polls until the asset is ready or the timeout is reached.
 *
 * API shape (official Higgsfield Cloud API — platform.higgsfield.ai):
 *   POST /v1/text2image/soul          → { request_id, status, images?, video? }
 *   GET  /requests/{request_id}/status → { status, images?, video? }
 *
 * Status lifecycle: queued → in_progress → completed | failed | nsfw
 *
 * Environment variables:
 *   HIGGSFIELD_API_KEY  — required; combined KEY_ID:KEY_SECRET credential
 *   HIGGSFIELD_API_URL  — optional; defaults to https://platform.higgsfield.ai
 *
 * See FOUNDATION_001_ARCHITECTURE.md §6.3 — Provider-Specific Code Boundary.
 */

const DEFAULT_BASE_URL = 'https://platform.higgsfield.ai'
const SUBMIT_ENDPOINT = '/v1/text2image/soul'
const DEFAULT_SIZE = '1536x1536' // square; API-verified allowed value
const POLL_INTERVAL_MS = 3_000
const POLL_TIMEOUT_MS = 300_000 // 5 minutes — generation is compute-intensive

interface HiggsfieldResponse {
  request_id?: string
  status?: string
  images?: Array<{ url: string }>
  video?: { url: string }
}

interface AdapterConfig {
  pollIntervalMs?: number
  pollTimeoutMs?: number
}

export class HiggsfieldAdapter implements IModelProviderAdapter {
  readonly provider: ModelProvider = 'higgsfield'

  private readonly pollIntervalMs: number
  private readonly pollTimeoutMs: number

  constructor(config?: AdapterConfig) {
    this.pollIntervalMs = config?.pollIntervalMs ?? POLL_INTERVAL_MS
    this.pollTimeoutMs = config?.pollTimeoutMs ?? POLL_TIMEOUT_MS
  }

  async invoke(request: NormalizedModelRequest): Promise<NormalizedModelResponse> {
    const apiKey = process.env.HIGGSFIELD_API_KEY
    if (!apiKey) {
      throw new Error(
        '[HIGGSFIELD_ADAPTER] HIGGSFIELD_API_KEY is not set. ' +
          'Set HIGGSFIELD_API_KEY to enable cinematic video and image generation via Higgsfield.'
      )
    }

    const baseUrl = (process.env.HIGGSFIELD_API_URL ?? DEFAULT_BASE_URL).replace(/\/$/, '')
    const startMs = Date.now()

    logger.info('[HIGGSFIELD_ADAPTER] Submitting generation request', {
      endpoint: SUBMIT_ENDPOINT,
    })

    const submitResponse = await fetch(`${baseUrl}${SUBMIT_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${apiKey}`,
      },
      body: JSON.stringify({ params: { prompt: request.prompt, width_and_height: DEFAULT_SIZE } }),
    })

    if (!submitResponse.ok) {
      throw await this.buildHttpError(submitResponse, 'submit')
    }

    const submitJson = (await submitResponse.json()) as HiggsfieldResponse

    if (!submitJson.request_id) {
      throw new Error('[HIGGSFIELD_ADAPTER] Submit response missing request_id')
    }

    const requestId = submitJson.request_id

    if (submitJson.status === 'completed') {
      return {
        content: this.extractAssetUrl(submitJson, requestId),
        model: 'higgsfield/text2image/soul',
        tokensUsed: 0,
        latencyMs: Date.now() - startMs,
      }
    }

    this.throwOnTerminalFailure(submitJson.status, requestId)

    logger.info('[HIGGSFIELD_ADAPTER] Generation queued, polling for completion', { requestId })

    const assetUrl = await this.pollForCompletion(baseUrl, apiKey, requestId)

    return {
      content: assetUrl,
      model: 'higgsfield/text2image/soul',
      tokensUsed: 0,
      latencyMs: Date.now() - startMs,
    }
  }

  private async pollForCompletion(
    baseUrl: string,
    apiKey: string,
    requestId: string
  ): Promise<string> {
    const deadline = Date.now() + this.pollTimeoutMs

    while (Date.now() < deadline) {
      const pollResponse = await fetch(`${baseUrl}/requests/${requestId}/status`, {
        headers: { Authorization: `Key ${apiKey}` },
      })

      if (!pollResponse.ok) {
        throw await this.buildHttpError(pollResponse, `poll:${requestId}`)
      }

      const pollJson = (await pollResponse.json()) as HiggsfieldResponse

      if (pollJson.status === 'completed') {
        logger.info('[HIGGSFIELD_ADAPTER] Generation completed', { requestId })
        return this.extractAssetUrl(pollJson, requestId)
      }

      this.throwOnTerminalFailure(pollJson.status, requestId)

      logger.debug('[HIGGSFIELD_ADAPTER] Generation in progress', {
        requestId,
        status: pollJson.status,
      })

      await new Promise((resolve) => setTimeout(resolve, this.pollIntervalMs))
    }

    throw new Error(
      `[HIGGSFIELD_ADAPTER] Generation ${requestId} did not complete within ${this.pollTimeoutMs / 1000}s`
    )
  }

  private throwOnTerminalFailure(status: string | undefined, requestId: string): void {
    if (status === 'failed') {
      throw new Error(`[HIGGSFIELD_ADAPTER] Generation ${requestId} failed`)
    }
    if (status === 'nsfw') {
      throw new Error(
        `[HIGGSFIELD_ADAPTER] Generation ${requestId} rejected as nsfw — credits refunded`
      )
    }
  }

  private extractAssetUrl(json: HiggsfieldResponse, requestId: string): string {
    const url = json.images?.[0]?.url ?? json.video?.url
    if (!url) {
      throw new Error(
        `[HIGGSFIELD_ADAPTER] Generation ${requestId} completed with no asset URL in response`
      )
    }
    return url
  }

  private async buildHttpError(response: Response, context: string): Promise<Error> {
    const body = await response.text().catch(() => response.statusText)
    const { status } = response

    if (status === 401) {
      return new Error(
        '[HIGGSFIELD_ADAPTER] Authentication failed — verify HIGGSFIELD_API_KEY is a valid KEY_ID:KEY_SECRET credential'
      )
    }
    if (status === 403) {
      return new Error(
        '[HIGGSFIELD_ADAPTER] Insufficient credits — top up your Higgsfield account to continue generation'
      )
    }
    if (status === 400 || status === 422) {
      return new Error(
        `[HIGGSFIELD_ADAPTER] Invalid request (${status}) during ${context}: ${body}`
      )
    }
    return new Error(
      `[HIGGSFIELD_ADAPTER] Provider server error (${status}) during ${context} — temporary outage`
    )
  }
}
