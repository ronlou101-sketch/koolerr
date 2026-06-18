/**
 * Platform Guards — Public Interface
 *
 * Shared guards that enforce platform-level invariants. All domain services
 * and application code should use these guards rather than duplicating
 * isolation checks inline.
 *
 * Current guards:
 * - guardTenant(entity, ctx, label) — verify entity.tenantId matches context
 * - guardOrganization(entity, ctx, label) — verify entity.organizationId matches context
 * - assertTenant(tenantId, ctx, label) — throw-on-mismatch for middleware use
 * - assertOrganization(organizationId, ctx, label) — throw-on-mismatch for middleware use
 *
 * See FOUNDATION_001_ARCHITECTURE.md §8.3 — Tenant Isolation.
 */

export { assertOrganization, assertTenant, guardOrganization, guardTenant } from './tenant'
