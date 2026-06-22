import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Organization,
  OrganizationId,
  OrganizationStatus,
  TenantId,
  UserId,
} from '@/shared/types'
import type { ApiKey, Session, User, UserOrganizationMembership, UserRole } from './types'
import type { IIdentityRepository, PersistedApiKey, PersistedSession } from './repository'

/**
 * Supabase implementation of IIdentityRepository.
 *
 * All DB columns use snake_case; entity fields use camelCase.
 * The map functions at the bottom of this file are the single place
 * where that translation happens.
 *
 * API keys are stored by SHA-256 hash only. The plaintext is never
 * written here — it is the service's responsibility to hash before saving.
 */

// ---------------------------------------------------------------------------
// Database row types — mirror the schema in migration 002
// ---------------------------------------------------------------------------

interface OrganizationRow {
  id: string
  tenant_id: string
  name: string
  status: string
  created_at: string
  updated_at: string
}

interface UserRow {
  id: string
  tenant_id: string
  email: string
  auth_user_id: string | null
  created_at: string
  updated_at: string
}

interface SessionRow {
  id: string
  user_id: string
  tenant_id: string
  expires_at: string
  created_at: string
  revoked_at: string | null
}

interface MembershipRow {
  user_id: string
  organization_id: string
  role: string
  joined_at: string
}

interface ApiKeyRow {
  id: string
  organization_id: string
  name: string
  prefix: string
  key_hash: string
  created_at: string
  expires_at: string | null
  revoked_at: string | null
}

// ---------------------------------------------------------------------------
// Row ↔ entity mappers
// ---------------------------------------------------------------------------

function mapOrganization(row: OrganizationRow): Organization {
  return {
    id: row.id as OrganizationId,
    tenantId: row.tenant_id as TenantId,
    name: row.name,
    status: row.status as OrganizationStatus,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

function organizationToRow(org: Organization): OrganizationRow {
  return {
    id: org.id,
    tenant_id: org.tenantId,
    name: org.name,
    status: org.status,
    created_at: org.createdAt.toISOString(),
    updated_at: org.updatedAt.toISOString(),
  }
}

function mapUser(row: UserRow): User {
  return {
    id: row.id as UserId,
    tenantId: row.tenant_id as TenantId,
    email: row.email,
    authUserId: row.auth_user_id ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

function userToRow(user: User): UserRow {
  return {
    id: user.id,
    tenant_id: user.tenantId,
    email: user.email,
    auth_user_id: user.authUserId ?? null,
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
  }
}

function mapSession(row: SessionRow): PersistedSession {
  return {
    id: row.id,
    userId: row.user_id as UserId,
    tenantId: row.tenant_id as TenantId,
    expiresAt: new Date(row.expires_at),
    createdAt: new Date(row.created_at),
    revokedAt: row.revoked_at ? new Date(row.revoked_at) : undefined,
  }
}

function sessionToRow(session: PersistedSession): SessionRow {
  return {
    id: session.id,
    user_id: session.userId,
    tenant_id: session.tenantId,
    expires_at: session.expiresAt.toISOString(),
    created_at: session.createdAt.toISOString(),
    revoked_at: session.revokedAt?.toISOString() ?? null,
  }
}

function mapMembership(row: MembershipRow): UserOrganizationMembership {
  return {
    userId: row.user_id as UserId,
    organizationId: row.organization_id as OrganizationId,
    role: row.role as UserRole,
    joinedAt: new Date(row.joined_at),
  }
}

function membershipToRow(m: UserOrganizationMembership): MembershipRow {
  return {
    user_id: m.userId,
    organization_id: m.organizationId,
    role: m.role,
    joined_at: m.joinedAt.toISOString(),
  }
}

function mapApiKey(row: ApiKeyRow): PersistedApiKey {
  return {
    id: row.id,
    organizationId: row.organization_id as OrganizationId,
    name: row.name,
    prefix: row.prefix,
    keyHash: row.key_hash,
    createdAt: new Date(row.created_at),
    expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
    revokedAt: row.revoked_at ? new Date(row.revoked_at) : undefined,
  }
}

function apiKeyToRow(key: PersistedApiKey): ApiKeyRow {
  return {
    id: key.id,
    organization_id: key.organizationId,
    name: key.name,
    prefix: key.prefix,
    key_hash: key.keyHash,
    created_at: key.createdAt.toISOString(),
    expires_at: key.expiresAt?.toISOString() ?? null,
    revoked_at: key.revokedAt?.toISOString() ?? null,
  }
}

// ---------------------------------------------------------------------------
// Repository implementation
// ---------------------------------------------------------------------------

export class SupabaseIdentityRepository implements IIdentityRepository {
  constructor(private readonly client: SupabaseClient) {}

  async saveOrganization(organization: Organization): Promise<Organization> {
    const { data, error } = await this.client
      .from('organizations')
      .upsert(organizationToRow(organization))
      .select()
      .single()
    if (error || !data)
      throw new Error(`[IDENTITY_REPO] saveOrganization failed: ${error?.message}`)
    return mapOrganization(data as OrganizationRow)
  }

  async findOrganizationById(id: OrganizationId): Promise<Organization | null> {
    const { data, error } = await this.client
      .from('organizations')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error(`[IDENTITY_REPO] findOrganizationById failed: ${error.message}`)
    return data ? mapOrganization(data as OrganizationRow) : null
  }

  async saveUser(user: User): Promise<User> {
    const { data, error } = await this.client
      .from('users')
      .upsert(userToRow(user))
      .select()
      .single()
    if (error || !data) throw new Error(`[IDENTITY_REPO] saveUser failed: ${error?.message}`)
    return mapUser(data as UserRow)
  }

  async findUserById(id: UserId): Promise<User | null> {
    const { data, error } = await this.client.from('users').select('*').eq('id', id).maybeSingle()
    if (error) throw new Error(`[IDENTITY_REPO] findUserById failed: ${error.message}`)
    return data ? mapUser(data as UserRow) : null
  }

  async findUserByEmail(email: string, tenantId: TenantId): Promise<User | null> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('tenant_id', tenantId)
      .maybeSingle()
    if (error) throw new Error(`[IDENTITY_REPO] findUserByEmail failed: ${error.message}`)
    return data ? mapUser(data as UserRow) : null
  }

  async saveSession(session: PersistedSession): Promise<PersistedSession> {
    const { data, error } = await this.client
      .from('sessions')
      .upsert(sessionToRow(session))
      .select()
      .single()
    if (error || !data) throw new Error(`[IDENTITY_REPO] saveSession failed: ${error?.message}`)
    return mapSession(data as SessionRow)
  }

  async findSessionById(id: string): Promise<PersistedSession | null> {
    const { data, error } = await this.client
      .from('sessions')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error(`[IDENTITY_REPO] findSessionById failed: ${error.message}`)
    return data ? mapSession(data as SessionRow) : null
  }

  async saveMembership(
    membership: UserOrganizationMembership
  ): Promise<UserOrganizationMembership> {
    const { data, error } = await this.client
      .from('user_organization_memberships')
      .upsert(membershipToRow(membership))
      .select()
      .single()
    if (error || !data) throw new Error(`[IDENTITY_REPO] saveMembership failed: ${error?.message}`)
    return mapMembership(data as MembershipRow)
  }

  async findMembershipsByUser(userId: UserId): Promise<UserOrganizationMembership[]> {
    const { data, error } = await this.client
      .from('user_organization_memberships')
      .select('*')
      .eq('user_id', userId)
    if (error) throw new Error(`[IDENTITY_REPO] findMembershipsByUser failed: ${error.message}`)
    return (data ?? []).map((r) => mapMembership(r as MembershipRow))
  }

  async findMembership(
    userId: UserId,
    organizationId: OrganizationId
  ): Promise<UserOrganizationMembership | null> {
    const { data, error } = await this.client
      .from('user_organization_memberships')
      .select('*')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .maybeSingle()
    if (error) throw new Error(`[IDENTITY_REPO] findMembership failed: ${error.message}`)
    return data ? mapMembership(data as MembershipRow) : null
  }

  async saveApiKey(key: PersistedApiKey): Promise<PersistedApiKey> {
    const { data, error } = await this.client
      .from('api_keys')
      .upsert(apiKeyToRow(key))
      .select()
      .single()
    if (error || !data) throw new Error(`[IDENTITY_REPO] saveApiKey failed: ${error?.message}`)
    return mapApiKey(data as ApiKeyRow)
  }

  async findApiKeyById(id: string): Promise<PersistedApiKey | null> {
    const { data, error } = await this.client
      .from('api_keys')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error(`[IDENTITY_REPO] findApiKeyById failed: ${error.message}`)
    return data ? mapApiKey(data as ApiKeyRow) : null
  }

  async findApiKeyByHash(keyHash: string): Promise<PersistedApiKey | null> {
    const { data, error } = await this.client
      .from('api_keys')
      .select('*')
      .eq('key_hash', keyHash)
      .maybeSingle()
    if (error) throw new Error(`[IDENTITY_REPO] findApiKeyByHash failed: ${error.message}`)
    return data ? mapApiKey(data as ApiKeyRow) : null
  }
}
