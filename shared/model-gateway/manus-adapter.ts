import type { ModelProvider } from '@/shared/types'
import type {
  IModelProviderAdapter,
  NormalizedModelRequest,
  NormalizedModelResponse,
} from './types'

/**
 * Manus provider adapter for the Model Gateway.
 *
 * Manus is an autonomous research agent. This adapter maps the normalized
 * gateway request to Manus's async task API — submitting a task and polling
 * until the agent completes its work.
 *
 * API shape:
 *   POST /api/v1/tasks        → { id: string, status: 'queued' }
 *   GET  /api/v1/tasks/:id    → { id, status, result?, error? }
 *
 * Environment variables:
 *   MANUS_API_KEY   — required; Bearer auth token
 *   MANUS_API_URL   — optional; defaults to https://api.manus.im
 *
 * See FOUNDATION_001_ARCHITECTURE.md §6.3 — Provider-Specific Code Boundary.
 */

const DEFAULT_MANUS_URL = 'https://api.manus.im'
const POLL_INTERVAL_MS = 3_000
const POLL_TIMEOUT_MS = 300_000 // 5 minutes

interface ManusTaskCreated {
  id: string
  status: 'queued' | 'running'
}

interface ManusTaskResult {
  id: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  result?: string
  error?: string
  model?: string
  tokensUsed?: number
}

export class ManusAdapter implements IModelProviderAdapter {
  readonly provider: ModelProvider = 'manus'

  private readonly apiKey: string
  private readonly baseUrl: string

  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey ?? process.env.MANUS_API_KEY ?? ''
    this.baseUrl = (baseUrl ?? process.env.MANUS_API_URL ?? DEFAULT_MANUS_URL).replace(/\/$/, '')

    if (!this.apiKey) {
      throw new Error(
        '[MANUS_ADAPTER] MANUS_API_KEY is not set. ' +
          'Set MANUS_API_KEY in your environment before invoking the Manus provider.'
      )
    }
  }

  async invoke(request: NormalizedModelRequest): Promise<NormalizedModelResponse> {
    const startMs = Date.now()

    const task = await this.createTask(request)
    const result = await this.pollForCompletion(task.id)

    if (result.status === 'failed' || result.error) {
      throw new Error(`[MANUS_ADAPTER] Task ${task.id} failed: ${result.error ?? 'unknown error'}`)
    }

    if (!result.result) {
      throw new Error(`[MANUS_ADAPTER] Task ${task.id} completed with no result content`)
    }

    return {
      content: result.result,
      model: result.model ?? 'manus-research-1',
      tokensUsed: result.tokensUsed ?? 0,
      latencyMs: Date.now() - startMs,
    }
  }

  private async createTask(request: NormalizedModelRequest): Promise<ManusTaskCreated> {
    const body: Record<string, unknown> = { task: request.prompt }

    if (request.systemContext) {
      body.systemContext = request.systemContext
    }
    if (request.maxTokens) {
      body.maxTokens = request.maxTokens
    }

    const response = await fetch(`${this.baseUrl}/api/v1/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => response.statusText)
      throw new Error(`[MANUS_ADAPTER] Task creation failed (${response.status}): ${text}`)
    }

    return response.json() as Promise<ManusTaskCreated>
  }

  private async pollForCompletion(taskId: string): Promise<ManusTaskResult> {
    const deadline = Date.now() + POLL_TIMEOUT_MS

    while (Date.now() < deadline) {
      const result = await this.fetchTaskResult(taskId)

      if (result.status === 'completed' || result.status === 'failed') {
        return result
      }

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
    }

    throw new Error(
      `[MANUS_ADAPTER] Task ${taskId} did not complete within ${POLL_TIMEOUT_MS / 1000}s`
    )
  }

  private async fetchTaskResult(taskId: string): Promise<ManusTaskResult> {
    const response = await fetch(`${this.baseUrl}/api/v1/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    })

    if (!response.ok) {
      const text = await response.text().catch(() => response.statusText)
      throw new Error(
        `[MANUS_ADAPTER] Poll failed for task ${taskId} (${response.status}): ${text}`
      )
    }

    return response.json() as Promise<ManusTaskResult>
  }
}
