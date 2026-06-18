/**
 * Server-Side Supabase Client Factory
 *
 * Returns a Supabase client suitable for use inside repository implementations
 * running on the server (Server Components, Route Handlers, Server Actions).
 *
 * This client uses the SERVICE ROLE KEY, which bypasses Row-Level Security.
 * It is used exclusively in repository implementations during Phase 10, where
 * requests are not yet authenticated with a user session.
 *
 * Security contract:
 * - This client MUST NOT be used in Client Components or passed to the browser.
 * - Tenant isolation during Phase 10 is enforced at the application layer by
 *   the domain services (via guardTenant / guardOrganization) and by explicit
 *   organizationId/tenantId scoping in every WHERE clause.
 * - Phase 11 will introduce session-based clients (via @supabase/ssr) that
 *   enforce RLS automatically through the authenticated user's JWT. At that
 *   point, the service role client will be limited to administrative operations.
 *
 * A new client instance is created per call — Supabase JS v2 clients are
 * lightweight and stateless; singleton caching is handled at the repository
 * layer if desired.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §8.1 — Row-Level Security.
 * See FOUNDATION_001_ARCHITECTURE.md §8.4 — Secrets Management.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/shared/config/env'

/**
 * Create a server-side Supabase client using the service role key.
 * Call once per repository instantiation.
 */
export function createServerSupabaseClient(): SupabaseClient {
  return createClient(env.supabase.url(), env.supabase.serviceRoleKey(), {
    auth: {
      // Disable session persistence — this is a server-side client
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
