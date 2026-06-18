import type { Organization, OrganizationId, TenantId, UserId } from '@/shared/types'
import type { User, UserOrganizationMembership } from './types'
import type { IIdentityRepository, PersistedApiKey, PersistedSession } from './repository'

export class InMemoryIdentityRepository implements IIdentityRepository {
  private readonly organizations = new Map<OrganizationId, Organization>()
  private readonly users = new Map<UserId, User>()
  /** `${email}::${tenantId}` → UserId */
  private readonly emailIndex = new Map<string, UserId>()
  private readonly sessions = new Map<string, PersistedSession>()
  private readonly memberships = new Map<UserId, UserOrganizationMembership[]>()
  private readonly apiKeys = new Map<string, PersistedApiKey>()
  /** SHA-256 hex hash → keyId */
  private readonly apiKeyHashIndex = new Map<string, string>()

  async saveOrganization(organization: Organization): Promise<Organization> {
    this.organizations.set(organization.id, organization)
    return organization
  }

  async findOrganizationById(id: OrganizationId): Promise<Organization | null> {
    return this.organizations.get(id) ?? null
  }

  async saveUser(user: User): Promise<User> {
    this.users.set(user.id, user)
    this.emailIndex.set(`${user.email}::${user.tenantId}`, user.id)
    return user
  }

  async findUserById(id: UserId): Promise<User | null> {
    return this.users.get(id) ?? null
  }

  async findUserByEmail(email: string, tenantId: TenantId): Promise<User | null> {
    const userId = this.emailIndex.get(`${email}::${tenantId}`)
    if (!userId) return null
    return this.users.get(userId) ?? null
  }

  async saveSession(session: PersistedSession): Promise<PersistedSession> {
    this.sessions.set(session.id, session)
    return session
  }

  async findSessionById(id: string): Promise<PersistedSession | null> {
    return this.sessions.get(id) ?? null
  }

  async saveMembership(
    membership: UserOrganizationMembership
  ): Promise<UserOrganizationMembership> {
    const existing = this.memberships.get(membership.userId) ?? []
    const idx = existing.findIndex((m) => m.organizationId === membership.organizationId)
    if (idx >= 0) {
      existing[idx] = membership
    } else {
      existing.push(membership)
    }
    this.memberships.set(membership.userId, existing)
    return membership
  }

  async findMembershipsByUser(userId: UserId): Promise<UserOrganizationMembership[]> {
    return this.memberships.get(userId) ?? []
  }

  async findMembership(
    userId: UserId,
    organizationId: OrganizationId
  ): Promise<UserOrganizationMembership | null> {
    const memberships = this.memberships.get(userId) ?? []
    return memberships.find((m) => m.organizationId === organizationId) ?? null
  }

  async saveApiKey(key: PersistedApiKey): Promise<PersistedApiKey> {
    this.apiKeys.set(key.id, key)
    this.apiKeyHashIndex.set(key.keyHash, key.id)
    return key
  }

  async findApiKeyById(id: string): Promise<PersistedApiKey | null> {
    return this.apiKeys.get(id) ?? null
  }

  async findApiKeyByHash(keyHash: string): Promise<PersistedApiKey | null> {
    const keyId = this.apiKeyHashIndex.get(keyHash)
    if (!keyId) return null
    return this.apiKeys.get(keyId) ?? null
  }
}
