/**
 * Supabase Browser Client Factory
 *
 * Returns a singleton Supabase client for use in Client Components.
 * Uses createBrowserClient from @supabase/ssr so that the client automatically
 * manages auth session cookies — required for session continuity with the
 * server-side session client introduced in Phase 11.
 *
 * Not for use in Server Components or Route Handlers.
 * For server-side session-scoped access use createSessionServerClient()
 * from @/shared/lib/supabase-session.
 * For service-role server access use createServerSupabaseClient()
 * from @/shared/lib/supabase-server.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.15 — Identity & Access.
 */

import { createBrowserClient } from '@supabase/ssr'
import { env } from '@/shared/config/env'
import type { SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    _client = createBrowserClient(env.supabase.url(), env.supabase.anonKey())
  }
  return _client
}
