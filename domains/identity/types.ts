import type { UserId, OrganizationId, TenantId } from '@/shared/types'

/**
 * Domain-specific types for the Identity domain.
 * See FOUNDATION_001_ARCHITECTURE.md §3 — Domain Boundaries.
 */

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer'

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
