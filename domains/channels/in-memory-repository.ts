import type { ChannelConnectionId, OrganizationId } from '@/shared/types'
import type { IChannelsRepository } from './repository'
import type {
  ChannelConnection,
  ChannelConnectionStatus,
  PublishingChannel,
  UpsertChannelConnectionInput,
} from './types'

/** In-memory Channels repository (tests + default before bootstrap). */
export class InMemoryChannelsRepository implements IChannelsRepository {
  /** `${organizationId}::${channel}` → ChannelConnection */
  private readonly store = new Map<string, ChannelConnection>()
  private seq = 0

  private key(organizationId: string, channel: string): string {
    return `${organizationId}::${channel}`
  }

  async upsert(input: UpsertChannelConnectionInput): Promise<ChannelConnection> {
    const k = this.key(input.organizationId, input.channel)
    const now = new Date()
    const existing = this.store.get(k)
    const connection: ChannelConnection = {
      id: existing?.id ?? (`chan_${++this.seq}` as ChannelConnectionId),
      organizationId: input.organizationId,
      tenantId: input.tenantId,
      channel: input.channel,
      externalAccountId: input.externalAccountId,
      externalAccountName: input.externalAccountName,
      encryptedAccessToken: input.encryptedAccessToken,
      encryptedRefreshToken: input.encryptedRefreshToken,
      tokenExpiresAt: input.tokenExpiresAt,
      scopes: input.scopes,
      status: 'connected',
      connectedBy: input.connectedBy,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    this.store.set(k, connection)
    return connection
  }

  async find(
    organizationId: OrganizationId,
    channel: PublishingChannel
  ): Promise<ChannelConnection | null> {
    return this.store.get(this.key(organizationId, channel)) ?? null
  }

  async remove(organizationId: OrganizationId, channel: PublishingChannel): Promise<void> {
    this.store.delete(this.key(organizationId, channel))
  }

  async updateAccessToken(
    organizationId: OrganizationId,
    channel: PublishingChannel,
    encryptedAccessToken: string,
    tokenExpiresAt: Date | null
  ): Promise<void> {
    const existing = this.store.get(this.key(organizationId, channel))
    if (!existing) return
    this.store.set(this.key(organizationId, channel), {
      ...existing,
      encryptedAccessToken,
      tokenExpiresAt,
      updatedAt: new Date(),
    })
  }

  async markStatus(
    organizationId: OrganizationId,
    channel: PublishingChannel,
    status: ChannelConnectionStatus
  ): Promise<void> {
    const existing = this.store.get(this.key(organizationId, channel))
    if (!existing) return
    this.store.set(this.key(organizationId, channel), {
      ...existing,
      status,
      updatedAt: new Date(),
    })
  }
}
