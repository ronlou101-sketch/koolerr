import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IdentityService } from './service.test-helpers'
import type { OrganizationId, TenantId, UserId } from '@/shared/types'
import type { PersistedSession } from './repository'

/**
 * Identity service unit tests.
 *
 * Covers:
 *   1. User management — creation, duplicate rejection
 *   2. Cross-tenant isolation — getUserById rejects access across tenant boundaries
 *   3. Session lifecycle — create, validate, revoke, expiry
 *   4. Membership & roles — addUserToOrganization, duplicate guard, getUserRole
 *   5. API key lifecycle — issue, validate plaintext, revoke, validate revoked
 *
 * The expired-session test saves a past-dated record directly to the repo
 * rather than mocking the clock — the in-memory repo is exposed by the harness
 * for exactly this kind of edge-case setup.
 *
 * All tests use fresh in-memory state; no DB calls, no Supabase client.
 */

vi.mock('@/shared/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), debug: vi.fn(), error: vi.fn() },
}))

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TENANT_A = 'tenant_a' as TenantId
const TENANT_B = 'tenant_b' as TenantId
const ORG_ID = 'org_test' as OrganizationId

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('IdentityService', () => {
  let harness: ReturnType<typeof IdentityService>

  beforeEach(() => {
    harness = IdentityService()
  })

  // -------------------------------------------------------------------------
  describe('createUser', () => {
    it('creates a user with the given tenantId and email', async () => {
      const { service } = harness
      const result = await service.createUser({ tenantId: TENANT_A, email: 'alice@example.com' })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.email).toBe('alice@example.com')
        expect(result.value.tenantId).toBe(TENANT_A)
      }
    })

    it('returns VALIDATION_ERROR for duplicate email within the same tenant', async () => {
      const { service } = harness
      await service.createUser({ tenantId: TENANT_A, email: 'alice@example.com' })
      const second = await service.createUser({ tenantId: TENANT_A, email: 'alice@example.com' })
      expect(second.ok).toBe(false)
      if (!second.ok) expect(second.error.code).toBe('VALIDATION_ERROR')
    })

    it('allows the same email address in a different tenant', async () => {
      const { service } = harness
      await service.createUser({ tenantId: TENANT_A, email: 'shared@example.com' })
      const result = await service.createUser({ tenantId: TENANT_B, email: 'shared@example.com' })
      expect(result.ok).toBe(true)
    })

    it('stores authUserId when provided', async () => {
      const { service } = harness
      const result = await service.createUser({
        tenantId: TENANT_A,
        email: 'alice@example.com',
        authUserId: 'supabase-uuid-123',
      })
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value.authUserId).toBe('supabase-uuid-123')
    })
  })

  // -------------------------------------------------------------------------
  describe('getUserById', () => {
    it('returns the user for a valid id and matching tenant', async () => {
      const { service } = harness
      const created = await service.createUser({ tenantId: TENANT_A, email: 'bob@example.com' })
      if (!created.ok) throw new Error('fixture')
      const result = await service.getUserById(created.value.id, TENANT_A)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value.id).toBe(created.value.id)
    })

    it('returns NOT_FOUND for an unknown user id', async () => {
      const { service } = harness
      const result = await service.getUserById('user_unknown' as UserId, TENANT_A)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.code).toBe('NOT_FOUND')
    })

    it('returns TENANT_ISOLATION_VIOLATION when the user belongs to a different tenant', async () => {
      const { service } = harness
      const created = await service.createUser({ tenantId: TENANT_A, email: 'alice@example.com' })
      if (!created.ok) throw new Error('fixture')
      // Tenant B tries to access Tenant A's user
      const result = await service.getUserById(created.value.id, TENANT_B)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.code).toBe('TENANT_ISOLATION_VIOLATION')
    })
  })

  // -------------------------------------------------------------------------
  describe('createSession', () => {
    it('creates a session for a valid user in the correct tenant', async () => {
      const { service } = harness
      const user = await service.createUser({ tenantId: TENANT_A, email: 'carol@example.com' })
      if (!user.ok) throw new Error('fixture')
      const result = await service.createSession(user.value.id, TENANT_A)
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.userId).toBe(user.value.id)
        expect(result.value.tenantId).toBe(TENANT_A)
        expect(result.value.expiresAt.getTime()).toBeGreaterThan(Date.now())
      }
    })

    it('returns UNAUTHORIZED for an unknown userId', async () => {
      const { service } = harness
      const result = await service.createSession('user_ghost' as UserId, TENANT_A)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.code).toBe('UNAUTHORIZED')
    })

    it('returns TENANT_ISOLATION_VIOLATION when the user belongs to a different tenant', async () => {
      const { service } = harness
      const user = await service.createUser({ tenantId: TENANT_A, email: 'dave@example.com' })
      if (!user.ok) throw new Error('fixture')
      const result = await service.createSession(user.value.id, TENANT_B)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.code).toBe('TENANT_ISOLATION_VIOLATION')
    })
  })

  // -------------------------------------------------------------------------
  describe('validateSession', () => {
    it('returns the session for a valid, unexpired session', async () => {
      const { service } = harness
      const user = await service.createUser({ tenantId: TENANT_A, email: 'eve@example.com' })
      if (!user.ok) throw new Error('fixture')
      const session = await service.createSession(user.value.id, TENANT_A)
      if (!session.ok) throw new Error('fixture')
      const result = await service.validateSession(session.value.id)
      expect(result.ok).toBe(true)
    })

    it('returns UNAUTHORIZED for an unknown session id', async () => {
      const { service } = harness
      const result = await service.validateSession('session_ghost')
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.code).toBe('UNAUTHORIZED')
    })

    it('returns UNAUTHORIZED for a revoked session', async () => {
      const { service } = harness
      const user = await service.createUser({ tenantId: TENANT_A, email: 'frank@example.com' })
      if (!user.ok) throw new Error('fixture')
      const session = await service.createSession(user.value.id, TENANT_A)
      if (!session.ok) throw new Error('fixture')
      await service.revokeSession(session.value.id)
      const result = await service.validateSession(session.value.id)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.code).toBe('UNAUTHORIZED')
    })

    it('returns UNAUTHORIZED for an expired session', async () => {
      const { service, repo } = harness
      // Inject an expired session directly into the repo to avoid mocking the clock.
      const expired: PersistedSession = {
        id: 'session_expired_test',
        userId: 'user_x' as UserId,
        tenantId: TENANT_A,
        expiresAt: new Date(0), // epoch — definitely in the past
        createdAt: new Date(0),
      }
      await repo.saveSession(expired)
      const result = await service.validateSession('session_expired_test')
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.code).toBe('UNAUTHORIZED')
    })
  })

  // -------------------------------------------------------------------------
  describe('revokeSession', () => {
    it('marks the session as revoked so subsequent validation fails', async () => {
      const { service } = harness
      const user = await service.createUser({ tenantId: TENANT_A, email: 'grace@example.com' })
      if (!user.ok) throw new Error('fixture')
      const session = await service.createSession(user.value.id, TENANT_A)
      if (!session.ok) throw new Error('fixture')
      const revokeResult = await service.revokeSession(session.value.id)
      expect(revokeResult.ok).toBe(true)
      const validate = await service.validateSession(session.value.id)
      expect(validate.ok).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  describe('addUserToOrganization / getMemberships / getUserRole', () => {
    it('adds a user as a member with the specified role', async () => {
      const { service } = harness
      const user = await service.createUser({ tenantId: TENANT_A, email: 'henry@example.com' })
      if (!user.ok) throw new Error('fixture')
      const result = await service.addUserToOrganization({
        userId: user.value.id,
        organizationId: ORG_ID,
        role: 'member',
      })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.role).toBe('member')
        expect(result.value.organizationId).toBe(ORG_ID)
      }
    })

    it('returns VALIDATION_ERROR on duplicate membership', async () => {
      const { service } = harness
      const user = await service.createUser({ tenantId: TENANT_A, email: 'iris@example.com' })
      if (!user.ok) throw new Error('fixture')
      await service.addUserToOrganization({
        userId: user.value.id,
        organizationId: ORG_ID,
        role: 'member',
      })
      const second = await service.addUserToOrganization({
        userId: user.value.id,
        organizationId: ORG_ID,
        role: 'owner',
      })
      expect(second.ok).toBe(false)
      if (!second.ok) expect(second.error.code).toBe('VALIDATION_ERROR')
    })

    it('getMemberships returns all memberships for a user', async () => {
      const { service } = harness
      const user = await service.createUser({ tenantId: TENANT_A, email: 'jake@example.com' })
      if (!user.ok) throw new Error('fixture')
      const org2 = 'org_second' as OrganizationId
      await service.addUserToOrganization({
        userId: user.value.id,
        organizationId: ORG_ID,
        role: 'owner',
      })
      await service.addUserToOrganization({
        userId: user.value.id,
        organizationId: org2,
        role: 'member',
      })
      const result = await service.getMemberships(user.value.id)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value).toHaveLength(2)
    })

    it('getUserRole returns the role for a member', async () => {
      const { service } = harness
      const user = await service.createUser({ tenantId: TENANT_A, email: 'kate@example.com' })
      if (!user.ok) throw new Error('fixture')
      await service.addUserToOrganization({
        userId: user.value.id,
        organizationId: ORG_ID,
        role: 'owner',
      })
      const result = await service.getUserRole(user.value.id, ORG_ID)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value).toBe('owner')
    })

    it('getUserRole returns FORBIDDEN for a non-member', async () => {
      const { service } = harness
      const user = await service.createUser({ tenantId: TENANT_A, email: 'leo@example.com' })
      if (!user.ok) throw new Error('fixture')
      const result = await service.getUserRole(user.value.id, ORG_ID)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.code).toBe('FORBIDDEN')
    })
  })

  // -------------------------------------------------------------------------
  describe('issueApiKey / validateApiKey / revokeApiKey', () => {
    it('an issued key validates successfully with the plaintext returned at issuance', async () => {
      const { service } = harness
      const issued = await service.issueApiKey(ORG_ID, 'CI key')
      expect(issued.ok).toBe(true)
      if (!issued.ok) return
      const validated = await service.validateApiKey(issued.value.plaintext)
      expect(validated.ok).toBe(true)
      if (validated.ok) expect(validated.value.organizationId).toBe(ORG_ID)
    })

    it('returns UNAUTHORIZED for an unrecognised key', async () => {
      const { service } = harness
      const result = await service.validateApiKey('koo_totally_fake_key')
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.code).toBe('UNAUTHORIZED')
    })

    it('returns UNAUTHORIZED when validating a revoked key', async () => {
      const { service } = harness
      const issued = await service.issueApiKey(ORG_ID, 'temp key')
      if (!issued.ok) throw new Error('fixture')
      await service.revokeApiKey(issued.value.apiKey.id, ORG_ID)
      const result = await service.validateApiKey(issued.value.plaintext)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.code).toBe('UNAUTHORIZED')
    })
  })
})
