import type { OrganizationId } from '@/shared/types'
import type {
  ChannelConnection,
  ChannelConnectionStatus,
  PublishingChannel,
  UpsertChannelConnectionInput,
} from './types'

/**
 * Channels repository contract. Every method is scoped by organizationId — the
 * customer boundary — because the server-side Supabase client uses the service
 * role and therefore bypasses RLS; app-layer scoping is mandatory.
 */
export interface IChannelsRepository {
  /** Insert or replace the org's connection for a channel (UNIQUE org+channel). */
  upsert(input: UpsertChannelConnectionInput): Promise<ChannelConnection>
  /** Find the org's connection for a channel, or null. */
  find(
    organizationId: OrganizationId,
    channel: PublishingChannel
  ): Promise<ChannelConnection | null>
  /** Delete the org's connection for a channel. No-op if absent. */
  remove(organizationId: OrganizationId, channel: PublishingChannel): Promise<void>
  /**
   * Replace the encrypted access token + expiry after a token refresh. Preserves
   * the refresh token and all other fields. Org-scoped.
   */
  updateAccessToken(
    organizationId: OrganizationId,
    channel: PublishingChannel,
    encryptedAccessToken: string,
    tokenExpiresAt: Date | null
  ): Promise<void>
  /** Update the connection status (e.g. → 'expired' when a refresh is revoked). */
  markStatus(
    organizationId: OrganizationId,
    channel: PublishingChannel,
    status: ChannelConnectionStatus
  ): Promise<void>
}
