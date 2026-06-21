import { err, ok } from '@/shared/types'
import { PlatformErrorCode } from '@/shared/types'
import type { Organization, OrganizationId, PlatformResult, TenantId, UserId } from '@/shared/types'
import { logger } from '@/shared/lib/logger'
import type { ApiKey, Session, User, UserOrganizationMembership, UserRole } from './types'
import type { IIdentityRepository, PersistedApiKey, PersistedSession } from './repository'
import { hashApiKey } from './repository'
import { InMemoryIdentityRepository } from './in-memory-repository'

/**
 * Identity Domain Service Interface & Stub
 *
 * The Identity domain owns user management, session lifecycle, role-based
 * access control, and API key management. It is the entry point for all
 * authentication and authorization on the platform.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §3 — Domain Boundaries (identity).
 */

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface CreateOrganizationInput {
  tenantId: TenantId
  name: string
}

export interface CreateUserInput {
  tenantId: TenantId
  email: string
  /** Supabase Auth UUID — populates auth_user_id so the JWT hook can resolve tenant_id. */
  authUserId?: string
}

export interface AddMemberInput {
  userId: UserId
  organizationId: OrganizationId
  role: UserRole
}

export interface IssueApiKeyResult {
  /** The persisted key record. Only the prefix is stored — never the full key. */
  apiKey: ApiKey
  /** The full plaintext key. Shown once. Never retrievable again. */
  plaintext: string
}

// ---------------------------------------------------------------------------
// Identity service interface
// ---------------------------------------------------------------------------

export interface IIdentityService {
  // Organizations
  createOrganization(input: CreateOrganizationInput): Promise<PlatformResult<Organization>>
  findOrganizationById(organizationId: OrganizationId): Promise<PlatformResult<Organization>>

  // Users
  createUser(input: CreateUserInput): Promise<PlatformResult<User>>
  getUserById(userId: UserId, tenantId: TenantId): Promise<PlatformResult<User>>
  getUserByEmail(email: string, tenantId: TenantId): Promise<PlatformResult<User>>

  // Sessions
  createSession(userId: UserId, tenantId: TenantId): Promise<PlatformResult<Session>>
  validateSession(sessionId: string): Promise<PlatformResult<Session>>
  revokeSession(sessionId: string): Promise<PlatformResult<void>>

  // Organization membership & roles
  addUserToOrganization(input: AddMemberInput): Promise<PlatformResult<UserOrganizationMembership>>
  getMemberships(userId: UserId): Promise<PlatformResult<UserOrganizationMembership[]>>
  getUserRole(userId: UserId, organizationId: OrganizationId): Promise<PlatformResult<UserRole>>

  // API keys
  issueApiKey(
    organizationId: OrganizationId,
    name: string
  ): Promise<PlatformResult<IssueApiKeyResult>>
  revokeApiKey(keyId: string, organizationId: OrganizationId): Promise<PlatformResult<void>>
  validateApiKey(plaintext: string): Promise<PlatformResult<ApiKey>>
}

// ---------------------------------------------------------------------------
// Service implementation
// ---------------------------------------------------------------------------

const SESSION_TTL_MS = 24 * 60 * 60 * 1000

export class IdentityService implements IIdentityService {
  constructor(private readonly repo: IIdentityRepository) {}

  async createOrganization(input: CreateOrganizationInput): Promise<PlatformResult<Organization>> {
    try {
      const organization: Organization = {
        id: `org_${crypto.randomUUID()}` as OrganizationId,
        tenantId: input.tenantId,
        name: input.name,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      await this.repo.saveOrganization(organization)
      logger.info('[IDENTITY] Organization created', { tenantId: input.tenantId })
      return ok(organization)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async findOrganizationById(
    organizationId: OrganizationId
  ): Promise<PlatformResult<Organization>> {
    try {
      const org = await this.repo.findOrganizationById(organizationId)
      if (!org) return err({ code: PlatformErrorCode.NOT_FOUND, message: 'Organization not found' })
      return ok(org)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async createUser(input: CreateUserInput): Promise<PlatformResult<User>> {
    try {
      const existing = await this.repo.findUserByEmail(input.email, input.tenantId)
      if (existing) {
        return err({
          code: PlatformErrorCode.VALIDATION_ERROR,
          message: 'A user with this email already exists in this tenant',
        })
      }

      const user: User = {
        id: `user_${crypto.randomUUID()}` as UserId,
        tenantId: input.tenantId,
        email: input.email,
        authUserId: input.authUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await this.repo.saveUser(user)
      logger.info('[IDENTITY] User created', { tenantId: input.tenantId })
      return ok(user)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async getUserById(userId: UserId, tenantId: TenantId): Promise<PlatformResult<User>> {
    try {
      const user = await this.repo.findUserById(userId)
      if (!user) return err({ code: PlatformErrorCode.NOT_FOUND, message: 'User not found' })
      if (user.tenantId !== tenantId) {
        return err({
          code: PlatformErrorCode.TENANT_ISOLATION_VIOLATION,
          message: 'User does not belong to this tenant',
        })
      }
      return ok(user)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async getUserByEmail(email: string, tenantId: TenantId): Promise<PlatformResult<User>> {
    try {
      const user = await this.repo.findUserByEmail(email, tenantId)
      if (!user) return err({ code: PlatformErrorCode.NOT_FOUND, message: 'User not found' })
      return ok(user)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async createSession(userId: UserId, tenantId: TenantId): Promise<PlatformResult<Session>> {
    try {
      const user = await this.repo.findUserById(userId)
      if (!user) return err({ code: PlatformErrorCode.UNAUTHORIZED, message: 'User not found' })
      if (user.tenantId !== tenantId) {
        return err({
          code: PlatformErrorCode.TENANT_ISOLATION_VIOLATION,
          message: 'User does not belong to this tenant',
        })
      }

      const session: PersistedSession = {
        id: `session_${crypto.randomUUID()}`,
        userId,
        tenantId,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        createdAt: new Date(),
      }

      await this.repo.saveSession(session)
      logger.debug('[IDENTITY] Session created', { tenantId })

      const { revokedAt: _r, ...publicSession } = session
      return ok(publicSession)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async validateSession(sessionId: string): Promise<PlatformResult<Session>> {
    try {
      const session = await this.repo.findSessionById(sessionId)
      if (!session)
        return err({ code: PlatformErrorCode.UNAUTHORIZED, message: 'Session not found' })
      if (session.revokedAt) {
        return err({ code: PlatformErrorCode.UNAUTHORIZED, message: 'Session has been revoked' })
      }
      if (session.expiresAt <= new Date()) {
        return err({ code: PlatformErrorCode.UNAUTHORIZED, message: 'Session has expired' })
      }
      const { revokedAt: _r, ...publicSession } = session
      return ok(publicSession)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async revokeSession(sessionId: string): Promise<PlatformResult<void>> {
    try {
      const session = await this.repo.findSessionById(sessionId)
      if (!session) return err({ code: PlatformErrorCode.NOT_FOUND, message: 'Session not found' })
      await this.repo.saveSession({ ...session, revokedAt: new Date() })
      return ok(undefined)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async addUserToOrganization(
    input: AddMemberInput
  ): Promise<PlatformResult<UserOrganizationMembership>> {
    try {
      const existing = await this.repo.findMembership(input.userId, input.organizationId)
      if (existing) {
        return err({
          code: PlatformErrorCode.VALIDATION_ERROR,
          message: 'User is already a member of this organization',
        })
      }

      const membership: UserOrganizationMembership = {
        userId: input.userId,
        organizationId: input.organizationId,
        role: input.role,
        joinedAt: new Date(),
      }

      await this.repo.saveMembership(membership)
      logger.info('[IDENTITY] User added to organization', {
        organizationId: input.organizationId,
      })
      return ok(membership)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async getMemberships(userId: UserId): Promise<PlatformResult<UserOrganizationMembership[]>> {
    try {
      const memberships = await this.repo.findMembershipsByUser(userId)
      return ok(memberships)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async getUserRole(
    userId: UserId,
    organizationId: OrganizationId
  ): Promise<PlatformResult<UserRole>> {
    try {
      const membership = await this.repo.findMembership(userId, organizationId)
      if (!membership) {
        return err({
          code: PlatformErrorCode.FORBIDDEN,
          message: 'User is not a member of this organization',
        })
      }
      return ok(membership.role)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async issueApiKey(
    organizationId: OrganizationId,
    name: string
  ): Promise<PlatformResult<IssueApiKeyResult>> {
    try {
      const plaintext = `koo_${crypto.randomUUID().replace(/-/g, '')}`
      const prefix = plaintext.slice(0, 12)
      const keyHash = await hashApiKey(plaintext)

      const key: PersistedApiKey = {
        id: `apikey_${crypto.randomUUID()}`,
        organizationId,
        name,
        prefix,
        keyHash,
        createdAt: new Date(),
      }

      await this.repo.saveApiKey(key)
      logger.info('[IDENTITY] API key issued', { organizationId })

      const { keyHash: _h, ...apiKey } = key
      return ok({ apiKey, plaintext })
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async revokeApiKey(keyId: string, organizationId: OrganizationId): Promise<PlatformResult<void>> {
    try {
      const key = await this.repo.findApiKeyById(keyId)
      if (!key) return err({ code: PlatformErrorCode.NOT_FOUND, message: 'API key not found' })
      if (key.organizationId !== organizationId) {
        return err({
          code: PlatformErrorCode.TENANT_ISOLATION_VIOLATION,
          message: 'API key does not belong to this organization',
        })
      }
      if (key.revokedAt) {
        return err({
          code: PlatformErrorCode.VALIDATION_ERROR,
          message: 'API key is already revoked',
        })
      }
      await this.repo.saveApiKey({ ...key, revokedAt: new Date() })
      return ok(undefined)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async validateApiKey(plaintext: string): Promise<PlatformResult<ApiKey>> {
    try {
      const hash = await hashApiKey(plaintext)
      const key = await this.repo.findApiKeyByHash(hash)
      if (!key) return err({ code: PlatformErrorCode.UNAUTHORIZED, message: 'Invalid API key' })
      if (key.revokedAt) {
        return err({ code: PlatformErrorCode.UNAUTHORIZED, message: 'API key has been revoked' })
      }
      if (key.expiresAt && key.expiresAt <= new Date()) {
        return err({ code: PlatformErrorCode.UNAUTHORIZED, message: 'API key has expired' })
      }
      const { keyHash: _h, ...apiKey } = key
      return ok(apiKey)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton — defaults to in-memory; bootstrap swaps in Supabase repo
//
// Callers that depend on the Supabase-backed service (resolve.ts, provision.ts)
// must call bootstrapPlatform() before using this singleton. Doing so ensures
// _configureIdentityRepository() runs inside the same webpack module registry
// as the caller, so both references point to the same module instance.
// ---------------------------------------------------------------------------

export let identityService: IIdentityService = new IdentityService(new InMemoryIdentityRepository())

export function _configureIdentityRepository(repo: IIdentityRepository): void {
  identityService = new IdentityService(repo)
}
