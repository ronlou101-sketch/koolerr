/**
 * Supabase Auth Callback Route
 *
 * Handles the server-side redirect leg of the Supabase Auth flow:
 *   - Email confirmation links
 *   - Magic link sign-ins
 *   - OAuth provider redirects
 *
 * Supabase Auth appends a `code` query parameter to the configured callback
 * URL. This handler exchanges that one-time code for a long-lived session
 * (stored as a cookie), then provisions the platform account if this is the
 * user's first sign-in, and redirects to the intended destination.
 *
 * The `next` query parameter (set by the middleware redirect) lets callers
 * specify where to send the user after a successful callback.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.15 — Identity & Access.
 * See docs/adr/ADR-005-authentication-pattern.md
 */

import { createSessionServerClient } from '@/shared/lib/supabase-session'
import { provisionPlatformAccount } from '@/infrastructure/auth'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createSessionServerClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  // After exchanging the code, the session cookie is now set. Provision the
  // platform account idempotently — this handles the email-confirmation path
  // where the signup page cannot provision because no session existed yet.
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (authUser?.email) {
    // organizationName is not available here; fall back to the default.
    // Users who registered via email-confirmation will see "My Organization"
    // and can rename it later (Phase 2 dashboard).
    const provision = await provisionPlatformAccount(authUser.email, '', authUser.id)
    // Fresh accounts need to complete Brain onboarding; existing users go to the dashboard.
    if (provision.success && !provision.alreadyProvisioned) {
      return NextResponse.redirect(`${origin}/onboarding`)
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
