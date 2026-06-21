/**
 * Platform Context Resolution
 *
 * Resolves an authenticated Supabase Auth session or API key bearer token
 * into a fully-typed PlatformContext. This is the authoritative entry point
 * for establishing identity on every server-side request.
 *
 * Two resolution paths:
 *
 * 1. getRequestPlatformContext() — for Server Components, Route Handlers, and
 *    Server Actions. Reads the authenticated session from the request cookies,
 *    looks up the platform user by email, resolves their organization membership
 *    and role, and returns a PlatformContext.
 *
 * 2. getApiKeyPlatformContext() — for machine-to-machine requests. Validates a
 *    `Bearer koo_xxx` token from the Authorization header against the identity
 *    service and returns a PlatformContext scoped to the key's organization.
 *
 * Both functions return null (not an error) when the request is unauthenticated.
 * Callers that require authentication should treat a null return as a 401.
 *
 * Infrastructure placement rationale:
 * This file imports from both @/shared (PlatformContext, env, session client) and
 * @/domains/identity (identityService). The infrastructure/ layer is the only
 * layer permitted to cross this boundary — domain code and shared utilities may
 * not import from each other.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §1.2 — Modular Monolith Philosophy.
 * See FOUNDATION_001_ARCHITECTURE.md §2.15 — Identity & Access.
 * See docs/adr/ADR-005-authentication-pattern.md
 */

import type { OrganizationId, TenantId } from '@/shared/types'
import { createPlatformContext } from '@/shared/context'
import type { PlatformContext } from '@/shared/context'
import { env } from '@/shared/config/env'
import { createSessionServerClient } from '@/shared/lib/supabase-session'
import { identityService } from '@/domains/identity'
import { bootstrapPlatform, isPlatformBootstrapped } from '@/infrastructure/platform'

/**
 * Resolve a PlatformContext from the current request's Supabase Auth session.
 *
 * @param organizationId - The organization to scope the context to. If omitted,
 *   defaults to the user's first organization membership.
 * @param requestId - An optional trace ID (e.g. from X-Request-Id header).
 *   A new UUID is generated if not provided.
 * @returns A PlatformContext, or null if the request is not authenticated or
 *   the authenticated user has no platform account / organization membership.
 */
export async function getRequestPlatformContext(
  organizationId?: OrganizationId,
  requestId?: string
): Promise<PlatformContext | null> {
  // Ensure the platform is bootstrapped within this module's webpack bundle.
  // instrumentation.ts bootstraps a separate bundle at startup; calling this
  // here guarantees _configureIdentityRepository() updates the identityService
  // import that this file and its callers actually use.
  if (!isPlatformBootstrapped()) await bootstrapPlatform()

  const supabase = await createSessionServerClient()

  // getUser() validates the session against the Supabase Auth server.
  // Never use getSession() here — it reads from storage without server validation.
  const {
    data: { user: authUser },
    error: getUserError,
  } = await supabase.auth.getUser()

  if (!authUser?.email) {
    console.log('[RESOLVE] null: no auth session', getUserError?.message ?? '(no error)')
    return null
  }

  const tenantId = env.platform.tenantId() as TenantId

  const userResult = await identityService.getUserByEmail(authUser.email, tenantId)
  if (!userResult.ok) {
    console.log(
      `[RESOLVE] null: platform user not found — email=${authUser.email} tenantId=${tenantId} reason=${userResult.error.message}`
    )
    return null
  }
  const user = userResult.value

  const membershipsResult = await identityService.getMemberships(user.id)
  if (!membershipsResult.ok || membershipsResult.value.length === 0) {
    console.log(
      `[RESOLVE] null: no memberships — userId=${user.id} ok=${membershipsResult.ok} count=${membershipsResult.ok ? membershipsResult.value.length : 'error'}`
    )
    return null
  }
  const memberships = membershipsResult.value

  const resolvedOrgId = organizationId ?? memberships[0].organizationId
  const membership = memberships.find((m) => m.organizationId === resolvedOrgId)
  if (!membership) {
    console.log(`[RESOLVE] null: membership not found for org=${resolvedOrgId}`)
    return null
  }

  return createPlatformContext({
    tenantId,
    organizationId: resolvedOrgId,
    actor: {
      type: 'user',
      userId: user.id,
      // Use the Supabase Auth user UUID as the session reference for audit attribution.
      // This is server-validated and unforgeable.
      sessionId: authUser.id,
      role: membership.role,
    },
    requestId,
  })
}

/**
 * Resolve a PlatformContext from a `Bearer koo_xxx` API key in the
 * Authorization header. Validates the key against the identity service and
 * returns a context scoped to the key's organization.
 *
 * @param authorizationHeader - The raw Authorization header value (or null/undefined).
 * @param requestId - Optional trace ID.
 * @returns A PlatformContext, or null if the header is absent, malformed, or invalid.
 */
export async function getApiKeyPlatformContext(
  authorizationHeader: string | null | undefined,
  requestId?: string
): Promise<PlatformContext | null> {
  if (!authorizationHeader?.startsWith('Bearer koo_')) return null

  const plaintext = authorizationHeader.slice(7) // strip "Bearer "

  const keyResult = await identityService.validateApiKey(plaintext)
  if (!keyResult.ok) return null
  const apiKey = keyResult.value

  const tenantId = env.platform.tenantId() as TenantId

  return createPlatformContext({
    tenantId,
    organizationId: apiKey.organizationId,
    actor: {
      type: 'api_key',
      keyId: apiKey.id,
      organizationId: apiKey.organizationId,
    },
    requestId,
  })
}
