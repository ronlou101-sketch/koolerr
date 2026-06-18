/**
 * Platform Request Context — Public Interface
 *
 * PlatformContext is the identity envelope that flows through every
 * request on the platform. It carries tenantId, organizationId, the
 * authenticated actor, and a request-scoped trace ID.
 *
 * All domain service calls, audit entries, and Trust Engine checks are
 * scoped to the context established at the request boundary.
 *
 * Usage:
 *   const ctx = createPlatformContext({ tenantId, organizationId, actor })
 *   // pass ctx through your Server Components / API handlers / services
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.15 — Identity & Access.
 * See FOUNDATION_001_ARCHITECTURE.md §8.3 — Tenant Isolation.
 */

export type {
  CreatePlatformContextInput,
  PlatformActor,
  PlatformActorApiKey,
  PlatformActorSystem,
  PlatformActorType,
  PlatformActorUser,
  PlatformContext,
} from './types'
export { createPlatformContext } from './types'
