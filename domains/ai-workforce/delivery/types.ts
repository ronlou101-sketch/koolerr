import type { EngagementRunId, OrganizationId, TenantId, WorkforceId } from '@/shared/types'
import type { ApprovalDecision } from '../approval/types'

// ── Output ─────────────────────────────────────────────────────────────────────

/**
 * Preparation state of a delivery package. This is NOT the report's customer-facing
 * status: Draft / Ready for review / Customer-approved are owned by app state (the
 * deliverable row). 'Delivered' does not exist here — a package can never claim it.
 */
export type DeliveryStatus = 'preparing' | 'prepared' | 'failed'

// ── Verified media (report truth) ──────────────────────────────────────────────

/** An image proven by app records: completed render job + resolvable image deliverable. */
export interface VerifiedImageAsset {
  deliverableId: string
  imageUrl: string
}

/** A video proven by app records: completed render job + resolvable video deliverable. */
export interface VerifiedVideoAsset {
  deliverableId: string
  videoUrl: string
}

/**
 * The three distinct video states. 'none' means the lookup succeeded and found no
 * verified video ("not produced"); 'unavailable' means the lookup failed — it is never
 * converted into 'none'.
 */
export type VideoTruth =
  | { state: 'verified'; videos: VerifiedVideoAsset[] }
  | { state: 'none' }
  | { state: 'unavailable' }

/** Verified media facts for a run, gathered from app records by the pipeline. */
export interface MediaTruth {
  /** Only completed images with a resolvable asset; pending/queued/failed are omitted. */
  images: VerifiedImageAsset[]
  video: VideoTruth
}

/**
 * A delivery package prepared by the Delivery Manager for the business to review.
 * Aggregates all approved publishing packages into a single customer-facing
 * deliverable for the Koolerr dashboard.
 *
 * The Delivery Department prepares and packages — it does NOT publish directly
 * to any platform. Platform API integrations belong to a later phase.
 *
 * Built from verified run context: only allowed platforms, verified media, and the
 * business-timezone schedule. It never establishes approval, readiness, or delivery.
 */
export interface DeliveryPackage {
  // ── Identity ─────────────────────────────────────────────────────────────────
  /** Unique identifier for this delivery package. Set by the service at creation. */
  packageId: string

  // ── Customer-Facing Content ───────────────────────────────────────────────────
  /** Plain-language summary of what is ready and what the customer needs to do. */
  customerSummary: string
  /** List of specific deliverable items included in this package. */
  deliverables: string[]
  /** Per-platform package descriptions formatted for the customer dashboard. */
  platformPackages: string[]
  /** Download links — always empty: there is no file storage, so links would be fabricated. */
  downloadLinks: string[]
  /** Verified image URLs only (completed render + resolvable asset); otherwise empty. */
  thumbnails: string[]
  /** Step-by-step publishing instructions for each platform. */
  publishingInstructions: string[]
  /** Posting schedule built from the packages' business-timezone schedule (never AI text). */
  recommendedSchedule: string
  /** Automated quality-check summary built from scores (no reviewer identity or date). */
  approvalMetadata: string

  // ── Lifecycle ─────────────────────────────────────────────────────────────────
  generatedAt: Date
  /** Preparation state only — never a customer-facing or delivery status. */
  status: DeliveryStatus
  /** The verified media facts this package was built from. */
  mediaTruth: MediaTruth

  sourceApprovalDecision: ApprovalDecision
}

// ── Job ────────────────────────────────────────────────────────────────────────

export type DeliveryJobStatus = 'idle' | 'running' | 'completed' | 'failed' | 'retrying' | 'ready'

/** Tracks a single delivery job from submission to completion. Persisted in-memory. */
export interface DeliveryJob {
  id: string
  status: DeliveryJobStatus
  approvalDecision: ApprovalDecision
  deliveryPackage?: DeliveryPackage
  error?: string
  attempts: number
  employeeId: string
  providerId: string
  createdAt: Date
  updatedAt: Date
}

// ── Errors ─────────────────────────────────────────────────────────────────────

export type DeliveryErrorCode =
  | 'PROVIDER_NOT_CONFIGURED'
  | 'PROVIDER_UNAVAILABLE'
  | 'TIMEOUT'
  | 'INVALID_RESPONSE'
  | 'MAX_RETRIES_EXCEEDED'
  | 'TRUST_ENGINE_DENIED'

export interface DeliveryError {
  code: DeliveryErrorCode
  message: string
  retriable: boolean
}

// ── Request ────────────────────────────────────────────────────────────────────

/** Everything needed to dispatch a delivery job through the platform. */
export interface DeliveryRequest {
  tenantId: TenantId
  organizationId: OrganizationId
  workforceId: WorkforceId
  engagementRunId: EngagementRunId
  /** The APPROVED ApprovalDecision gate-keeping this delivery. */
  approvalDecision: ApprovalDecision
  /** Verified media facts. Absent → no media, video status 'unavailable'. */
  mediaTruth?: MediaTruth
  /** Defaults to 'delivery-manager'. */
  preferredEmployee?: 'delivery-manager'
}

// ── Health ─────────────────────────────────────────────────────────────────────

export type DeliveryProviderReadiness = 'ready' | 'not-configured' | 'error'

export interface DeliveryProviderStatus {
  providerId: string
  name: string
  readiness: DeliveryProviderReadiness
  purpose: string
  notes: string
}

export interface DeliveryDepartmentHealth {
  overall: DeliveryProviderReadiness
  /** Primary text provider — OpenAI (tracked in PROVIDER_REGISTRY). */
  primaryProvider: DeliveryProviderStatus
  /** Fallback text provider — Anthropic (platform-level; checked via env). */
  fallbackProvider: DeliveryProviderStatus
  readyForDelivery: boolean
  configuredProviderCount: number
  totalProviderCount: number
}
