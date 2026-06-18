import Anthropic from '@anthropic-ai/sdk'
import type { ModelProvider } from '@/shared/types'
import type {
  IModelProviderAdapter,
  NormalizedModelRequest,
  NormalizedModelResponse,
} from './types'

/**
 * Anthropic provider adapter for the Model Gateway.
 *
 * Translates NormalizedModelRequest ↔ Anthropic Messages API.
 * No Anthropic types or imports ever leave this file — only the normalized
 * interfaces defined in shared/model-gateway/types.ts are exposed.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §6.3 — Provider-Specific Code Boundary.
 */
export class AnthropicAdapter implements IModelProviderAdapter {
  readonly provider: ModelProvider = 'anthropic'

  private readonly client: Anthropic

  constructor(apiKey?: string) {
    this.client = new Anthropic({ apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY })
  }

  async invoke(request: NormalizedModelRequest): Promise<NormalizedModelResponse> {
    const model = request.model ?? 'claude-haiku-4-5-20251001'
    const maxTokens = request.maxTokens ?? 2048
    const startMs = Date.now()

    const createParams: Anthropic.Messages.MessageCreateParamsNonStreaming = {
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: request.prompt }],
    }

    if (request.systemContext) {
      createParams.system = request.systemContext
    }

    const message = await this.client.messages.create(createParams)

    const firstBlock = message.content[0]
    if (!firstBlock || firstBlock.type !== 'text') {
      throw new Error('[ANTHROPIC_ADAPTER] Expected text content block in response')
    }

    return {
      content: firstBlock.text,
      model: message.model,
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
      latencyMs: Date.now() - startMs,
    }
  }
}
