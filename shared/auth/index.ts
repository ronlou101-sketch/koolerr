/**
 * Shared Auth Utilities — Public Interface
 *
 * Exports synchronous RBAC primitives that are safe to use anywhere on the
 * server side (Server Components, Route Handlers, domain services).
 *
 * For session-to-PlatformContext resolution (which requires infrastructure/
 * imports from both shared/ and domains/), see @/infrastructure/auth instead.
 */

export { hasMinimumRole, requireRole } from './rbac'
