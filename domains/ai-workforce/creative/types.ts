import type { EngagementRunId, OrganizationId, TenantId, WorkforceId } from '@/shared/types'
import type { StrategyBrief } from '../strategy/types'

// ── Output ─────────────────────────────────────────────────────────────────────

/**
 * A complete production blueprint produced by the Creative Department.
 *
 * The CreativeBrief is the handoff document between strategy and production.
 * Every field maps directly to a production action:
 *   - videoPrompts[]    → HeyGen (Phase 4)
 *   - scenePrompts[]    → Higgsfield (Phase 4)
 *   - imagePrompts[]    → Higgsfield (Phase 4)
 *   - voiceDirection    → ElevenLabs Voice Department (Phase 4)
 *   - avatarDirection   → HeyGen avatar configuration (Phase 4)
 *
 * 17 structured sections covering every dimension of creative production.
 */
export interface CreativeBrief {
  // ── Visual Identity ─────────────────────────────────────────────────────────
  visualStyle: string
  brandingGuidelines: string

  // ── Production Direction ────────────────────────────────────────────────────
  avatarDirection: string
  voiceDirection: string

  // ── Shot & Scene Planning ───────────────────────────────────────────────────
  shotList: string[]
  storyboard: string[]
  scenePrompts: string[]

  // ── AI Generation Prompts ───────────────────────────────────────────────────
  imagePrompts: string[]
  videoPrompts: string[]

  // ── Social & Hook Content ───────────────────────────────────────────────────
  hookVariations: string[]
  thumbnailIdeas: string[]
  bRollIdeas: string[]

  // ── Audio & Motion ──────────────────────────────────────────────────────────
  musicDirection: string
  motionGraphics: string

  // ── Conversion & Distribution ───────────────────────────────────────────────
  callToAction: string
  editingInstructions: string
  publishingAssets: string[]

  generatedAt: Date
  sourceStrategyBrief: StrategyBrief
}

// ── Job ────────────────────────────────────────────────────────────────────────

/** Lifecycle states for a creative job, visible via the Workforce Foundation health system. */
export type CreativeJobStatus = 'idle' | 'running' | 'completed' | 'failed' | 'retrying' | 'ready'

/** Tracks a single creative job from submission to completion. Persisted in-memory. */
export interface CreativeJob {
  id: string
  status: CreativeJobStatus
  strategyBrief: StrategyBrief
  creativeBrief?: CreativeBrief
  error?: string
  attempts: number
  employeeId: string
  providerId: string
  createdAt: Date
  updatedAt: Date
}

// ── Errors ─────────────────────────────────────────────────────────────────────

export type CreativeErrorCode =
  | 'PROVIDER_NOT_CONFIGURED'
  | 'PROVIDER_UNAVAILABLE'
  | 'TIMEOUT'
  | 'INVALID_RESPONSE'
  | 'MAX_RETRIES_EXCEEDED'
  | 'TRUST_ENGINE_DENIED'

export interface CreativeError {
  code: CreativeErrorCode
  message: string
  retriable: boolean
}

// ── Request ────────────────────────────────────────────────────────────────────

/** Everything needed to dispatch a creative job through the platform. */
export interface CreativeRequest {
  tenantId: TenantId
  organizationId: OrganizationId
  workforceId: WorkforceId
  engagementRunId: EngagementRunId
  strategyBrief: StrategyBrief
  /** Defaults to 'creative-director'. */
  preferredEmployee?: 'creative-director' | 'creative-video-director'
}

// ── Health ─────────────────────────────────────────────────────────────────────

export type CreativeProviderReadiness = 'ready' | 'not-configured' | 'error'

export interface CreativeProviderStatus {
  providerId: string
  name: string
  readiness: CreativeProviderReadiness
  purpose: string
  notes: string
}

export interface CreativeDepartmentHealth {
  overall: CreativeProviderReadiness
  videoProviders: CreativeProviderStatus[]
  voiceProvider: CreativeProviderStatus
  textProvider: CreativeProviderStatus
  readyForProduction: boolean
  readyForBriefGeneration: boolean
  configuredProviderCount: number
  totalProviderCount: number
}
