import { err, ok, PlatformErrorCode } from '@/shared/types'
import type { OrganizationId, PlatformResult, TenantId, UserId } from '@/shared/types'
import { encryptToken, decryptToken } from '@/shared/lib/token-crypto'
import { logger } from '@/shared/lib/logger'
import { refreshAccessToken, YouTubeAuthRevokedError } from './youtube-oauth'
import type { IChannelsRepository } from './repository'
import { InMemoryChannelsRepository } from './in-memory-repository'
import {
  toChannelConnectionView,
  type ChannelConnection,
  type ChannelConnectionView,
  type PublishingChannel,
} from './types'

/** Refresh the access token this many ms before its stated expiry. */
const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000

/** Plaintext OAuth result the caller (callback route) hands to the service. */
export interface SaveConnectionInput {
  organizationId: OrganizationId
  tenantId: TenantId
  channel: PublishingChannel
  externalAccountId: string | null
  externalAccountName: string | null
  accessToken: string
  refreshToken: string | null
  tokenExpiresAt: Date | null
  scopes: string[]
  connectedBy: UserId | null
}

export interface IChannelsService {
  /**
   * Persist a connection after a successful OAuth exchange. The service encrypts
   * the tokens (AES-256-GCM, bound to org+channel) before storage — plaintext
   * tokens never reach the repository or the database.
   */
  saveConnection(input: SaveConnectionInput): Promise<PlatformResult<ChannelConnectionView>>
  /** Customer-safe connection view for an org+channel (never token material). */
  getConnectionView(
    organizationId: OrganizationId,
    channel: PublishingChannel
  ): Promise<PlatformResult<ChannelConnectionView>>
  /** The full record (server-internal; includes ciphertext) for an org+channel. */
  getConnection(
    organizationId: OrganizationId,
    channel: PublishingChannel
  ): Promise<PlatformResult<ChannelConnection | null>>
  /** Remove the org's connection for a channel. Scoped strictly to the org. */
  disconnect(
    organizationId: OrganizationId,
    channel: PublishingChannel
  ): Promise<PlatformResult<void>>
  /**
   * Return a currently-valid YouTube access token for server-side use (upload).
   * Refreshes via the stored refresh token when the access token is expired/near
   * expiry, persisting the new encrypted access token. Returns a typed
   * UNAUTHORIZED error when the connection is missing/not connected or the grant
   * has been revoked (so a publish job can fail terminally rather than loop).
   * Never returns/logs token material beyond the access token it hands back.
   */
  getValidYouTubeAccessToken(organizationId: OrganizationId): Promise<PlatformResult<string>>
}

export class ChannelsService implements IChannelsService {
  constructor(private readonly repo: IChannelsRepository) {}

  async saveConnection(input: SaveConnectionInput): Promise<PlatformResult<ChannelConnectionView>> {
    try {
      const encryptedAccessToken = encryptToken(
        input.accessToken,
        input.organizationId,
        input.channel
      )
      const encryptedRefreshToken = input.refreshToken
        ? encryptToken(input.refreshToken, input.organizationId, input.channel)
        : null

      const connection = await this.repo.upsert({
        organizationId: input.organizationId,
        tenantId: input.tenantId,
        channel: input.channel,
        externalAccountId: input.externalAccountId,
        externalAccountName: input.externalAccountName,
        encryptedAccessToken,
        encryptedRefreshToken,
        tokenExpiresAt: input.tokenExpiresAt,
        scopes: input.scopes,
        connectedBy: input.connectedBy,
      })
      logger.info('[CHANNELS] Connection saved', {
        organizationId: input.organizationId,
        channel: input.channel,
      })
      return ok(toChannelConnectionView(connection))
    } catch (e) {
      // Never log token material; only the error message.
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async getConnectionView(
    organizationId: OrganizationId,
    channel: PublishingChannel
  ): Promise<PlatformResult<ChannelConnectionView>> {
    try {
      const connection = await this.repo.find(organizationId, channel)
      return ok(toChannelConnectionView(connection))
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async getConnection(
    organizationId: OrganizationId,
    channel: PublishingChannel
  ): Promise<PlatformResult<ChannelConnection | null>> {
    try {
      return ok(await this.repo.find(organizationId, channel))
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async disconnect(
    organizationId: OrganizationId,
    channel: PublishingChannel
  ): Promise<PlatformResult<void>> {
    try {
      await this.repo.remove(organizationId, channel)
      logger.info('[CHANNELS] Connection removed', { organizationId, channel })
      return ok(undefined)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async getValidYouTubeAccessToken(
    organizationId: OrganizationId
  ): Promise<PlatformResult<string>> {
    const channel: PublishingChannel = 'youtube'
    try {
      const connection = await this.repo.find(organizationId, channel)
      if (!connection || connection.status !== 'connected') {
        return err({
          code: PlatformErrorCode.UNAUTHORIZED,
          message: 'No connected YouTube account for this organization',
        })
      }
      if (!connection.encryptedAccessToken) {
        return err({
          code: PlatformErrorCode.UNAUTHORIZED,
          message: 'YouTube connection has no stored access token',
        })
      }

      // Still valid (with buffer)? Decrypt and return without refreshing.
      const expiresMs = connection.tokenExpiresAt?.getTime() ?? 0
      if (expiresMs - TOKEN_EXPIRY_BUFFER_MS > Date.now()) {
        return ok(decryptToken(connection.encryptedAccessToken, organizationId, channel))
      }

      // Expired / near expiry → refresh using the stored refresh token.
      if (!connection.encryptedRefreshToken) {
        await this.repo.markStatus(organizationId, channel, 'expired')
        return err({
          code: PlatformErrorCode.UNAUTHORIZED,
          message:
            'YouTube access token expired and no refresh token is available — reconnect required',
        })
      }
      const refreshToken = decryptToken(connection.encryptedRefreshToken, organizationId, channel)
      const refreshed = await refreshAccessToken(refreshToken)
      const encrypted = encryptToken(refreshed.accessToken, organizationId, channel)
      await this.repo.updateAccessToken(organizationId, channel, encrypted, refreshed.expiresAt)
      logger.info('[CHANNELS] YouTube access token refreshed', { organizationId })
      return ok(refreshed.accessToken)
    } catch (e) {
      if (e instanceof YouTubeAuthRevokedError) {
        // Terminal: mark the connection expired so the UI prompts a reconnect.
        await this.repo.markStatus(organizationId, channel, 'expired').catch(() => {})
        return err({
          code: PlatformErrorCode.UNAUTHORIZED,
          message: 'YouTube authorization was revoked — reconnect required',
        })
      }
      // Transient/unexpected — never include token material in the message.
      return err({
        code: PlatformErrorCode.INTERNAL_ERROR,
        message: 'Failed to obtain a valid YouTube access token',
      })
    }
  }
}

// Singleton — defaults to in-memory; bootstrap swaps in the Supabase repo.
export let channelsService: IChannelsService = new ChannelsService(new InMemoryChannelsRepository())

export function _configureChannelsRepository(repo: IChannelsRepository): void {
  channelsService = new ChannelsService(repo)
}
