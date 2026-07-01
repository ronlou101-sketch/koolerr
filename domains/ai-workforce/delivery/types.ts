import type { EngagementRunId, OrganizationId, TenantId, WorkforceId } from '@/shared/types'
import type { ApprovalDecision } from '../approval/types'

// ── Output ─────────────────────────────────────────────────────────────────────

export type DeliveryStatus = 'preparing' | 'ready' | 'delivered' | 'failed'

/**
 * A customer-ready delivery package produced by the Delivery Manager.
 * Aggregates all approved publishing packages into a single customer-facing
 * deliverable for the Koolerr dashboard.
 *
 * The Delivery Department prepares and packages — it does NOT publish directly
 * to any platform. Platform API integrations belong to a later phase.
 *
 * 13 structured fields covering every dimension of the customer handoff.
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
  /** Download link paths or identifiers for each deliverable asset. */
  downloadLinks: string[]
  /** Thumbnail references for preview display on the customer dashboard. */
  thumbnails: string[]
  /** Step-by-step publishing instructions for each platform. */
  publishingInstructions: string[]
  /** AI-recommended posting schedule across all platforms. */
  recommendedSchedule: string
  /** Human-readable summary of the approval outcome and scores. */
  approvalMetadata: string

  // ── Lifecycle ─────────────────────────────────────────────────────────────────
  generatedAt: Date
  deliveredAt: Date
  status: DeliveryStatus
  /** True when all required fields are present and the package is ready for the customer. */
  readyForCustomer: boolean

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
