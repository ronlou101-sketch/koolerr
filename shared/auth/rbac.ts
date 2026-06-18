/**
 * Role-Based Access Control
 *
 * Pure, synchronous RBAC enforcement for Platform requests. Checks whether the
 * authenticated actor in a PlatformContext holds at least the required role for
 * the current organization.
 *
 * Role hierarchy (lowest → highest):
 *   viewer < member < admin < owner
 *
 * Design rationale:
 * - Role is embedded in PlatformActorUser at context-creation time (resolved
 *   from the organization membership during session → context resolution).
 *   This means requireRole() needs no database round-trip — it reads the
 *   already-resolved role from ctx.actor.
 * - API key actors do not have roles (they are org-scoped service credentials).
 *   Endpoints that require a minimum human role must reject api_key actors.
 * - System actors bypass role checks — they are internal service calls.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.15 — Identity & Access.
 * See FOUNDATION_002_ENGINEERING_PRINCIPLES.md §6 — Security & Auth.
 */

import { PlatformErrorCode, err, ok } from '@/shared/types'
import type { PlatformResult, UserRole } from '@/shared/types'
import type { PlatformActorUser, PlatformContext } from '@/shared/context'

const ROLE_ORDER: Record<UserRole, number> = {
  viewer: 0,
  member: 1,
  admin: 2,
  owner: 3,
}

/**
 * Assert that the actor holds at least minimumRole in the current organization.
 *
 * Returns ok(undefined) if the check passes.
 * Returns err(FORBIDDEN) if the actor's role is insufficient.
 * Returns err(FORBIDDEN) if the actor is an api_key (no role hierarchy applies).
 *
 * System actors always pass — they are internal service calls operating outside
 * the user permission model.
 */
export function requireRole(ctx: PlatformContext, minimumRole: UserRole): PlatformResult<void> {
  const { actor } = ctx

  if (actor.type === 'system') {
    return ok(undefined)
  }

  if (actor.type === 'api_key') {
    return err({
      code: PlatformErrorCode.FORBIDDEN,
      message: 'This action requires a user session, not an API key',
    })
  }

  const userActor = actor as PlatformActorUser
  if (ROLE_ORDER[userActor.role] < ROLE_ORDER[minimumRole]) {
    return err({
      code: PlatformErrorCode.FORBIDDEN,
      message: `This action requires at least the '${minimumRole}' role`,
    })
  }

  return ok(undefined)
}

/**
 * Boolean predicate form of requireRole. Useful for conditional rendering
 * in Server Components where the full PlatformResult is not needed.
 */
export function hasMinimumRole(ctx: PlatformContext, minimumRole: UserRole): boolean {
  return requireRole(ctx, minimumRole).ok
}
