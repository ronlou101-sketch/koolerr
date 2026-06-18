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
    const { bootstrapPlatform } = await import('@/infrastructure/platform')
    try {
      bootstrapPlatform()
    } catch (e) {
      // In environments where Supabase env vars are not set (e.g. CI build),
      // bootstrap is skipped and services fall back to in-memory repositories.
      console.warn('[PLATFORM] Bootstrap skipped — env vars may not be set:', String(e))
    }
  }
}
