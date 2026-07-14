/**
 * Dogfooding Domain — Public Interface
 *
 * Owns: Internal Marketing Department objectives, campaigns, marketing plans,
 *       ad copy variants, creative direction, learnings, and Meta connections (Phase 2).
 *
 * This domain is Tower Control / Founder-only. It powers Koolerr's autonomous
 * internal marketing department — dogfooding Koolerr's own AI workforce platform
 * to grow Koolerr.
 *
 * Does not own: AI invocation (Model Gateway), workforce registration (Workforce Engine),
 *               business memory (Business Brain), billing, auth.
 *
 * Phase 1: Objectives, Marketing Plans, Campaigns, Copy, Creative Direction.
 * Phase 2: Meta API execution, Performance Snapshots, Budget Ledger.
 */

export type {
  ActorType,
  AdCopyVariant,
  ApprovalAssetType,
  ApprovalDecision,
  CalendarSlotStatus,
  CampaignApprovalEvent,
  CampaignAsset,
  CampaignAssetStatus,
  CampaignAssetType,
  CampaignCalendarSlot,
  CampaignCaption,
  CampaignHashtagSet,
  CampaignPublishEvent,
  CampaignScript,
  CampaignStatus,
  CaptionStatus,
  CopyVariantStatus,
  CreateCampaignApprovalEventInput,
  CreateCampaignAssetInput,
  CreateCampaignCalendarSlotInput,
  CreateCampaignCaptionInput,
  CreateCampaignHashtagSetInput,
  CreateCampaignPublishEventInput,
  CreateCampaignScriptInput,
  CreateObjectiveInput,
  CreativeStatus,
  CreativeType,
  DogfoodingCampaign,
  DogfoodingCreative,
  DogfoodingLearning,
  DogfoodingObjective,
  HashtagSetStatus,
  IMediaExecutionAdapter,
  LearningConfidence,
  LearningType,
  MarketingPlan,
  MarketingPlanStatus,
  MediaCampaignSpec,
  MediaExecutionResult,
  MetaConnection,
  MetaConnectionStatus,
  ObjectiveGoalType,
  ObjectiveStatus,
  PublishAction,
  PublishActorType,
  PublishStatus,
  ReachTier,
  ScriptStatus,
} from './types'

export type { IDogfoodingService } from './service'
export { dogfoodingService, _configureDogfoodingRepository } from './service'
export {
  findOrCreateInternalMarketingWorkforce,
  ensureMarketingTrustRules,
  MARKETING_AGENTS,
} from './workforce'
