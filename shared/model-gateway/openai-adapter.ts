import type { ModelProvider } from '@/shared/types'
import type {
  IModelProviderAdapter,
  NormalizedModelRequest,
  NormalizedModelResponse,
} from './types'

/**
 * OpenAI provider adapter for the Model Gateway.
 *
 * Translates NormalizedModelRequest ↔ OpenAI Chat Completions API.
 * JSON mode is enabled by default so callers receive valid JSON responses
 * without additional parsing guards when they request structured output.
 *
 * API shape:
 *   POST /v1/chat/completions → { id, model, choices, usage }
 *
 * Environment variables:
 *   OPENAI_API_KEY   — required; Bearer auth token
 *   OPENAI_API_URL   — optional; defaults to https://api.openai.com
 *
 * See FOUNDATION_001_ARCHITECTURE.md §6.3 — Provider-Specific Code Boundary.
 */

const DEFAULT_OPENAI_URL = 'https://api.openai.com'
const DEFAULT_MODEL = 'gpt-4o'

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenAIChatCompletion {
  id: string
  model: string
  choices: Array<{
    message: OpenAIMessage
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class OpenAIAdapter implements IModelProviderAdapter {
  readonly provider: ModelProvider = 'openai'

  private readonly apiKey: string
  private readonly baseUrl: string

  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey ?? process.env.OPENAI_API_KEY ?? ''
    this.baseUrl = (baseUrl ?? process.env.OPENAI_API_URL ?? DEFAULT_OPENAI_URL).replace(/\/$/, '')

    if (!this.apiKey) {
      throw new Error(
        '[OPENAI_ADAPTER] OPENAI_API_KEY is not set. ' +
          'Set OPENAI_API_KEY in your environment before invoking the OpenAI provider.'
      )
    }
  }

  async invoke(request: NormalizedModelRequest): Promise<NormalizedModelResponse> {
    const startMs = Date.now()
    const model = request.model ?? DEFAULT_MODEL

    const messages: OpenAIMessage[] = []
    if (request.systemContext) {
      messages.push({ role: 'system', content: request.systemContext })
    }
    messages.push({ role: 'user', content: request.prompt })

    const body: Record<string, unknown> = {
      model,
      messages,
      max_tokens: request.maxTokens ?? 4096,
      // JSON mode: instructs the model to return valid JSON.
      // The prompt must also mention JSON for this to activate.
      response_format: { type: 'json_object' },
    }

    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => response.statusText)
      throw new Error(`[OPENAI_ADAPTER] Request failed (${response.status}): ${text}`)
    }

    const completion = (await response.json()) as OpenAIChatCompletion

    const choice = completion.choices[0]
    if (!choice?.message?.content) {
      throw new Error('[OPENAI_ADAPTER] No content in response choices')
    }

    return {
      content: choice.message.content,
      model: completion.model,
      tokensUsed: completion.usage.total_tokens,
      latencyMs: Date.now() - startMs,
    }
  }
}
