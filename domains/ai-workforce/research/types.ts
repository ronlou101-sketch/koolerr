import type { EngagementRunId, OrganizationId, TenantId, WorkforceId } from '@/shared/types'

// ── Input ──────────────────────────────────────────────────────────────────────

/** The customer's business profile — the starting point for every research job. */
export interface BusinessProfile {
  businessName: string
  businessCategory: string
  location: string
  website?: string
  serviceArea?: string
  notes?: string
}

// ── Output ─────────────────────────────────────────────────────────────────────

/**
 * A complete, structured research package produced by the Research Department.
 * Consumed directly by downstream departments (Strategy & Copy first).
 * All 12 research sections map to a distinct field — no free-form blobs.
 */
export interface ResearchBrief {
  companyOverview: string
  industryOverview: string
  localMarketAnalysis: string
  competitorAnalysis: string[]
  customerPainPoints: string[]
  frequentlyAskedQuestions: string[]
  seoOpportunities: string[]
  highPerformingContentTopics: string[]
  trendingSocialMediaIdeas: string[]
  recommendedMarketingAngles: string[]
  recommendedOffers: string[]
  recommendedCallsToAction: string[]
  generatedAt: Date
  sourceProfile: BusinessProfile
}

// ── Job ────────────────────────────────────────────────────────────────────────

/** Lifecycle states for a research job, visible via the Workforce Foundation health system. */
export type ResearchJobStatus = 'idle' | 'running' | 'completed' | 'failed' | 'retrying' | 'ready'

/** Tracks a single research job from submission to completion. Persisted in-memory. */
export interface ResearchJob {
  id: string
  status: ResearchJobStatus
  profile: BusinessProfile
  brief?: ResearchBrief
  error?: string
  attempts: number
  employeeId: string
  providerId: string
  createdAt: Date
  updatedAt: Date
}

// ── Errors ─────────────────────────────────────────────────────────────────────

export type ResearchErrorCode =
  | 'PROVIDER_NOT_CONFIGURED'
  | 'PROVIDER_UNAVAILABLE'
  | 'TIMEOUT'
  | 'INVALID_RESPONSE'
  | 'MAX_RETRIES_EXCEEDED'
  | 'TRUST_ENGINE_DENIED'

export interface ResearchError {
  code: ResearchErrorCode
  message: string
  retriable: boolean
}

// ── Request ────────────────────────────────────────────────────────────────────

/** Everything needed to dispatch a research job through the platform. */
export interface ResearchRequest {
  tenantId: TenantId
  organizationId: OrganizationId
  workforceId: WorkforceId
  engagementRunId: EngagementRunId
  profile: BusinessProfile
  /** Defaults to 'research-lead' (Manus). Use 'brand-researcher' (OpenAI) for brand-focused work. */
  preferredEmployee?: 'research-lead' | 'brand-researcher'
}
