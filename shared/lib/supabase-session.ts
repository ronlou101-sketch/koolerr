/**
 * Session-Scoped Supabase Server Client Factory
 *
 * Creates a Supabase client bound to the current request's auth session cookies.
 * Used in Server Components, Route Handlers, and Server Actions to make
 * authenticated requests on behalf of the signed-in user.
 *
 * Unlike the service-role client (supabase-server.ts), this client uses the
 * anon key and relies on the user's JWT for authorization. Row-Level Security
 * is enforced automatically once the Supabase Auth JWT hook is configured to
 * include the `tenant_id` claim (a post-Phase-11 step).
 *
 * Must be called inside a request context — cookies() from next/headers
 * requires a Server Component, Route Handler, or Server Action scope.
 *
 * For browser (Client Component) usage, see getSupabaseClient() in supabase.ts.
 * For admin/service operations, see createServerSupabaseClient() in supabase-server.ts.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §8.1 — Row-Level Security.
 * See FOUNDATION_001_ARCHITECTURE.md §2.15 — Identity & Access.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { env } from '@/shared/config/env'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function createSessionServerClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies()

  return createServerClient(env.supabase.url(), env.supabase.anonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // setAll is a no-op in Server Components — cookies can only be
          // mutated in Route Handlers, Server Actions, and middleware.
        }
      },
    },
  })
}
