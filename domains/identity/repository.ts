import type { OrganizationId, TenantId, UserId } from '@/shared/types'
import type { ApiKey, Session, User, UserOrganizationMembership } from './types'

/**
 * Identity Repository Interface
 *
 * Declares the storage contract for the Identity domain.
 * The service depends on this interface; implementations (Supabase, in-memory)
 * satisfy it independently.
 *
 * All find methods return null when the entity does not exist.
 * All save methods return the persisted entity.
 * All methods throw on storage errors — callers wrap in PlatformResult.
 *
 * Security note: API keys are stored by their SHA-256 hash, never as plaintext.
 * hashApiKey() in this module provides the canonical hashing function.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.15 — Identity & Access.
 * See docs/adr/ADR-004-repository-pattern.md.
 */

// ---------------------------------------------------------------------------
// Extended row types — internal to the repository layer
// ---------------------------------------------------------------------------

/**
 * Persisted session — extends the public Session type with the revocation
 * timestamp that is never exposed through the service interface.
 */
export interface PersistedSession extends Session {
  revokedAt?: Date
}

/**
 * Persisted API key — extends the public ApiKey type with the key hash.
 * The hash is computed from the full plaintext key using SHA-256.
 * The plaintext value is NEVER persisted — it is shown once at issuance.
 */
export interface PersistedApiKey extends ApiKey {
  /** SHA-256 hex digest of the full API key value. Used for validation. */
  keyHash: string
}

// ---------------------------------------------------------------------------
// Hash utility
// ---------------------------------------------------------------------------

/**
 * Compute the canonical SHA-256 hash of a plaintext API key.
 * Used at issuance and at validation — the same function on both sides.
 */
export async function hashApiKey(plaintext: string): Promise<string> {
  const data = new TextEncoder().encode(plaintext)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// ---------------------------------------------------------------------------
// Repository interface
// ---------------------------------------------------------------------------

export interface IIdentityRepository {
  // Users
  saveUser(user: User): Promise<User>
  findUserById(id: UserId): Promise<User | null>
  findUserByEmail(email: string, tenantId: TenantId): Promise<User | null>

  // Sessions
  saveSession(session: PersistedSession): Promise<PersistedSession>
  findSessionById(id: string): Promise<PersistedSession | null>

  // Organization memberships
  saveMembership(membership: UserOrganizationMembership): Promise<UserOrganizationMembership>
  findMembershipsByUser(userId: UserId): Promise<UserOrganizationMembership[]>
  findMembership(
    userId: UserId,
    organizationId: OrganizationId
  ): Promise<UserOrganizationMembership | null>

  // API keys — stored by hash; plaintext is never persisted
  saveApiKey(key: PersistedApiKey): Promise<PersistedApiKey>
  findApiKeyById(id: string): Promise<PersistedApiKey | null>
  findApiKeyByHash(keyHash: string): Promise<PersistedApiKey | null>
}
