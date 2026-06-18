import { err, ok } from '@/shared/types'
import { PlatformErrorCode } from '@/shared/types'
import type { OrganizationId, PlatformResult, TenantId } from '@/shared/types'
import type { PlatformContext } from '@/shared/context'

/**
 * Tenant Isolation Guards
 *
 * Reusable, typed guards that enforce the tenant isolation invariants
 * defined in FOUNDATION_001_ARCHITECTURE.md §8.3. Every domain service
 * that retrieves an entity from storage should validate it against the
 * current PlatformContext before returning it to the caller.
 *
 * Using these guards instead of inline checks ensures:
 * - Consistent error codes and messages across the platform
 * - A single place to audit how isolation is enforced
 * - Type narrowing — callers receive the entity with its original type
 *
 * Usage:
 *   const result = await store.get(id)
 *   if (!result) return err(notFound('Widget'))
 *   return guardOrganization(result, ctx, 'Widget')
 *   // → PlatformResult<Widget>; error carries TENANT_ISOLATION_VIOLATION
 *
 * See FOUNDATION_001_ARCHITECTURE.md §8.3 — Tenant Isolation.
 * See FOUNDATION_001_ARCHITECTURE.md §4 — Data Ownership Rules.
 */

// ---------------------------------------------------------------------------
// Tenant boundary guard
// Use when an entity carries tenantId directly.
// ---------------------------------------------------------------------------

/**
 * Verify that the entity's tenantId matches the request context.
 * Returns the entity unchanged on success.
 */
export function guardTenant<T extends { tenantId: TenantId }>(
  entity: T,
  ctx: PlatformContext,
  entityLabel: string
): PlatformResult<T> {
  if (entity.tenantId !== ctx.tenantId) {
    return err({
      code: PlatformErrorCode.TENANT_ISOLATION_VIOLATION,
      message: `${entityLabel} does not belong to the current tenant`,
      context: {
        expected: ctx.tenantId,
        actual: entity.tenantId,
        requestId: ctx.requestId,
      },
    })
  }
  return ok(entity)
}

// ---------------------------------------------------------------------------
// Organization boundary guard
// Use when an entity carries organizationId but not tenantId directly.
// The platform enforces that organizationId is always tenant-scoped at the
// storage layer, so this guard is sufficient for organization-owned entities.
// ---------------------------------------------------------------------------

/**
 * Verify that the entity's organizationId matches the request context.
 * Returns the entity unchanged on success.
 */
export function guardOrganization<T extends { organizationId: OrganizationId }>(
  entity: T,
  ctx: PlatformContext,
  entityLabel: string
): PlatformResult<T> {
  if (entity.organizationId !== ctx.organizationId) {
    return err({
      code: PlatformErrorCode.TENANT_ISOLATION_VIOLATION,
      message: `${entityLabel} does not belong to the current organization`,
      context: {
        expected: ctx.organizationId,
        actual: entity.organizationId,
        requestId: ctx.requestId,
      },
    })
  }
  return ok(entity)
}

// ---------------------------------------------------------------------------
// Standalone assertion helpers (not Result-based)
// Use in middleware and early-exit guards where throwing is appropriate.
// ---------------------------------------------------------------------------

/**
 * Assert that a tenantId matches the context tenant.
 * Throws if mismatched — use only in middleware/bootstrap, not in domain services.
 */
export function assertTenant(tenantId: TenantId, ctx: PlatformContext, label: string): void {
  if (tenantId !== ctx.tenantId) {
    throw new Error(
      `[TENANT_GUARD] ${label}: tenantId "${tenantId}" does not match context tenant "${ctx.tenantId}"`
    )
  }
}

/**
 * Assert that an organizationId matches the context organization.
 * Throws if mismatched — use only in middleware/bootstrap, not in domain services.
 */
export function assertOrganization(
  organizationId: OrganizationId,
  ctx: PlatformContext,
  label: string
): void {
  if (organizationId !== ctx.organizationId) {
    throw new Error(
      `[TENANT_GUARD] ${label}: organizationId "${organizationId}" does not match context organization "${ctx.organizationId}"`
    )
  }
}
