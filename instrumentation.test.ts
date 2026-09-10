import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const bootstrapPlatform = vi.fn().mockResolvedValue(undefined)

vi.mock('@/infrastructure/platform', () => ({
  bootstrapPlatform: (...args: unknown[]) => bootstrapPlatform(...args),
  isPlatformBootstrapped: vi.fn().mockReturnValue(false),
}))

import { register } from './instrumentation'

describe('instrumentation register() — STRIPE_WEBHOOK_SECRET startup assert', () => {
  const savedNextRuntime = process.env.NEXT_RUNTIME
  const savedWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  beforeEach(() => {
    bootstrapPlatform.mockReset()
    bootstrapPlatform.mockResolvedValue(undefined)
    delete process.env.STRIPE_WEBHOOK_SECRET
    delete process.env.NEXT_RUNTIME
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()

    if (savedNextRuntime === undefined) delete process.env.NEXT_RUNTIME
    else process.env.NEXT_RUNTIME = savedNextRuntime

    if (savedWebhookSecret === undefined) delete process.env.STRIPE_WEBHOOK_SECRET
    else process.env.STRIPE_WEBHOOK_SECRET = savedWebhookSecret
  })

  it('rejects in production Node runtime when STRIPE_WEBHOOK_SECRET is absent', async () => {
    process.env.NEXT_RUNTIME = 'nodejs'
    vi.stubEnv('NODE_ENV', 'production')
    delete process.env.STRIPE_WEBHOOK_SECRET

    let caught: unknown
    try {
      await register()
    } catch (e) {
      caught = e
    }

    expect(caught).toBeInstanceOf(Error)
    const message = (caught as Error).message
    expect(message).toContain('[CONFIG]')
    expect(message).toContain('STRIPE_WEBHOOK_SECRET')
    // Absent secret must never appear in the thrown message.
    expect(message).not.toMatch(/whsec_/i)
    expect(bootstrapPlatform).not.toHaveBeenCalled()
  })

  it('does not throw the [CONFIG] Stripe webhook secret error in non-production Node runtime when secret is unset', async () => {
    process.env.NEXT_RUNTIME = 'nodejs'
    vi.stubEnv('NODE_ENV', 'development')
    delete process.env.STRIPE_WEBHOOK_SECRET

    // Bootstrap may warn/fail (e.g. missing Supabase) — that must not surface as the CONFIG error.
    bootstrapPlatform.mockRejectedValueOnce(new Error('Supabase env vars not set'))

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await expect(register()).resolves.toBeUndefined()
    expect(bootstrapPlatform).toHaveBeenCalledOnce()

    // Must not have thrown; confirm warn path was hit instead of CONFIG fail-fast.
    expect(warnSpy).toHaveBeenCalled()
    const warnText = String(warnSpy.mock.calls[0]?.[0] ?? '')
    expect(warnText).not.toContain('[CONFIG]')
    expect(warnText).not.toContain('STRIPE_WEBHOOK_SECRET')

    warnSpy.mockRestore()
  })
})
