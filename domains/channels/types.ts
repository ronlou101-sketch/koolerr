import type { ChannelConnectionId, OrganizationId, TenantId, UserId } from '@/shared/types'

/**
 * Channels domain — a per-organization connection to an external publishing
 * channel (YouTube first). Identity + OAuth token material for one org/channel.
 *
 * Tokens are stored ONLY as opaque AES-256-GCM ciphertext (see
 * shared/lib/token-crypto). The domain type never carries plaintext tokens, and
 * customer-facing views (ChannelConnectionView) never include token material.
 */

export type PublishingChannel = 'youtube'

export type ChannelConnectionStatus = 'connected' | 'expired' | 'revoked' | 'disconnected'

/** Full connection record (server-internal; includes encrypted token blobs). */
export interface ChannelConnection {
  id: ChannelConnectionId
  organizationId: OrganizationId
  tenantId: TenantId
  channel: PublishingChannel
  externalAccountId: string | null
  externalAccountName: string | null
  /** AES-256-GCM ciphertext (opaque). Never returned to the browser. */
  encryptedAccessToken: string | null
  encryptedRefreshToken: string | null
  tokenExpiresAt: Date | null
  scopes: string[]
  status: ChannelConnectionStatus
  connectedBy: UserId | null
  createdAt: Date
  updatedAt: Date
}

/** Customer-safe projection — NO token material of any kind. */
export interface ChannelConnectionView {
  connected: boolean
  channel: PublishingChannel
  channelName: string | null
  externalAccountId: string | null
  status: ChannelConnectionStatus
}

/** Input to create/replace a connection after a successful OAuth exchange. */
export interface UpsertChannelConnectionInput {
  organizationId: OrganizationId
  tenantId: TenantId
  channel: PublishingChannel
  externalAccountId: string | null
  externalAccountName: string | null
  encryptedAccessToken: string
  encryptedRefreshToken: string | null
  tokenExpiresAt: Date | null
  scopes: string[]
  connectedBy: UserId | null
}

/** Project a full connection to the customer-safe view (token material dropped). */
export function toChannelConnectionView(c: ChannelConnection | null): ChannelConnectionView {
  if (!c || c.status !== 'connected') {
    return {
      connected: false,
      channel: 'youtube',
      channelName: c?.externalAccountName ?? null,
      externalAccountId: c?.externalAccountId ?? null,
      status: c?.status ?? 'disconnected',
    }
  }
  return {
    connected: true,
    channel: c.channel,
    channelName: c.externalAccountName,
    externalAccountId: c.externalAccountId,
    status: c.status,
  }
}
