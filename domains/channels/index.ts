/**
 * Channels Domain — Public Interface
 *
 * Owns per-organization connections to external publishing channels (YouTube
 * first) and the encrypted OAuth token material for each. Publishing execution
 * itself is NOT part of this domain (that arrives in Step 3D-2).
 *
 * Tokens are encrypted at the service boundary (AES-256-GCM) and stored only as
 * opaque ciphertext. Customer-facing reads use ChannelConnectionView, which
 * never carries token material.
 */

export * from './types'
export {
  channelsService,
  ChannelsService,
  _configureChannelsRepository,
  type IChannelsService,
  type SaveConnectionInput,
} from './service'
export type { IChannelsRepository } from './repository'
export { InMemoryChannelsRepository } from './in-memory-repository'
export { SupabaseChannelsRepository } from './supabase-repository'
export {
  uploadYouTubeVideo,
  fetchVideoAsset,
  createYouTubeUploadSession,
  uploadToYouTubeSession,
  probeYouTubeUploadSession,
  YouTubeUploadError,
  type UploadVideoParams,
  type UploadVideoResult,
  type CreateUploadSessionParams,
  type ProbeResult,
  type VideoAsset,
  type YouTubeVideoPrivacy,
} from './youtube-upload'
