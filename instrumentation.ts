/**
 * Next.js Instrumentation
 *
 * Called once at server startup before any requests are handled.
 * Bootstraps the platform: wires all Supabase repository implementations,
 * registers the billing usage sink with the Model Gateway, and logs the
 * platform initialization status.
 *
 * Guarded by `process.env.NEXT_RUNTIME === 'nodejs'` so it only runs in
 * the Node.js server runtime — not during Edge Runtime execution or static
 * generation, where the service-role key and Supabase client are unavailable.
 *
 * See infrastructure/platform/bootstrap.ts for the full bootstrap sequence.
 * See FOUNDATION_001_ARCHITECTURE.md §1.2 — Modular Monolith Philosophy.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Phase 7.5: fail fast in production if the Stripe webhook signing secret
    // is missing. Dev/test must stay unblocked — do not call the required
    // accessor unless NODE_ENV is production.
    if (process.env.NODE_ENV === 'production') {
      const { env } = await import('@/shared/config/env')
      try {
        env.stripe.webhookSecret()
      } catch {
        throw new Error(
          '[CONFIG] STRIPE_WEBHOOK_SECRET is required in production but is not set. ' +
            'Set the Stripe webhook signing secret before starting the server.'
        )
      }
    }

    const { bootstrapPlatform } = await import('@/infrastructure/platform')
    try {
      await bootstrapPlatform()
    } catch (e) {
      // In environments where Supabase env vars are not set (e.g. CI build),
      // bootstrap is skipped and services fall back to in-memory repositories.
      console.warn('[PLATFORM] Bootstrap skipped — env vars may not be set:', String(e))
    }
  }
}
