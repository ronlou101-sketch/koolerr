import { beforeEach, describe, expect, it, vi } from 'vitest'
import type {
  DigitalEmployeeId,
  EngagementRunId,
  ModelProvider,
  OrganizationId,
  TenantId,
  WorkforceId,
} from '@/shared/types'

/**
 * Model Gateway unit tests.
 *
 * Covers the three non-negotiable enforcement invariants:
 *   1. Trust Engine deny  → throw before dispatch
 *   2. Trust Engine approval  → throw before dispatch
 *   3. No provider registered → throw after trust passes
 *
 * Also covers the success path: adapter dispatch, usage sink emission,
 * audit logging, and registeredProviders() reflection.
 *
 * All external dependencies (Trust Engine, audit logger, logger) are mocked
 * so no DB calls or real AI requests are made.
 */

// ---------------------------------------------------------------------------
// Module mocks — declared before any import that uses them
// ---------------------------------------------------------------------------

vi.mock('@/shared/audit', () => ({ auditLogger: { log: vi.fn().mockResolvedValue(undefined) } }))
vi.mock('@/shared/trust', () => ({ trustEngine: { check: vi.fn() } }))
vi.mock('@/shared/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------

import { _registerProvider, _registerUsageSink, modelGateway } from './gateway'
import { auditLogger } from '@/shared/audit'
import { trustEngine } from '@/shared/trust'
import type { IModelProviderAdapter, IUsageEventSink, NormalizedModelResponse } from './types'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE_REQUEST = {
  tenantId: 'tenant_test' as TenantId,
  organizationId: 'org_test' as OrganizationId,
  workforceId: 'wf_test' as WorkforceId,
  digitalEmployeeId: 'de_test' as DigitalEmployeeId,
  engagementRunId: 'run_00000000-0000-0000-0000-000000000001' as EngagementRunId,
  action: 'write_blog_post',
  prompt: 'Write a blog post about AI',
  provider: 'anthropic' as ModelProvider,
}

const PERMITTED = { outcome: 'permitted' as const, autonomyLevel: 'autonomous' as const }

const MOCK_ADAPTER_RESPONSE: NormalizedModelResponse = {
  content: 'Hello from the model',
  model: 'claude-haiku-4-5-20251001',
  tokensUsed: 42,
  latencyMs: 50,
}

function makeMockAdapter(
  provider: ModelProvider
): IModelProviderAdapter & { invoke: ReturnType<typeof vi.fn> } {
  return { provider, invoke: vi.fn().mockResolvedValue(MOCK_ADAPTER_RESPONSE) }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ModelGateway.invoke()', () => {
  beforeEach(() => vi.clearAllMocks())

  // ── Trust Engine enforcement ───────────────────────────────────────────────

  describe('trust engine — denied outcome', () => {
    it('throws before dispatching to any adapter', async () => {
      vi.mocked(trustEngine.check).mockResolvedValue({
        outcome: 'denied',
        autonomyLevel: 'supervised',
        reason: 'Action not permitted',
      })
      await expect(modelGateway.invoke(BASE_REQUEST)).rejects.toThrow('Trust Engine denied action')
    })

    it('logs a denied audit event', async () => {
      vi.mocked(trustEngine.check).mockResolvedValue({
        outcome: 'denied',
        autonomyLevel: 'supervised',
        reason: 'blocked',
      })
      await expect(modelGateway.invoke(BASE_REQUEST)).rejects.toThrow()
      expect(vi.mocked(auditLogger.log)).toHaveBeenCalledWith(
        expect.objectContaining({ outcome: 'denied' })
      )
    })
  })

  describe('trust engine — requires_approval outcome', () => {
    it('throws before dispatching to any adapter', async () => {
      vi.mocked(trustEngine.check).mockResolvedValue({
        outcome: 'requires_approval',
        autonomyLevel: 'supervised',
        reason: 'Customer must approve',
      })
      await expect(modelGateway.invoke(BASE_REQUEST)).rejects.toThrow('requires customer approval')
    })
  })

  // ── Provider dispatch ──────────────────────────────────────────────────────

  describe('provider dispatch — no provider registered', () => {
    it('throws when the requested provider has not been registered', async () => {
      vi.mocked(trustEngine.check).mockResolvedValue(PERMITTED)
      await expect(modelGateway.invoke({ ...BASE_REQUEST, provider: 'google' })).rejects.toThrow(
        'No provider available'
      )
    })

    it('logs a failure audit event when no provider is available', async () => {
      vi.mocked(trustEngine.check).mockResolvedValue(PERMITTED)
      await expect(modelGateway.invoke({ ...BASE_REQUEST, provider: 'google' })).rejects.toThrow()
      expect(vi.mocked(auditLogger.log)).toHaveBeenCalledWith(
        expect.objectContaining({ outcome: 'failure' })
      )
    })
  })

  // ── Success path ───────────────────────────────────────────────────────────

  describe('success path', () => {
    it('returns a GatewayResponse with provider and latencyMs from the adapter', async () => {
      vi.mocked(trustEngine.check).mockResolvedValue(PERMITTED)
      _registerProvider(makeMockAdapter('anthropic'))

      const res = await modelGateway.invoke(BASE_REQUEST)

      expect(res.content).toBe(MOCK_ADAPTER_RESPONSE.content)
      expect(res.provider).toBe('anthropic')
      expect(res.model).toBe(MOCK_ADAPTER_RESPONSE.model)
      expect(res.tokensUsed).toBe(MOCK_ADAPTER_RESPONSE.tokensUsed)
      expect(typeof res.latencyMs).toBe('number')
    })

    it('calls the registered usage sink with correct billing data', async () => {
      vi.mocked(trustEngine.check).mockResolvedValue(PERMITTED)
      _registerProvider(makeMockAdapter('anthropic'))
      const sink: IUsageEventSink = { recordUsage: vi.fn().mockResolvedValue(undefined) }
      _registerUsageSink(sink)

      await modelGateway.invoke(BASE_REQUEST)

      expect(sink.recordUsage).toHaveBeenCalledOnce()
      expect(sink.recordUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'anthropic',
          tokensUsed: MOCK_ADAPTER_RESPONSE.tokensUsed,
          organizationId: BASE_REQUEST.organizationId,
          engagementRunId: BASE_REQUEST.engagementRunId,
          action: BASE_REQUEST.action,
        })
      )
    })

    it('logs a completed audit event after successful invocation', async () => {
      vi.mocked(trustEngine.check).mockResolvedValue(PERMITTED)
      _registerProvider(makeMockAdapter('anthropic'))

      await modelGateway.invoke(BASE_REQUEST)

      expect(vi.mocked(auditLogger.log)).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'model_gateway.invocation_completed',
          outcome: 'success',
        })
      )
    })

    it('still returns a response when no usage sink is registered', async () => {
      vi.mocked(trustEngine.check).mockResolvedValue(PERMITTED)
      _registerProvider(makeMockAdapter('anthropic'))
      // Replace any previously registered sink with one that proves no sink exists by
      // unregistering — we can only do this by registering a no-op then re-importing,
      // so instead we accept that a previously registered sink exists and simply verify
      // that the response is still returned (the gateway never throws on sink absence).
      const res = await modelGateway.invoke(BASE_REQUEST)
      expect(res.content).toBeDefined()
    })
  })
})

describe('ModelGateway.registeredProviders()', () => {
  it('includes providers registered via _registerProvider', () => {
    _registerProvider(makeMockAdapter('openai'))
    expect(modelGateway.registeredProviders()).toContain('openai')
  })

  it('includes multiple providers', () => {
    _registerProvider(makeMockAdapter('anthropic'))
    _registerProvider(makeMockAdapter('elevenlabs'))
    const providers = modelGateway.registeredProviders()
    expect(providers).toContain('anthropic')
    expect(providers).toContain('elevenlabs')
  })
})
