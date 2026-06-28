/**
 * Next.js Request Middleware
 *
 * Runs on every matched request before the route handler. Responsibilities:
 *
 * 1. Session refresh — keeps the Supabase Auth JWT alive by re-issuing the
 *    session token when it is close to expiry. The updated cookie is written
 *    back to the response via supabaseResponse.
 *
 * 2. Route protection — unauthenticated requests to non-public paths are
 *    redirected to /login. The auth check uses supabase.auth.getUser(), which
 *    validates the session against the Supabase Auth server (not localStorage),
 *    making it immune to token-in-cookie substitution attacks.
 *
 * This middleware intentionally does NOT build a PlatformContext. Context
 * resolution happens in each route handler / Server Component via
 * getRequestPlatformContext() from @/infrastructure/auth. Keeping the
 * middleware lean ensures that a misconfigured or missing PLATFORM_TENANT_ID
 * environment variable does not break every request — only the ones that
 * actually require an authenticated platform context.
 *
 * Public paths: /, /login, /signup. Everything else requires authentication.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.15 — Identity & Access.
 * See FOUNDATION_002_ENGINEERING_PRINCIPLES.md §6.3 — Session Security.
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { env } from '@/shared/config/env'

/** Paths that do not require an authenticated session. */
const PUBLIC_PATHS: string[] = [
  '/',
  '/login',
  '/signup',
  '/auth/callback',
  '/features',
  '/pricing',
  '/privacy',
  '/terms',
  '/contact',
  '/support',
  // Stripe webhook: self-secured via HMAC signature — no session cookie
  '/api/webhooks/stripe',
  // Pre-auth checkout: unauthenticated users completing a Stripe checkout
  '/api/checkout/start',
  '/api/checkout/complete',
  '/api/checkout/set-password',
  '/checkout/success',
  // Password management
  '/forgot-password',
  '/reset-password',
  // Scanner-proof password reset confirmation: token_hash is consumed only on
  // POST (button click), not on GET, so email scanner prefetch cannot invalidate the OTP.
  '/confirm',
]

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Forward the pathname to Server Components via a request header so platform
  // layout can enforce subscription-based access control without a client hook.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', path)

  // Start with a passthrough response. The cookie adapter below replaces this
  // with a new NextResponse whenever Supabase needs to rotate the session cookie.
  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })

  const supabase = createServerClient(env.supabase.url(), env.supabase.anonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        // Step 1: write cookie values back onto the mutated request object so
        // that subsequent Server Component reads in the same request see them.
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        // Step 2: replace the response (preserving the x-pathname header) so
        // the Set-Cookie header reaches the browser.
        supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // IMPORTANT: always use getUser() here, never getSession().
  // getSession() reads from cookies without server-side validation — it can be
  // spoofed by a tampered cookie. getUser() validates against the Auth server.
  const {
    data: { user },
    error: getUserError,
  } = await supabase.auth.getUser()

  if (!user && !isPublicPath(path)) {
    console.log(
      `[MW] unauthenticated request to ${path} (${getUserError?.message ?? 'no user'}) → redirect /login`
    )
    const loginUrl = new URL('/login', request.nextUrl.origin)
    return NextResponse.redirect(loginUrl)
  }

  if (user) {
    console.log(`[MW] authenticated request — user=${user.id} path=${path}`)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Run on all paths except Next.js internals and static assets.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
