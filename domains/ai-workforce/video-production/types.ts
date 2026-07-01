import type { EngagementRunId, OrganizationId, TenantId, WorkforceId } from '@/shared/types'
import type { CreativeBrief } from '../creative/types'

// ── Output ─────────────────────────────────────────────────────────────────────

/**
 * A complete production package produced by the Video Production Department.
 *
 * The VideoProductionBrief is the handoff document between creative direction
 * and actual video rendering. Every field maps directly to a production step:
 *   - renderQueue[]        → HeyGen / Higgsfield render jobs (Phase 5)
 *   - avatarAssignments[]  → HeyGen avatar configuration per scene (Phase 5)
 *   - voiceAssignments[]   → ElevenLabs voice-to-scene mapping (Phase 5)
 *   - sceneTimeline[]      → Higgsfield scene-by-scene production sequence (Phase 5)
 *
 * 17 structured fields covering every dimension of video production orchestration.
 */
export interface VideoProductionBrief {
  // ── Plan & Settings ─────────────────────────────────────────────────────────
  productionPlan: string
  renderSettings: string
  estimatedRuntime: string

  // ── Production Queues ───────────────────────────────────────────────────────
  renderQueue: string[]
  sceneTimeline: string[]

  // ── Assignments ─────────────────────────────────────────────────────────────
  avatarAssignments: string[]
  voiceAssignments: string[]

  // ── Cinematography & Motion ─────────────────────────────────────────────────
  cameraMovements: string[]
  motionEffects: string[]
  transitions: string[]

  // ── Audio & Text Overlays ───────────────────────────────────────────────────
  captionTimeline: string[]
  bRollTimeline: string[]
  musicTimeline: string[]

  // ── Assets & Deliverables ───────────────────────────────────────────────────
  assetManifest: string[]
  exportTargets: string[]

  // ── Quality & Approval ──────────────────────────────────────────────────────
  qualityChecklist: string[]
  approvalChecklist: string[]

  generatedAt: Date
  sourceCreativeBrief: CreativeBrief
}

// ── Job ────────────────────────────────────────────────────────────────────────

/** Lifecycle states for a video production job. */
export type VideoProductionJobStatus =
  | 'idle'
  | 'running'
  | 'completed'
  | 'failed'
  | 'retrying'
  | 'ready'

/** Tracks a single video production job from submission to completion. */
export interface VideoProductionJob {
  id: string
  status: VideoProductionJobStatus
  creativeBrief: CreativeBrief
  videoProductionBrief?: VideoProductionBrief
  error?: string
  attempts: number
  employeeId: string
  providerId: string
  createdAt: Date
  updatedAt: Date
}

// ── Errors ─────────────────────────────────────────────────────────────────────

export type VideoProductionErrorCode =
  | 'PROVIDER_NOT_CONFIGURED'
  | 'PROVIDER_UNAVAILABLE'
  | 'TIMEOUT'
  | 'INVALID_RESPONSE'
  | 'MAX_RETRIES_EXCEEDED'
  | 'TRUST_ENGINE_DENIED'

export interface VideoProductionError {
  code: VideoProductionErrorCode
  message: string
  retriable: boolean
}

// ── Request ────────────────────────────────────────────────────────────────────

/** Everything needed to dispatch a video production job through the platform. */
export interface VideoProductionRequest {
  tenantId: TenantId
  organizationId: OrganizationId
  workforceId: WorkforceId
  engagementRunId: EngagementRunId
  creativeBrief: CreativeBrief
  /** Defaults to 'video-producer' (HeyGen primary). */
  preferredEmployee?: 'video-producer' | 'creative-video-director'
}

// ── Health ─────────────────────────────────────────────────────────────────────

export type VideoProductionProviderReadiness = 'ready' | 'not-configured' | 'error'

export interface VideoProductionProviderStatus {
  providerId: string
  name: string
  readiness: VideoProductionProviderReadiness
  purpose: string
  notes: string
}

export interface VideoProductionDepartmentHealth {
  overall: VideoProductionProviderReadiness
  videoProviders: VideoProductionProviderStatus[]
  voiceProvider: VideoProductionProviderStatus
  textProvider: VideoProductionProviderStatus
  readyForProduction: boolean
  readyForPlanGeneration: boolean
  configuredProviderCount: number
  totalProviderCount: number
}
