import type { OrganizationId, TenantId, UserId } from '@/shared/types'

/**
 * Platform Request Context
 *
 * PlatformContext is the identity envelope that flows through every
 * request on the platform. It carries who is acting (tenantId, userId)
 * and on whose behalf (organizationId), and is the single source of truth
 * for tenant isolation in the application layer.
 *
 * All domain service calls, audit log entries, and Trust Engine checks
 * are scoped to the context established at the request boundary.
 *
 * The context is created once per request (in middleware or route handler)
 * and passed down through the call chain. It is never modified after creation.
 *
 * The context does not contain credentials, tokens, or secrets — it contains
 * only the verified, resolved identity for the current request. Verification
 * (session validation, API key resolution) happens before the context is
 * created, in the identity layer.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.15 — Identity & Access.
 * See FOUNDATION_001_ARCHITECTURE.md §8.3 — Tenant Isolation.
 */

// ---------------------------------------------------------------------------
// Actor — who is making the request
// ---------------------------------------------------------------------------

export type PlatformActorType = 'user' | 'api_key' | 'system'

export interface PlatformActorUser {
  type: 'user'
  userId: UserId
  sessionId: string
}

export interface PlatformActorApiKey {
  type: 'api_key'
  /** The API key ID (not the plaintext key). */
  keyId: string
  organizationId: OrganizationId
}

export interface PlatformActorSystem {
  type: 'system'
  /** Service or process name for audit attribution. */
  serviceId: string
}

export type PlatformActor = PlatformActorUser | PlatformActorApiKey | PlatformActorSystem

// ---------------------------------------------------------------------------
// Platform Context
// ---------------------------------------------------------------------------

export interface PlatformContext {
  /** Root of all platform security. Every query and action is scoped here. */
  readonly tenantId: TenantId
  /** The Organization this request is operating within. */
  readonly organizationId: OrganizationId
  /** Who initiated this request. */
  readonly actor: PlatformActor
  /** Opaque trace ID for correlating audit log entries across a single request. */
  readonly requestId: string
}

// ---------------------------------------------------------------------------
// Context factory
// ---------------------------------------------------------------------------

export interface CreatePlatformContextInput {
  tenantId: TenantId
  organizationId: OrganizationId
  actor: PlatformActor
  /** Provide an existing trace ID (e.g. from an upstream X-Request-Id header). */
  requestId?: string
}

/**
 * Create a PlatformContext for the current request.
 *
 * Generates a requestId if none is provided. The caller is responsible
 * for ensuring tenantId and organizationId have been verified against the
 * authenticated session before constructing the context.
 */
export function createPlatformContext(input: CreatePlatformContextInput): PlatformContext {
  return {
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    actor: input.actor,
    requestId: input.requestId ?? `req_${crypto.randomUUID()}`,
  }
}
