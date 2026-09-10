import type { SupabaseClient } from '@supabase/supabase-js'
import type { ChannelConnectionId, OrganizationId, TenantId, UserId } from '@/shared/types'
import type { IChannelsRepository } from './repository'
import type {
  ChannelConnection,
  ChannelConnectionStatus,
  PublishingChannel,
  UpsertChannelConnectionInput,
} from './types'

interface ChannelConnectionRow {
  id: string
  organization_id: string
  tenant_id: string
  channel: string
  external_account_id: string | null
  external_account_name: string | null
  encrypted_access_token: string | null
  encrypted_refresh_token: string | null
  token_expires_at: string | null
  scopes: string[]
  status: string
  connected_by: string | null
  created_at: string
  updated_at: string
}

function mapConnection(row: ChannelConnectionRow): ChannelConnection {
  return {
    id: row.id as ChannelConnectionId,
    organizationId: row.organization_id as OrganizationId,
    tenantId: row.tenant_id as TenantId,
    channel: row.channel as PublishingChannel,
    externalAccountId: row.external_account_id,
    externalAccountName: row.external_account_name,
    encryptedAccessToken: row.encrypted_access_token,
    encryptedRefreshToken: row.encrypted_refresh_token,
    tokenExpiresAt: row.token_expires_at ? new Date(row.token_expires_at) : null,
    scopes: row.scopes ?? [],
    status: row.status as ChannelConnectionStatus,
    connectedBy: (row.connected_by as UserId | null) ?? null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

/**
 * Supabase Channels repository. Uses the service-role client, so EVERY query is
 * explicitly scoped by organization_id (+ channel). Reconnect upserts on the
 * (organization_id, channel) unique key.
 */
export class SupabaseChannelsRepository implements IChannelsRepository {
  constructor(private readonly client: SupabaseClient) {}

  async upsert(input: UpsertChannelConnectionInput): Promise<ChannelConnection> {
    const now = new Date().toISOString()
    // Preserve created_at + id on reconnect by reading any existing row first.
    const existing = await this.find(input.organizationId, input.channel)
    const row: ChannelConnectionRow = {
      id: existing?.id ?? `chan_${crypto.randomUUID()}`,
      organization_id: input.organizationId,
      tenant_id: input.tenantId,
      channel: input.channel,
      external_account_id: input.externalAccountId,
      external_account_name: input.externalAccountName,
      encrypted_access_token: input.encryptedAccessToken,
      encrypted_refresh_token: input.encryptedRefreshToken,
      token_expires_at: input.tokenExpiresAt ? input.tokenExpiresAt.toISOString() : null,
      scopes: input.scopes,
      status: 'connected',
      connected_by: input.connectedBy,
      created_at: existing ? existing.createdAt.toISOString() : now,
      updated_at: now,
    }
    const { data, error } = await this.client
      .from('channel_connections')
      .upsert(row, { onConflict: 'organization_id,channel' })
      .select()
      .single()
    if (error || !data) {
      throw new Error(`[CHANNELS_REPO] upsert failed: ${error?.message}`)
    }
    return mapConnection(data as ChannelConnectionRow)
  }

  async find(
    organizationId: OrganizationId,
    channel: PublishingChannel
  ): Promise<ChannelConnection | null> {
    const { data, error } = await this.client
      .from('channel_connections')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('channel', channel)
      .maybeSingle()
    if (error) throw new Error(`[CHANNELS_REPO] find failed: ${error.message}`)
    return data ? mapConnection(data as ChannelConnectionRow) : null
  }

  async remove(organizationId: OrganizationId, channel: PublishingChannel): Promise<void> {
    const { error } = await this.client
      .from('channel_connections')
      .delete()
      .eq('organization_id', organizationId)
      .eq('channel', channel)
    if (error) throw new Error(`[CHANNELS_REPO] remove failed: ${error.message}`)
  }

  async updateAccessToken(
    organizationId: OrganizationId,
    channel: PublishingChannel,
    encryptedAccessToken: string,
    tokenExpiresAt: Date | null
  ): Promise<void> {
    const { error } = await this.client
      .from('channel_connections')
      .update({
        encrypted_access_token: encryptedAccessToken,
        token_expires_at: tokenExpiresAt ? tokenExpiresAt.toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', organizationId)
      .eq('channel', channel)
    if (error) throw new Error(`[CHANNELS_REPO] updateAccessToken failed: ${error.message}`)
  }

  async markStatus(
    organizationId: OrganizationId,
    channel: PublishingChannel,
    status: ChannelConnectionStatus
  ): Promise<void> {
    const { error } = await this.client
      .from('channel_connections')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('organization_id', organizationId)
      .eq('channel', channel)
    if (error) throw new Error(`[CHANNELS_REPO] markStatus failed: ${error.message}`)
  }
}
