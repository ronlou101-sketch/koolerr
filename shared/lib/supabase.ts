/**
 * Supabase Browser Client Factory
 *
 * Returns a singleton Supabase client for use in Client Components.
 * The client is not instantiated until first call — no connection is
 * made until NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 * are set in .env.local.
 *
 * Usage:
 *   import { getSupabaseClient } from '@/shared/lib/supabase'
 *   const supabase = getSupabaseClient()
 *
 * Not for use in Server Components or Route Handlers.
 * A server-side client using @supabase/ssr will be added when Supabase
 * is connected to the project in a future phase.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.1 — Tenant (on isolation requirements
 * that the server client must enforce via RLS).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/shared/config/env'

let _client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(env.supabase.url(), env.supabase.anonKey())
  }
  return _client
}
