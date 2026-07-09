import type { OrganizationId } from '@/shared/types'

// ── Objective ──────────────────────────────────────────────────────────────────

export type ObjectiveGoalType =
  | 'brand_awareness'
  | 'lead_generation'
  | 'user_acquisition'
  | 'retention'
  | 'revenue'

export type ObjectiveStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived'

export interface DogfoodingObjective {
  id: string
  organizationId: OrganizationId
  title: string
  description: string
  goalType: ObjectiveGoalType
  targetAudience: string | null
  successMetrics: string[]
  budgetCents: number
  status: ObjectiveStatus
  engagementRunId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateObjectiveInput {
  organizationId: OrganizationId
  title: string
  description: string
  goalType: ObjectiveGoalType
  targetAudience?: string
  successMetrics?: string[]
  budgetCents?: number
}

// ── Marketing Plan ─────────────────────────────────────────────────────────────

export type MarketingPlanStatus = 'draft' | 'approved' | 'archived'

export interface MarketingPlan {
  id: string
  organizationId: OrganizationId
  objectiveId: string
  title: string
  executiveSummary: string
  targetAudience: Record<string, unknown>
  messagingPillars: string[]
  channelMix: string[]
  campaignPhases: Record<string, unknown>[]
  kpis: string[]
  rawContent: string | null
  status: MarketingPlanStatus
  engagementRunId: string | null
  createdAt: Date
  updatedAt: Date
}

// ── Campaign ───────────────────────────────────────────────────────────────────

export type CampaignStatus = 'planning' | 'ready' | 'active' | 'paused' | 'completed' | 'archived'

export interface DogfoodingCampaign {
  id: string
  organizationId: OrganizationId
  objectiveId: string
  planId: string | null
  name: string
  objectiveSummary: string
  targetAudience: Record<string, unknown>
  budgetCents: number
  startDate: string | null
  endDate: string | null
  channels: string[]
  status: CampaignStatus
  metaCampaignId: string | null
  engagementRunId: string | null
  createdAt: Date
  updatedAt: Date
}

// ── Ad Copy Variant ────────────────────────────────────────────────────────────

export type CopyVariantStatus = 'draft' | 'approved' | 'rejected' | 'archived'

export interface AdCopyVariant {
  id: string
  organizationId: OrganizationId
  campaignId: string
  engagementRunId: string | null
  digitalEmployeeId: string | null
  modelProvider: string | null
  variantName: string
  headline: string
  primaryText: string
  callToAction: string
  description: string | null
  urlParameters: Record<string, unknown>
  status: CopyVariantStatus
  performanceScore: number | null
  createdAt: Date
  updatedAt: Date
}

// ── Creative ───────────────────────────────────────────────────────────────────

export type CreativeType = 'image' | 'video' | 'carousel' | 'story'
export type CreativeStatus = 'planned' | 'generating' | 'ready' | 'rejected' | 'archived'

export interface DogfoodingCreative {
  id: string
  organizationId: OrganizationId
  campaignId: string | null
  engagementRunId: string | null
  digitalEmployeeId: string | null
  modelProvider: string | null
  type: CreativeType
  prompt: string
  assetUrl: string | null
  thumbnailUrl: string | null
  metadata: Record<string, unknown>
  status: CreativeStatus
  createdAt: Date
  updatedAt: Date
}

// ── Learning ───────────────────────────────────────────────────────────────────

export type LearningType =
  | 'audience'
  | 'creative'
  | 'copy'
  | 'channel'
  | 'timing'
  | 'budget'
  | 'general'

export type LearningConfidence = 'low' | 'medium' | 'high'

export interface DogfoodingLearning {
  id: string
  organizationId: OrganizationId
  campaignId: string | null
  objectiveId: string | null
  learningType: LearningType
  insight: string
  confidence: LearningConfidence
  actionable: boolean
  applied: boolean
  extractedBy: string
  createdAt: Date
}

// ── Meta Connection (Phase 2 stub) ────────────────────────────────────────────

export type MetaConnectionStatus = 'connected' | 'disconnected' | 'expired' | 'revoked'

export interface MetaConnection {
  id: string
  organizationId: OrganizationId
  adAccountId: string | null
  pageId: string | null
  pixelId: string | null
  tokenExpiresAt: Date | null
  status: MetaConnectionStatus
  createdAt: Date
  updatedAt: Date
}

// ── IMediaExecutionAdapter (Phase 2 stub interface) ───────────────────────────

export interface MediaCampaignSpec {
  name: string
  objective: string
  budgetCents: number
  targeting: Record<string, unknown>
  adCreatives: Array<{
    headline: string
    primaryText: string
    imageUrl?: string
    videoUrl?: string
    callToAction: string
  }>
  startDate?: string
  endDate?: string
}

export interface MediaExecutionResult {
  externalCampaignId: string
  externalAdSetIds: string[]
  externalAdIds: string[]
  status: string
}

export interface IMediaExecutionAdapter {
  readonly platform: 'meta' | 'google' | 'tiktok'
  isConfigured(): boolean
  createCampaign(
    spec: MediaCampaignSpec,
    organizationId: OrganizationId
  ): Promise<MediaExecutionResult>
  pauseCampaign(externalCampaignId: string, organizationId: OrganizationId): Promise<void>
  getCampaignMetrics(
    externalCampaignId: string,
    organizationId: OrganizationId
  ): Promise<Record<string, unknown>>
}
