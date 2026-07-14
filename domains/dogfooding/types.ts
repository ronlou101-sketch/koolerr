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

// ── Shared ─────────────────────────────────────────────────────────────────────

export type PublishStatus = 'unpublished' | 'scheduled' | 'published'

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
  approvalNote: string | null
  approvedAt: Date | null
  publishStatus: PublishStatus
  createdAt: Date
  updatedAt: Date
}

// ── Creative ───────────────────────────────────────────────────────────────────

export type CreativeType = 'image' | 'video' | 'carousel' | 'story'
export type CreativeStatus =
  | 'planned'
  | 'generating'
  | 'ready'
  | 'approved'
  | 'rejected'
  | 'archived'

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
  approvalNote: string | null
  approvedAt: Date | null
  publishStatus: PublishStatus
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

// ── Campaign Assets ────────────────────────────────────────────────────────────

export type CampaignAssetType = 'image' | 'video' | 'audio'
export type CampaignAssetStatus =
  | 'generating'
  | 'ready'
  | 'failed'
  | 'approved'
  | 'rejected'
  | 'published'

export interface CampaignAsset {
  id: string
  organizationId: OrganizationId
  campaignId: string
  engagementRunId: string | null
  digitalEmployeeId: string | null
  modelProvider: string
  creativeId: string | null
  type: CampaignAssetType
  subtype: string | null
  assetUrl: string | null
  thumbnailUrl: string | null
  metadata: Record<string, unknown>
  status: CampaignAssetStatus
  approvalNote: string | null
  approvedAt: Date | null
  publishStatus: PublishStatus
  version: number
  parentAssetId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateCampaignAssetInput {
  organizationId: OrganizationId
  campaignId: string
  engagementRunId?: string | null
  digitalEmployeeId?: string | null
  modelProvider: string
  creativeId?: string | null
  type: CampaignAssetType
  subtype?: string | null
  assetUrl?: string | null
  thumbnailUrl?: string | null
  metadata?: Record<string, unknown>
  status?: CampaignAssetStatus
  version?: number
  parentAssetId?: string | null
}

// ── Campaign Scripts ───────────────────────────────────────────────────────────

export type ScriptStatus = 'draft' | 'approved' | 'rejected'

export interface CampaignScript {
  id: string
  organizationId: OrganizationId
  campaignId: string
  engagementRunId: string | null
  digitalEmployeeId: string | null
  modelProvider: string | null
  title: string
  body: string
  platform: string | null
  estimatedDurationSec: number | null
  status: ScriptStatus
  approvalNote: string | null
  approvedAt: Date | null
  version: number
  parentScriptId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateCampaignScriptInput {
  organizationId: OrganizationId
  campaignId: string
  engagementRunId?: string | null
  digitalEmployeeId?: string | null
  modelProvider?: string | null
  title: string
  body: string
  platform?: string | null
  estimatedDurationSec?: number | null
  version?: number
  parentScriptId?: string | null
}

// ── Campaign Captions ──────────────────────────────────────────────────────────

export type CaptionStatus = 'draft' | 'approved' | 'rejected'

export interface CampaignCaption {
  id: string
  organizationId: OrganizationId
  campaignId: string
  engagementRunId: string | null
  digitalEmployeeId: string | null
  modelProvider: string | null
  platform: string
  body: string
  characterCount: number
  pairedAssetId: string | null
  status: CaptionStatus
  approvalNote: string | null
  approvedAt: Date | null
  version: number
  parentCaptionId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateCampaignCaptionInput {
  organizationId: OrganizationId
  campaignId: string
  engagementRunId?: string | null
  digitalEmployeeId?: string | null
  modelProvider?: string | null
  platform: string
  body: string
  characterCount?: number
  pairedAssetId?: string | null
  version?: number
  parentCaptionId?: string | null
}

// ── Campaign Hashtag Sets ──────────────────────────────────────────────────────

export type ReachTier = 'niche' | 'mid' | 'broad'
export type HashtagSetStatus = 'draft' | 'approved' | 'rejected'

export interface CampaignHashtagSet {
  id: string
  organizationId: OrganizationId
  campaignId: string
  engagementRunId: string | null
  digitalEmployeeId: string | null
  modelProvider: string | null
  platform: string
  name: string
  tags: string[]
  reachTier: ReachTier
  status: HashtagSetStatus
  approvalNote: string | null
  approvedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateCampaignHashtagSetInput {
  organizationId: OrganizationId
  campaignId: string
  engagementRunId?: string | null
  digitalEmployeeId?: string | null
  modelProvider?: string | null
  platform: string
  name: string
  tags: string[]
  reachTier?: ReachTier
}

// ── Campaign Calendar Slots ────────────────────────────────────────────────────

export type CalendarSlotStatus = 'draft' | 'scheduled' | 'published' | 'missed' | 'cancelled'

export interface CampaignCalendarSlot {
  id: string
  organizationId: OrganizationId
  campaignId: string
  scheduledAt: Date
  platform: string
  assetId: string | null
  copyVariantId: string | null
  captionId: string | null
  hashtagSetId: string | null
  status: CalendarSlotStatus
  publishedAt: Date | null
  publishedBy: string | null
  livePostUrl: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateCampaignCalendarSlotInput {
  organizationId: OrganizationId
  campaignId: string
  scheduledAt: Date
  platform: string
  assetId?: string | null
  copyVariantId?: string | null
  captionId?: string | null
  hashtagSetId?: string | null
}

// ── Campaign Approval Events ───────────────────────────────────────────────────

export type ApprovalDecision = 'approved' | 'rejected' | 'reset_to_draft'
export type ApprovalAssetType =
  | 'ad_copy_variant'
  | 'creative'
  | 'asset'
  | 'script'
  | 'caption'
  | 'hashtag_set'
export type ActorType = 'user' | 'digital_employee'

export interface CampaignApprovalEvent {
  id: string
  organizationId: OrganizationId
  campaignId: string
  assetType: ApprovalAssetType
  assetId: string
  decision: ApprovalDecision
  note: string | null
  actorType: ActorType
  actorId: string
  engagementRunId: string | null
  createdAt: Date
}

export interface CreateCampaignApprovalEventInput {
  organizationId: OrganizationId
  campaignId: string
  assetType: ApprovalAssetType
  assetId: string
  decision: ApprovalDecision
  note?: string | null
  actorType: ActorType
  actorId: string
  engagementRunId?: string | null
}

// ── Campaign Publish Events ────────────────────────────────────────────────────

export type PublishAction = 'published' | 'unpublished' | 'scheduled' | 'cancelled'
export type PublishActorType = 'user' | 'automation'

export interface CampaignPublishEvent {
  id: string
  organizationId: OrganizationId
  campaignId: string
  calendarSlotId: string | null
  assetType: ApprovalAssetType
  assetId: string
  platform: string
  action: PublishAction
  actorType: PublishActorType
  actorId: string
  livePostUrl: string | null
  publishedAt: Date
}

export interface CreateCampaignPublishEventInput {
  organizationId: OrganizationId
  campaignId: string
  calendarSlotId?: string | null
  assetType: ApprovalAssetType
  assetId: string
  platform: string
  action: PublishAction
  actorType: PublishActorType
  actorId: string
  livePostUrl?: string | null
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
