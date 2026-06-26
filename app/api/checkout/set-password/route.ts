/**
 * POST /api/checkout/set-password
 *
 * Public route — no authentication required.
 * Body: { password: string }
 *
 * Sets the password on a Supabase Auth user that was created (password-less,
 * email confirmed) during the checkout provisioning flow. Authorization is
 * established via the pending_password_setup httpOnly cookie set by
 * /api/checkout/complete — the cookie carries the Supabase Auth user ID and
 * expires after 30 minutes.
 *
 * On success, clears the cookie. The client then calls
 * supabase.auth.signInWithPassword to complete sign-in.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/shared/lib/supabase-server'
import { logger } from '@/shared/lib/logger'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  // Validate authorization cookie set by /api/checkout/complete.
  const authUserId = request.cookies.get('pending_password_setup')?.value
  if (!authUserId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: { password?: unknown }
  try {
    body = (await request.json()) as { password?: unknown }
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const { password } = body
  if (typeof password !== 'string' || password.length < 8) {
    return NextResponse.json(
      { error: 'password_too_short', message: 'Password must be at least 8 characters' },
      { status: 422 }
    )
  }

  const adminClient = createServerSupabaseClient()

  const { error } = await adminClient.auth.admin.updateUserById(authUserId, { password })
  if (error) {
    logger.warn('[SET_PASSWORD] updateUserById failed', { error: error.message })
    return NextResponse.json(
      { error: 'set_password_failed', message: error.message },
      { status: 500 }
    )
  }

  logger.info('[SET_PASSWORD] Password set successfully', { authUserId })

  const response = NextResponse.json({ success: true })
  // Clear the one-time authorization cookie.
  response.cookies.set('pending_password_setup', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  })
  return response
}
