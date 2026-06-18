import type { UserId, OrganizationId, TenantId, UserRole } from '@/shared/types'

/**
 * Domain-specific types for the Identity domain.
 * See FOUNDATION_001_ARCHITECTURE.md §3 — Domain Boundaries.
 */

// UserRole is a platform primitive defined in shared/types/platform.ts.
// Re-exported here so existing identity domain consumers continue to work.
export type { UserRole } from '@/shared/types'

export interface User {
  id: UserId
  tenantId: TenantId
  email: string
  createdAt: Date
  updatedAt: Date
}

export interface UserOrganizationMembership {
  userId: UserId
  organizationId: OrganizationId
  role: UserRole
  joinedAt: Date
}

export interface Session {
  id: string
  userId: UserId
  tenantId: TenantId
  expiresAt: Date
  createdAt: Date
}

/** Stored by prefix only. The full key value is never persisted after creation. */
export interface ApiKey {
  id: string
  organizationId: OrganizationId
  name: string
  prefix: string
  createdAt: Date
  expiresAt?: Date
  revokedAt?: Date
}
