import { err, ok } from '@/shared/types'
import { PlatformErrorCode } from '@/shared/types'
import type { OrganizationId, PlatformResult, TenantId, UserId } from '@/shared/types'
import { logger } from '@/shared/lib/logger'
import type { ApiKey, Session, User, UserOrganizationMembership, UserRole } from './types'

/**
 * Identity Domain Service Interface & Stub
 *
 * The Identity domain owns user management, session lifecycle, role-based
 * access control, and API key management. It is the entry point for all
 * authentication and authorization on the platform.
 *
 * The stub implementation manages state in memory. The production
 * implementation will persist to Supabase with auth managed by Supabase Auth,
 * RLS enforcing tenant isolation, and API key hashing via bcrypt or Argon2.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §3 — Domain Boundaries (identity).
 */

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface CreateUserInput {
  tenantId: TenantId
  email: string
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
// In-memory stub implementation
// ---------------------------------------------------------------------------

/** TTL for sessions in the stub implementation: 24 hours. */
const SESSION_TTL_MS = 24 * 60 * 60 * 1000

class IdentityService implements IIdentityService {
  private readonly users = new Map<UserId, User>()
  /** `${email}::${tenantId}` → UserId for unique-per-tenant lookup. */
  private readonly emailIndex = new Map<string, UserId>()
  private readonly sessions = new Map<string, Session & { revokedAt?: Date }>()
  private readonly memberships = new Map<UserId, UserOrganizationMembership[]>()
  private readonly apiKeys = new Map<string, ApiKey & { plaintextRef: string }>()
  /**
   * Plaintext → keyId index.
   * PRODUCTION: replace with hashed lookup — never store plaintext in a real environment.
   */
  private readonly apiKeyIndex = new Map<string, string>()

  async createUser(input: CreateUserInput): Promise<PlatformResult<User>> {
    const emailKey = `${input.email}::${input.tenantId}`

    if (this.emailIndex.has(emailKey)) {
      return err({
        code: PlatformErrorCode.VALIDATION_ERROR,
        message: 'A user with this email already exists in this tenant',
      })
    }

    const user: User = {
      id: `user_${crypto.randomUUID()}` as UserId,
      tenantId: input.tenantId,
      email: input.email,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.users.set(user.id, user)
    this.emailIndex.set(emailKey, user.id)
    logger.info('[IDENTITY] User created', { tenantId: input.tenantId })

    return ok(user)
  }

  async getUserById(userId: UserId, tenantId: TenantId): Promise<PlatformResult<User>> {
    const user = this.users.get(userId)
    if (!user) return err({ code: PlatformErrorCode.NOT_FOUND, message: 'User not found' })
    if (user.tenantId !== tenantId) {
      return err({
        code: PlatformErrorCode.TENANT_ISOLATION_VIOLATION,
        message: 'User does not belong to this tenant',
      })
    }
    return ok(user)
  }

  async getUserByEmail(email: string, tenantId: TenantId): Promise<PlatformResult<User>> {
    const userId = this.emailIndex.get(`${email}::${tenantId}`)
    if (!userId) return err({ code: PlatformErrorCode.NOT_FOUND, message: 'User not found' })
    const user = this.users.get(userId)!
    return ok(user)
  }

  async createSession(userId: UserId, tenantId: TenantId): Promise<PlatformResult<Session>> {
    const userResult = await this.getUserById(userId, tenantId)
    if (!userResult.ok) return userResult

    const session: Session & { revokedAt?: Date } = {
      id: `session_${crypto.randomUUID()}`,
      userId,
      tenantId,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      createdAt: new Date(),
    }

    this.sessions.set(session.id, session)
    logger.debug('[IDENTITY] Session created', { tenantId })

    const { revokedAt: _r, ...publicSession } = session
    return ok(publicSession)
  }

  async validateSession(sessionId: string): Promise<PlatformResult<Session>> {
    const session = this.sessions.get(sessionId)
    if (!session) return err({ code: PlatformErrorCode.UNAUTHORIZED, message: 'Session not found' })
    if (session.revokedAt) {
      return err({ code: PlatformErrorCode.UNAUTHORIZED, message: 'Session has been revoked' })
    }
    if (session.expiresAt <= new Date()) {
      return err({ code: PlatformErrorCode.UNAUTHORIZED, message: 'Session has expired' })
    }
    const { revokedAt: _r, ...publicSession } = session
    return ok(publicSession)
  }

  async revokeSession(sessionId: string): Promise<PlatformResult<void>> {
    const session = this.sessions.get(sessionId)
    if (!session) return err({ code: PlatformErrorCode.NOT_FOUND, message: 'Session not found' })
    session.revokedAt = new Date()
    return ok(undefined)
  }

  async addUserToOrganization(
    input: AddMemberInput
  ): Promise<PlatformResult<UserOrganizationMembership>> {
    const existing = this.memberships.get(input.userId) ?? []
    const alreadyMember = existing.some((m) => m.organizationId === input.organizationId)

    if (alreadyMember) {
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

    this.memberships.set(input.userId, [...existing, membership])
    logger.info('[IDENTITY] User added to organization', {
      organizationId: input.organizationId,
    })

    return ok(membership)
  }

  async getMemberships(userId: UserId): Promise<PlatformResult<UserOrganizationMembership[]>> {
    return ok(this.memberships.get(userId) ?? [])
  }

  async getUserRole(
    userId: UserId,
    organizationId: OrganizationId
  ): Promise<PlatformResult<UserRole>> {
    const memberships = this.memberships.get(userId) ?? []
    const membership = memberships.find((m) => m.organizationId === organizationId)
    if (!membership) {
      return err({
        code: PlatformErrorCode.FORBIDDEN,
        message: 'User is not a member of this organization',
      })
    }
    return ok(membership.role)
  }

  async issueApiKey(
    organizationId: OrganizationId,
    name: string
  ): Promise<PlatformResult<IssueApiKeyResult>> {
    const plaintext = `koo_${crypto.randomUUID().replace(/-/g, '')}`
    const prefix = plaintext.slice(0, 12)

    const apiKey: ApiKey = {
      id: `apikey_${crypto.randomUUID()}`,
      organizationId,
      name,
      prefix,
      createdAt: new Date(),
    }

    this.apiKeys.set(apiKey.id, { ...apiKey, plaintextRef: plaintext })
    this.apiKeyIndex.set(plaintext, apiKey.id)
    logger.info('[IDENTITY] API key issued', { organizationId })

    return ok({ apiKey, plaintext })
  }

  async revokeApiKey(keyId: string, organizationId: OrganizationId): Promise<PlatformResult<void>> {
    const key = this.apiKeys.get(keyId)
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
    key.revokedAt = new Date()
    this.apiKeyIndex.delete(key.plaintextRef)
    return ok(undefined)
  }

  async validateApiKey(plaintext: string): Promise<PlatformResult<ApiKey>> {
    const keyId = this.apiKeyIndex.get(plaintext)
    if (!keyId) return err({ code: PlatformErrorCode.UNAUTHORIZED, message: 'Invalid API key' })
    const { plaintextRef: _p, ...key } = this.apiKeys.get(keyId)!
    if (key.revokedAt) {
      return err({ code: PlatformErrorCode.UNAUTHORIZED, message: 'API key has been revoked' })
    }
    if (key.expiresAt && key.expiresAt <= new Date()) {
      return err({ code: PlatformErrorCode.UNAUTHORIZED, message: 'API key has expired' })
    }
    return ok(key)
  }
}

export const identityService: IIdentityService = new IdentityService()
