import type { EngagementRunId, OrganizationId, TenantId, WorkforceId } from '@/shared/types'
import type { VideoProductionBrief } from '../video-production/types'

// ── Platform ───────────────────────────────────────────────────────────────────

export type SupportedPlatform =
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'youtube-shorts'
  | 'linkedin'
  | 'google-business-profile'

export const SUPPORTED_PLATFORMS: SupportedPlatform[] = [
  'facebook',
  'instagram',
  'tiktok',
  'youtube-shorts',
  'linkedin',
  'google-business-profile',
]

// ── Output ─────────────────────────────────────────────────────────────────────

/**
 * A platform-optimised publishing package for a single social or video platform.
 *
 * Every field maps directly to a publishing action on the target platform:
 *   - videoReference       → the render job output from VideoProductionBrief.assetManifest
 *   - thumbnailReference   → static cover image for platforms that support it
 *   - publishDate/Time     → scheduling inputs for each platform's scheduling API (Phase 6)
 *   - platformMetadata     → platform-specific API fields serialised as a JSON string
 *
 * 18 structured fields covering every dimension of platform-specific publishing.
 */
export interface PublishingPackage {
  // ── Platform Identity ───────────────────────────────────────────────────────
  platform: SupportedPlatform
  title: string
  caption: string

  // ── Discovery & Reach ───────────────────────────────────────────────────────
  hashtags: string[]
  tags: string[]
  callToAction: string
  audience: string
  category: string

  // ── Asset References ────────────────────────────────────────────────────────
  // Report truth: only verified assets may be referenced. No verified asset exists at
  // publishing time, so these are always empty ('' / []) — never model-generated.
  thumbnailReference: string
  videoReference: string
  deliveryAssets: string[]

  // ── Scheduling ──────────────────────────────────────────────────────────────
  // Set by the service from the run's business-timezone schedule, never by the model.
  // All three are '' when the business timezone is unknown (dates/times omitted).
  publishDate: string
  publishTime: string
  timezone: string
  schedulingInstructions: string

  // ── Platform Config ─────────────────────────────────────────────────────────
  /**
   * Platform-specific API configuration fields serialised as a JSON string. Always '{}':
   * no platform accounts are connected, so page/ad/channel IDs would be fabricated.
   */
  platformMetadata: string
  approvalRequired: boolean
  publishingChecklist: string[]
}

// ── Job ────────────────────────────────────────────────────────────────────────

/** Lifecycle states for a publishing job. */
export type PublishingJobStatus = 'idle' | 'running' | 'completed' | 'failed' | 'retrying' | 'ready'

/**
 * Tracks a single publishing job from submission to completion.
 * A completed job carries one PublishingPackage per supported platform.
 */
export interface PublishingJob {
  id: string
  status: PublishingJobStatus
  videoProductionBrief: VideoProductionBrief
  /** Allowed platforms for this job (shared resolver). Absent on legacy jobs → resolver. */
  allowedPlatforms?: SupportedPlatform[]
  /** Business-timezone schedule used for the packages; null when the timezone is unknown. */
  schedule?: PublishingSchedule | null
  /** One package per supported platform. Populated on completion. */
  packages: PublishingPackage[]
  error?: string
  attempts: number
  employeeId: string
  providerId: string
  createdAt: Date
  updatedAt: Date
}

// ── Errors ─────────────────────────────────────────────────────────────────────

export type PublishingErrorCode =
  | 'PROVIDER_NOT_CONFIGURED'
  | 'PROVIDER_UNAVAILABLE'
  | 'TIMEOUT'
  | 'INVALID_RESPONSE'
  | 'MAX_RETRIES_EXCEEDED'
  | 'TRUST_ENGINE_DENIED'

export interface PublishingError {
  code: PublishingErrorCode
  message: string
  retriable: boolean
}

// ── Request ────────────────────────────────────────────────────────────────────

/**
 * The run's schedule in the business's own timezone. Only present when the timezone
 * was derived from the business location; otherwise dates and times are omitted.
 */
export interface PublishingSchedule {
  /** IANA timezone of the business, e.g. 'America/New_York'. */
  timezone: string
  /** Calendar publish date (YYYY-MM-DD) in that timezone. */
  publishDate: string
}

/** Everything needed to dispatch a publishing job through the platform. */
export interface PublishingRequest {
  tenantId: TenantId
  organizationId: OrganizationId
  workforceId: WorkforceId
  engagementRunId: EngagementRunId
  videoProductionBrief: VideoProductionBrief
  /** Business-timezone schedule. Absent/null → customer-facing dates and times omitted. */
  schedule?: PublishingSchedule | null
  /** Defaults to 'delivery-manager'. */
  preferredEmployee?: 'delivery-manager'
}

// ── Health ─────────────────────────────────────────────────────────────────────

export type PublishingProviderReadiness = 'ready' | 'not-configured' | 'error'

export interface PublishingProviderStatus {
  providerId: string
  name: string
  readiness: PublishingProviderReadiness
  purpose: string
  notes: string
}

export interface PublishingDepartmentHealth {
  overall: PublishingProviderReadiness
  /** Primary text provider — OpenAI (tracked in PROVIDER_REGISTRY). */
  primaryProvider: PublishingProviderStatus
  /** Fallback text provider — Anthropic (platform-level; checked via env). */
  fallbackProvider: PublishingProviderStatus
  readyForPublishing: boolean
  configuredProviderCount: number
  totalProviderCount: number
}
