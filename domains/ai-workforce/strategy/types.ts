import type { EngagementRunId, OrganizationId, TenantId, WorkforceId } from '@/shared/types'
import type { ResearchBrief } from '../research/types'

// ── Output ─────────────────────────────────────────────────────────────────────

/** A single customer persona derived from research insights. */
export interface CustomerPersona {
  name: string
  description: string
  painPoints: string[]
  goals: string[]
}

/** A week's content theme within the monthly calendar. */
export interface ContentCalendarEntry {
  week: number
  theme: string
  topics: string[]
}

/** Day-by-day content type recommendations for consistent weekly scheduling. */
export interface WeeklyPostingSchedule {
  monday?: string
  tuesday?: string
  wednesday?: string
  thursday?: string
  friday?: string
  saturday?: string
  sunday?: string
}

/**
 * A complete production blueprint produced by the Strategy Department.
 * Consumed directly by the Production Departments (Video, Voice, Creative).
 * Every section maps to a structured field — no unstructured blobs.
 * 18 sections covering everything from brand positioning to success metrics.
 */
export interface StrategyBrief {
  // ── Brand & Audience ────────────────────────────────────────────────────────
  brandPositioning: string
  coreMessaging: string
  targetAudience: string
  customerPersonas: CustomerPersona[]

  // ── Content Strategy ────────────────────────────────────────────────────────
  contentPillars: string[]
  monthlyContentCalendar: ContentCalendarEntry[]
  weeklyPostingSchedule: WeeklyPostingSchedule

  // ── Production Blueprints ───────────────────────────────────────────────────
  videoConcepts: string[]
  reelHooks: string[]
  scriptOutlines: string[]
  captionIdeas: string[]

  // ── Conversion Assets ───────────────────────────────────────────────────────
  ctaLibrary: string[]
  hashtagRecommendations: string[]
  campaignIdeas: string[]
  offerRecommendations: string[]

  // ── Creative & Execution ────────────────────────────────────────────────────
  creativeDirection: string
  productionNotes: string
  successMetrics: string[]

  generatedAt: Date
  sourceResearchBrief: ResearchBrief
}

// ── Job ────────────────────────────────────────────────────────────────────────

/** Lifecycle states for a strategy job, visible via the Workforce Foundation health system. */
export type StrategyJobStatus = 'idle' | 'running' | 'completed' | 'failed' | 'retrying' | 'ready'

/** Tracks a single strategy job from submission to completion. Persisted in-memory. */
export interface StrategyJob {
  id: string
  status: StrategyJobStatus
  researchBrief: ResearchBrief
  strategyBrief?: StrategyBrief
  error?: string
  attempts: number
  employeeId: string
  providerId: string
  createdAt: Date
  updatedAt: Date
}

// ── Errors ─────────────────────────────────────────────────────────────────────

export type StrategyErrorCode =
  | 'PROVIDER_NOT_CONFIGURED'
  | 'PROVIDER_UNAVAILABLE'
  | 'TIMEOUT'
  | 'INVALID_RESPONSE'
  | 'MAX_RETRIES_EXCEEDED'
  | 'TRUST_ENGINE_DENIED'

export interface StrategyError {
  code: StrategyErrorCode
  message: string
  retriable: boolean
}

// ── Request ────────────────────────────────────────────────────────────────────

/** Everything needed to dispatch a strategy job through the platform. */
export interface StrategyRequest {
  tenantId: TenantId
  organizationId: OrganizationId
  workforceId: WorkforceId
  engagementRunId: EngagementRunId
  researchBrief: ResearchBrief
  /** Defaults to 'content-strategist' (OpenAI). */
  preferredEmployee?: 'content-strategist' | 'senior-copywriter'
}
