import type { SupabaseClient } from '@supabase/supabase-js'
import type { OrganizationId } from '@/shared/types'
import type { IDogfoodingRepository } from './repository'
import type {
  ActorType,
  AdCopyVariant,
  ApprovalAssetType,
  ApprovalDecision,
  CampaignApprovalEvent,
  CampaignAsset,
  CampaignAssetStatus,
  CampaignCalendarSlot,
  CampaignCaption,
  CampaignHashtagSet,
  CampaignPublishEvent,
  CampaignScript,
  CaptionStatus,
  CreateCampaignApprovalEventInput,
  CreateCampaignAssetInput,
  CreateCampaignCalendarSlotInput,
  CreateCampaignCaptionInput,
  CreateCampaignHashtagSetInput,
  CreateCampaignPublishEventInput,
  CreateCampaignScriptInput,
  CreateObjectiveInput,
  DogfoodingCampaign,
  DogfoodingCreative,
  DogfoodingLearning,
  DogfoodingObjective,
  HashtagSetStatus,
  MarketingPlan,
  MetaConnection,
  PublishActorType,
  PublishAction,
  PublishStatus,
  ReachTier,
  ScriptStatus,
  CalendarSlotStatus,
  CampaignAssetType,
} from './types'

function toObjective(row: Record<string, unknown>): DogfoodingObjective {
  return {
    id: row.id as string,
    organizationId: row.organization_id as OrganizationId,
    title: row.title as string,
    description: row.description as string,
    goalType: row.goal_type as DogfoodingObjective['goalType'],
    targetAudience: (row.target_audience as string | null) ?? null,
    successMetrics: (row.success_metrics as string[]) ?? [],
    budgetCents: (row.budget_cents as number) ?? 0,
    status: row.status as DogfoodingObjective['status'],
    engagementRunId: (row.engagement_run_id as string | null) ?? null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

function toPlan(row: Record<string, unknown>): MarketingPlan {
  return {
    id: row.id as string,
    organizationId: row.organization_id as OrganizationId,
    objectiveId: row.objective_id as string,
    title: row.title as string,
    executiveSummary: row.executive_summary as string,
    targetAudience: (row.target_audience as Record<string, unknown>) ?? {},
    messagingPillars: (row.messaging_pillars as string[]) ?? [],
    channelMix: (row.channel_mix as string[]) ?? [],
    campaignPhases: (row.campaign_phases as Record<string, unknown>[]) ?? [],
    kpis: (row.kpis as string[]) ?? [],
    rawContent: (row.raw_content as string | null) ?? null,
    status: row.status as MarketingPlan['status'],
    engagementRunId: (row.engagement_run_id as string | null) ?? null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

function toCampaign(row: Record<string, unknown>): DogfoodingCampaign {
  return {
    id: row.id as string,
    organizationId: row.organization_id as OrganizationId,
    objectiveId: row.objective_id as string,
    planId: (row.plan_id as string | null) ?? null,
    name: row.name as string,
    objectiveSummary: row.objective_summary as string,
    targetAudience: (row.target_audience as Record<string, unknown>) ?? {},
    budgetCents: (row.budget_cents as number) ?? 0,
    startDate: (row.start_date as string | null) ?? null,
    endDate: (row.end_date as string | null) ?? null,
    channels: (row.channels as string[]) ?? [],
    status: row.status as DogfoodingCampaign['status'],
    metaCampaignId: (row.meta_campaign_id as string | null) ?? null,
    engagementRunId: (row.engagement_run_id as string | null) ?? null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

function toVariant(row: Record<string, unknown>): AdCopyVariant {
  return {
    id: row.id as string,
    organizationId: row.organization_id as OrganizationId,
    campaignId: row.campaign_id as string,
    engagementRunId: (row.engagement_run_id as string | null) ?? null,
    digitalEmployeeId: (row.digital_employee_id as string | null) ?? null,
    modelProvider: (row.model_provider as string | null) ?? null,
    variantName: row.variant_name as string,
    headline: row.headline as string,
    primaryText: row.primary_text as string,
    callToAction: row.call_to_action as string,
    description: (row.description as string | null) ?? null,
    urlParameters: (row.url_parameters as Record<string, unknown>) ?? {},
    status: row.status as AdCopyVariant['status'],
    performanceScore: (row.performance_score as number | null) ?? null,
    approvalNote: (row.approval_note as string | null) ?? null,
    approvedAt: row.approved_at ? new Date(row.approved_at as string) : null,
    publishStatus: (row.publish_status as PublishStatus) ?? 'unpublished',
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

function toCreative(row: Record<string, unknown>): DogfoodingCreative {
  return {
    id: row.id as string,
    organizationId: row.organization_id as OrganizationId,
    campaignId: (row.campaign_id as string | null) ?? null,
    engagementRunId: (row.engagement_run_id as string | null) ?? null,
    digitalEmployeeId: (row.digital_employee_id as string | null) ?? null,
    modelProvider: (row.model_provider as string | null) ?? null,
    type: row.type as DogfoodingCreative['type'],
    prompt: row.prompt as string,
    assetUrl: (row.asset_url as string | null) ?? null,
    thumbnailUrl: (row.thumbnail_url as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    status: row.status as DogfoodingCreative['status'],
    approvalNote: (row.approval_note as string | null) ?? null,
    approvedAt: row.approved_at ? new Date(row.approved_at as string) : null,
    publishStatus: (row.publish_status as PublishStatus) ?? 'unpublished',
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

function toCampaignAsset(row: Record<string, unknown>): CampaignAsset {
  return {
    id: row.id as string,
    organizationId: row.organization_id as OrganizationId,
    campaignId: row.campaign_id as string,
    engagementRunId: (row.engagement_run_id as string | null) ?? null,
    digitalEmployeeId: (row.digital_employee_id as string | null) ?? null,
    modelProvider: row.model_provider as string,
    creativeId: (row.creative_id as string | null) ?? null,
    type: row.type as CampaignAssetType,
    subtype: (row.subtype as string | null) ?? null,
    assetUrl: (row.asset_url as string | null) ?? null,
    thumbnailUrl: (row.thumbnail_url as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    status: row.status as CampaignAssetStatus,
    approvalNote: (row.approval_note as string | null) ?? null,
    approvedAt: row.approved_at ? new Date(row.approved_at as string) : null,
    publishStatus: (row.publish_status as PublishStatus) ?? 'unpublished',
    version: (row.version as number) ?? 1,
    parentAssetId: (row.parent_asset_id as string | null) ?? null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

function toCampaignScript(row: Record<string, unknown>): CampaignScript {
  return {
    id: row.id as string,
    organizationId: row.organization_id as OrganizationId,
    campaignId: row.campaign_id as string,
    engagementRunId: (row.engagement_run_id as string | null) ?? null,
    digitalEmployeeId: (row.digital_employee_id as string | null) ?? null,
    modelProvider: (row.model_provider as string | null) ?? null,
    title: row.title as string,
    body: row.body as string,
    platform: (row.platform as string | null) ?? null,
    estimatedDurationSec: (row.estimated_duration_sec as number | null) ?? null,
    status: row.status as ScriptStatus,
    approvalNote: (row.approval_note as string | null) ?? null,
    approvedAt: row.approved_at ? new Date(row.approved_at as string) : null,
    version: (row.version as number) ?? 1,
    parentScriptId: (row.parent_script_id as string | null) ?? null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

function toCampaignCaption(row: Record<string, unknown>): CampaignCaption {
  return {
    id: row.id as string,
    organizationId: row.organization_id as OrganizationId,
    campaignId: row.campaign_id as string,
    engagementRunId: (row.engagement_run_id as string | null) ?? null,
    digitalEmployeeId: (row.digital_employee_id as string | null) ?? null,
    modelProvider: (row.model_provider as string | null) ?? null,
    platform: row.platform as string,
    body: row.body as string,
    characterCount: (row.character_count as number) ?? 0,
    pairedAssetId: (row.paired_asset_id as string | null) ?? null,
    status: row.status as CaptionStatus,
    approvalNote: (row.approval_note as string | null) ?? null,
    approvedAt: row.approved_at ? new Date(row.approved_at as string) : null,
    version: (row.version as number) ?? 1,
    parentCaptionId: (row.parent_caption_id as string | null) ?? null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

function toCampaignHashtagSet(row: Record<string, unknown>): CampaignHashtagSet {
  return {
    id: row.id as string,
    organizationId: row.organization_id as OrganizationId,
    campaignId: row.campaign_id as string,
    engagementRunId: (row.engagement_run_id as string | null) ?? null,
    digitalEmployeeId: (row.digital_employee_id as string | null) ?? null,
    modelProvider: (row.model_provider as string | null) ?? null,
    platform: row.platform as string,
    name: row.name as string,
    tags: (row.tags as string[]) ?? [],
    reachTier: (row.reach_tier as ReachTier) ?? 'mid',
    status: row.status as HashtagSetStatus,
    approvalNote: (row.approval_note as string | null) ?? null,
    approvedAt: row.approved_at ? new Date(row.approved_at as string) : null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

function toCampaignCalendarSlot(row: Record<string, unknown>): CampaignCalendarSlot {
  return {
    id: row.id as string,
    organizationId: row.organization_id as OrganizationId,
    campaignId: row.campaign_id as string,
    scheduledAt: new Date(row.scheduled_at as string),
    platform: row.platform as string,
    assetId: (row.asset_id as string | null) ?? null,
    copyVariantId: (row.copy_variant_id as string | null) ?? null,
    captionId: (row.caption_id as string | null) ?? null,
    hashtagSetId: (row.hashtag_set_id as string | null) ?? null,
    status: row.status as CalendarSlotStatus,
    publishedAt: row.published_at ? new Date(row.published_at as string) : null,
    publishedBy: (row.published_by as string | null) ?? null,
    livePostUrl: (row.live_post_url as string | null) ?? null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

function toCampaignApprovalEvent(row: Record<string, unknown>): CampaignApprovalEvent {
  return {
    id: row.id as string,
    organizationId: row.organization_id as OrganizationId,
    campaignId: row.campaign_id as string,
    assetType: row.asset_type as ApprovalAssetType,
    assetId: row.asset_id as string,
    decision: row.decision as ApprovalDecision,
    note: (row.note as string | null) ?? null,
    actorType: row.actor_type as ActorType,
    actorId: row.actor_id as string,
    engagementRunId: (row.engagement_run_id as string | null) ?? null,
    createdAt: new Date(row.created_at as string),
  }
}

function toCampaignPublishEvent(row: Record<string, unknown>): CampaignPublishEvent {
  return {
    id: row.id as string,
    organizationId: row.organization_id as OrganizationId,
    campaignId: row.campaign_id as string,
    calendarSlotId: (row.calendar_slot_id as string | null) ?? null,
    assetType: row.asset_type as ApprovalAssetType,
    assetId: row.asset_id as string,
    platform: row.platform as string,
    action: row.action as PublishAction,
    actorType: row.actor_type as PublishActorType,
    actorId: row.actor_id as string,
    livePostUrl: (row.live_post_url as string | null) ?? null,
    publishedAt: new Date(row.published_at as string),
  }
}

function toLearning(row: Record<string, unknown>): DogfoodingLearning {
  return {
    id: row.id as string,
    organizationId: row.organization_id as OrganizationId,
    campaignId: (row.campaign_id as string | null) ?? null,
    objectiveId: (row.objective_id as string | null) ?? null,
    learningType: row.learning_type as DogfoodingLearning['learningType'],
    insight: row.insight as string,
    confidence: row.confidence as DogfoodingLearning['confidence'],
    actionable: row.actionable as boolean,
    applied: row.applied as boolean,
    extractedBy: row.extracted_by as string,
    createdAt: new Date(row.created_at as string),
  }
}

function toMetaConnection(row: Record<string, unknown>): MetaConnection {
  return {
    id: row.id as string,
    organizationId: row.organization_id as OrganizationId,
    adAccountId: (row.ad_account_id as string | null) ?? null,
    pageId: (row.page_id as string | null) ?? null,
    pixelId: (row.pixel_id as string | null) ?? null,
    tokenExpiresAt: row.token_expires_at ? new Date(row.token_expires_at as string) : null,
    status: row.status as MetaConnection['status'],
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

export class SupabaseDogfoodingRepository implements IDogfoodingRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async createObjective(input: CreateObjectiveInput): Promise<DogfoodingObjective> {
    const { data, error } = await this.supabase
      .from('dogfooding_objectives')
      .insert({
        organization_id: input.organizationId,
        title: input.title,
        description: input.description,
        goal_type: input.goalType,
        target_audience: input.targetAudience ?? null,
        success_metrics: input.successMetrics ?? [],
        budget_cents: input.budgetCents ?? 0,
        status: 'draft',
      })
      .select()
      .single()
    if (error) throw new Error(`[DOGFOODING_REPO] createObjective: ${error.message}`)
    return toObjective(data as Record<string, unknown>)
  }

  async findObjectiveById(
    id: string,
    organizationId: OrganizationId
  ): Promise<DogfoodingObjective | null> {
    const { data, error } = await this.supabase
      .from('dogfooding_objectives')
      .select()
      .eq('id', id)
      .eq('organization_id', organizationId)
      .maybeSingle()
    if (error) throw new Error(`[DOGFOODING_REPO] findObjectiveById: ${error.message}`)
    return data ? toObjective(data as Record<string, unknown>) : null
  }

  async listObjectives(organizationId: OrganizationId): Promise<DogfoodingObjective[]> {
    const { data, error } = await this.supabase
      .from('dogfooding_objectives')
      .select()
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(`[DOGFOODING_REPO] listObjectives: ${error.message}`)
    return ((data as Record<string, unknown>[]) ?? []).map(toObjective)
  }

  async updateObjectiveStatus(
    id: string,
    status: DogfoodingObjective['status'],
    engagementRunId?: string
  ): Promise<DogfoodingObjective> {
    const patch: Record<string, unknown> = { status }
    if (engagementRunId) patch.engagement_run_id = engagementRunId
    const { data, error } = await this.supabase
      .from('dogfooding_objectives')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(`[DOGFOODING_REPO] updateObjectiveStatus: ${error.message}`)
    return toObjective(data as Record<string, unknown>)
  }

  async createMarketingPlan(
    plan: Omit<MarketingPlan, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<MarketingPlan> {
    const { data, error } = await this.supabase
      .from('dogfooding_marketing_plans')
      .insert({
        organization_id: plan.organizationId,
        objective_id: plan.objectiveId,
        title: plan.title,
        executive_summary: plan.executiveSummary,
        target_audience: plan.targetAudience,
        messaging_pillars: plan.messagingPillars,
        channel_mix: plan.channelMix,
        campaign_phases: plan.campaignPhases,
        kpis: plan.kpis,
        raw_content: plan.rawContent,
        status: plan.status,
        engagement_run_id: plan.engagementRunId,
      })
      .select()
      .single()
    if (error) throw new Error(`[DOGFOODING_REPO] createMarketingPlan: ${error.message}`)
    return toPlan(data as Record<string, unknown>)
  }

  async findMarketingPlanByObjective(
    objectiveId: string,
    organizationId: OrganizationId
  ): Promise<MarketingPlan | null> {
    const { data, error } = await this.supabase
      .from('dogfooding_marketing_plans')
      .select()
      .eq('objective_id', objectiveId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw new Error(`[DOGFOODING_REPO] findMarketingPlanByObjective: ${error.message}`)
    return data ? toPlan(data as Record<string, unknown>) : null
  }

  async createCampaign(
    campaign: Omit<DogfoodingCampaign, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DogfoodingCampaign> {
    const { data, error } = await this.supabase
      .from('dogfooding_campaigns')
      .insert({
        organization_id: campaign.organizationId,
        objective_id: campaign.objectiveId,
        plan_id: campaign.planId,
        name: campaign.name,
        objective_summary: campaign.objectiveSummary,
        target_audience: campaign.targetAudience,
        budget_cents: campaign.budgetCents,
        start_date: campaign.startDate,
        end_date: campaign.endDate,
        channels: campaign.channels,
        status: campaign.status,
        meta_campaign_id: campaign.metaCampaignId,
        engagement_run_id: campaign.engagementRunId,
      })
      .select()
      .single()
    if (error) throw new Error(`[DOGFOODING_REPO] createCampaign: ${error.message}`)
    return toCampaign(data as Record<string, unknown>)
  }

  async listCampaigns(organizationId: OrganizationId): Promise<DogfoodingCampaign[]> {
    const { data, error } = await this.supabase
      .from('dogfooding_campaigns')
      .select()
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(`[DOGFOODING_REPO] listCampaigns: ${error.message}`)
    return ((data as Record<string, unknown>[]) ?? []).map(toCampaign)
  }

  async listCampaignsByObjective(
    objectiveId: string,
    organizationId: OrganizationId
  ): Promise<DogfoodingCampaign[]> {
    const { data, error } = await this.supabase
      .from('dogfooding_campaigns')
      .select()
      .eq('objective_id', objectiveId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(`[DOGFOODING_REPO] listCampaignsByObjective: ${error.message}`)
    return ((data as Record<string, unknown>[]) ?? []).map(toCampaign)
  }

  async updateCampaignStatus(
    id: string,
    status: DogfoodingCampaign['status']
  ): Promise<DogfoodingCampaign> {
    const { data, error } = await this.supabase
      .from('dogfooding_campaigns')
      .update({ status })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(`[DOGFOODING_REPO] updateCampaignStatus: ${error.message}`)
    return toCampaign(data as Record<string, unknown>)
  }

  async updateCampaignDetails(
    id: string,
    updates: { planId?: string; engagementRunId?: string }
  ): Promise<DogfoodingCampaign> {
    const patch: Record<string, unknown> = {}
    if (updates.planId !== undefined) patch.plan_id = updates.planId
    if (updates.engagementRunId !== undefined) patch.engagement_run_id = updates.engagementRunId
    const { data, error } = await this.supabase
      .from('dogfooding_campaigns')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(`[DOGFOODING_REPO] updateCampaignDetails: ${error.message}`)
    return toCampaign(data as Record<string, unknown>)
  }

  async createAdCopyVariant(
    variant: Omit<
      AdCopyVariant,
      'id' | 'createdAt' | 'updatedAt' | 'approvalNote' | 'approvedAt' | 'publishStatus'
    >
  ): Promise<AdCopyVariant> {
    const { data, error } = await this.supabase
      .from('dogfooding_ad_copy_variants')
      .insert({
        organization_id: variant.organizationId,
        campaign_id: variant.campaignId,
        engagement_run_id: variant.engagementRunId,
        digital_employee_id: variant.digitalEmployeeId,
        model_provider: variant.modelProvider,
        variant_name: variant.variantName,
        headline: variant.headline,
        primary_text: variant.primaryText,
        call_to_action: variant.callToAction,
        description: variant.description,
        url_parameters: variant.urlParameters,
        status: variant.status,
        performance_score: variant.performanceScore,
      })
      .select()
      .single()
    if (error) throw new Error(`[DOGFOODING_REPO] createAdCopyVariant: ${error.message}`)
    return toVariant(data as Record<string, unknown>)
  }

  async listAdCopyVariants(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<AdCopyVariant[]> {
    const { data, error } = await this.supabase
      .from('dogfooding_ad_copy_variants')
      .select()
      .eq('campaign_id', campaignId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true })
    if (error) throw new Error(`[DOGFOODING_REPO] listAdCopyVariants: ${error.message}`)
    return ((data as Record<string, unknown>[]) ?? []).map(toVariant)
  }

  async listAllCopyVariants(organizationId: OrganizationId): Promise<AdCopyVariant[]> {
    const { data, error } = await this.supabase
      .from('dogfooding_ad_copy_variants')
      .select()
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(`[DOGFOODING_REPO] listAllCopyVariants: ${error.message}`)
    return ((data as Record<string, unknown>[]) ?? []).map(toVariant)
  }

  async createCreative(
    creative: Omit<
      DogfoodingCreative,
      'id' | 'createdAt' | 'updatedAt' | 'approvalNote' | 'approvedAt' | 'publishStatus'
    >
  ): Promise<DogfoodingCreative> {
    const { data, error } = await this.supabase
      .from('dogfooding_creatives')
      .insert({
        organization_id: creative.organizationId,
        campaign_id: creative.campaignId,
        engagement_run_id: creative.engagementRunId,
        digital_employee_id: creative.digitalEmployeeId,
        model_provider: creative.modelProvider,
        type: creative.type,
        prompt: creative.prompt,
        asset_url: creative.assetUrl,
        thumbnail_url: creative.thumbnailUrl,
        metadata: creative.metadata,
        status: creative.status,
      })
      .select()
      .single()
    if (error) throw new Error(`[DOGFOODING_REPO] createCreative: ${error.message}`)
    return toCreative(data as Record<string, unknown>)
  }

  async listCreatives(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<DogfoodingCreative[]> {
    const { data, error } = await this.supabase
      .from('dogfooding_creatives')
      .select()
      .eq('campaign_id', campaignId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true })
    if (error) throw new Error(`[DOGFOODING_REPO] listCreatives: ${error.message}`)
    return ((data as Record<string, unknown>[]) ?? []).map(toCreative)
  }

  async listAllCreatives(organizationId: OrganizationId): Promise<DogfoodingCreative[]> {
    const { data, error } = await this.supabase
      .from('dogfooding_creatives')
      .select()
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(`[DOGFOODING_REPO] listAllCreatives: ${error.message}`)
    return ((data as Record<string, unknown>[]) ?? []).map(toCreative)
  }

  async createLearning(
    learning: Omit<DogfoodingLearning, 'id' | 'createdAt'>
  ): Promise<DogfoodingLearning> {
    const { data, error } = await this.supabase
      .from('dogfooding_learnings')
      .insert({
        organization_id: learning.organizationId,
        campaign_id: learning.campaignId,
        objective_id: learning.objectiveId,
        learning_type: learning.learningType,
        insight: learning.insight,
        confidence: learning.confidence,
        actionable: learning.actionable,
        applied: learning.applied,
        extracted_by: learning.extractedBy,
      })
      .select()
      .single()
    if (error) throw new Error(`[DOGFOODING_REPO] createLearning: ${error.message}`)
    return toLearning(data as Record<string, unknown>)
  }

  async listLearnings(organizationId: OrganizationId): Promise<DogfoodingLearning[]> {
    const { data, error } = await this.supabase
      .from('dogfooding_learnings')
      .select()
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(`[DOGFOODING_REPO] listLearnings: ${error.message}`)
    return ((data as Record<string, unknown>[]) ?? []).map(toLearning)
  }

  async getMetaConnection(organizationId: OrganizationId): Promise<MetaConnection | null> {
    const { data, error } = await this.supabase
      .from('dogfooding_meta_connections')
      .select()
      .eq('organization_id', organizationId)
      .maybeSingle()
    if (error) throw new Error(`[DOGFOODING_REPO] getMetaConnection: ${error.message}`)
    return data ? toMetaConnection(data as Record<string, unknown>) : null
  }

  async upsertMetaConnection(
    connection: Omit<MetaConnection, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<MetaConnection> {
    const { data, error } = await this.supabase
      .from('dogfooding_meta_connections')
      .upsert(
        {
          organization_id: connection.organizationId,
          ad_account_id: connection.adAccountId,
          page_id: connection.pageId,
          pixel_id: connection.pixelId,
          token_expires_at: connection.tokenExpiresAt?.toISOString() ?? null,
          status: connection.status,
        },
        { onConflict: 'organization_id' }
      )
      .select()
      .single()
    if (error) throw new Error(`[DOGFOODING_REPO] upsertMetaConnection: ${error.message}`)
    return toMetaConnection(data as Record<string, unknown>)
  }

  async approveAdCopyVariant(
    id: string,
    note: string | null,
    organizationId: OrganizationId
  ): Promise<AdCopyVariant> {
    const { data, error } = await this.supabase
      .from('dogfooding_ad_copy_variants')
      .update({ status: 'approved', approval_note: note, approved_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single()
    if (error) throw new Error(`[DOGFOODING_REPO] approveAdCopyVariant: ${error.message}`)
    return toVariant(data as Record<string, unknown>)
  }

  async rejectAdCopyVariant(
    id: string,
    note: string | null,
    organizationId: OrganizationId
  ): Promise<AdCopyVariant> {
    const { data, error } = await this.supabase
      .from('dogfooding_ad_copy_variants')
      .update({ status: 'rejected', approval_note: note })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single()
    if (error) throw new Error(`[DOGFOODING_REPO] rejectAdCopyVariant: ${error.message}`)
    return toVariant(data as Record<string, unknown>)
  }

  async approveCreative(
    id: string,
    note: string | null,
    organizationId: OrganizationId
  ): Promise<DogfoodingCreative> {
    const { data, error } = await this.supabase
      .from('dogfooding_creatives')
      .update({ status: 'approved', approval_note: note, approved_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single()
    if (error) throw new Error(`[DOGFOODING_REPO] approveCreative: ${error.message}`)
    return toCreative(data as Record<string, unknown>)
  }

  async rejectCreative(
    id: string,
    note: string | null,
    organizationId: OrganizationId
  ): Promise<DogfoodingCreative> {
    const { data, error } = await this.supabase
      .from('dogfooding_creatives')
      .update({ status: 'rejected', approval_note: note })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single()
    if (error) throw new Error(`[DOGFOODING_REPO] rejectCreative: ${error.message}`)
    return toCreative(data as Record<string, unknown>)
  }

  async createCampaignAsset(input: CreateCampaignAssetInput): Promise<CampaignAsset> {
    const { data, error } = await this.supabase
      .from('campaign_assets')
      .insert({
        organization_id: input.organizationId,
        campaign_id: input.campaignId,
        engagement_run_id: input.engagementRunId ?? null,
        digital_employee_id: input.digitalEmployeeId ?? null,
        model_provider: input.modelProvider,
        creative_id: input.creativeId ?? null,
        type: input.type,
        subtype: input.subtype ?? null,
        asset_url: input.assetUrl ?? null,
        thumbnail_url: input.thumbnailUrl ?? null,
        metadata: input.metadata ?? {},
        status: input.status ?? 'generating',
        version: input.version ?? 1,
        parent_asset_id: input.parentAssetId ?? null,
      })
      .select()
      .single()
    if (error) throw new Error(`[DOGFOODING_REPO] createCampaignAsset: ${error.message}`)
    return toCampaignAsset(data as Record<string, unknown>)
  }

  async findCampaignAssetById(
    id: string,
    organizationId: OrganizationId
  ): Promise<CampaignAsset | null> {
    const { data, error } = await this.supabase
      .from('campaign_assets')
      .select()
      .eq('id', id)
      .eq('organization_id', organizationId)
      .maybeSingle()
    if (error) throw new Error(`[DOGFOODING_REPO] findCampaignAssetById: ${error.message}`)
    return data ? toCampaignAsset(data as Record<string, unknown>) : null
  }

  async listCampaignAssets(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<CampaignAsset[]> {
    const { data, error } = await this.supabase
      .from('campaign_assets')
      .select()
      .eq('campaign_id', campaignId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true })
    if (error) throw new Error(`[DOGFOODING_REPO] listCampaignAssets: ${error.message}`)
    return ((data as Record<string, unknown>[]) ?? []).map(toCampaignAsset)
  }

  async updateCampaignAssetStatus(
    id: string,
    status: CampaignAssetStatus,
    organizationId: OrganizationId
  ): Promise<CampaignAsset> {
    const { data, error } = await this.supabase
      .from('campaign_assets')
      .update({ status })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single()
    if (error) throw new Error(`[DOGFOODING_REPO] updateCampaignAssetStatus: ${error.message}`)
    return toCampaignAsset(data as Record<string, unknown>)
  }

  async createCampaignScript(input: CreateCampaignScriptInput): Promise<CampaignScript> {
    const { data, error } = await this.supabase
      .from('campaign_scripts')
      .insert({
        organization_id: input.organizationId,
        campaign_id: input.campaignId,
        engagement_run_id: input.engagementRunId ?? null,
        digital_employee_id: input.digitalEmployeeId ?? null,
        model_provider: input.modelProvider ?? null,
        title: input.title,
        body: input.body,
        platform: input.platform ?? null,
        estimated_duration_sec: input.estimatedDurationSec ?? null,
        version: input.version ?? 1,
        parent_script_id: input.parentScriptId ?? null,
      })
      .select()
      .single()
    if (error) throw new Error(`[DOGFOODING_REPO] createCampaignScript: ${error.message}`)
    return toCampaignScript(data as Record<string, unknown>)
  }

  async listCampaignScripts(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<CampaignScript[]> {
    const { data, error } = await this.supabase
      .from('campaign_scripts')
      .select()
      .eq('campaign_id', campaignId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true })
    if (error) throw new Error(`[DOGFOODING_REPO] listCampaignScripts: ${error.message}`)
    return ((data as Record<string, unknown>[]) ?? []).map(toCampaignScript)
  }

  async createCampaignCaption(input: CreateCampaignCaptionInput): Promise<CampaignCaption> {
    const { data, error } = await this.supabase
      .from('campaign_captions')
      .insert({
        organization_id: input.organizationId,
        campaign_id: input.campaignId,
        engagement_run_id: input.engagementRunId ?? null,
        digital_employee_id: input.digitalEmployeeId ?? null,
        model_provider: input.modelProvider ?? null,
        platform: input.platform,
        body: input.body,
        character_count: input.characterCount ?? input.body.length,
        paired_asset_id: input.pairedAssetId ?? null,
        version: input.version ?? 1,
        parent_caption_id: input.parentCaptionId ?? null,
      })
      .select()
      .single()
    if (error) throw new Error(`[DOGFOODING_REPO] createCampaignCaption: ${error.message}`)
    return toCampaignCaption(data as Record<string, unknown>)
  }

  async listCampaignCaptions(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<CampaignCaption[]> {
    const { data, error } = await this.supabase
      .from('campaign_captions')
      .select()
      .eq('campaign_id', campaignId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true })
    if (error) throw new Error(`[DOGFOODING_REPO] listCampaignCaptions: ${error.message}`)
    return ((data as Record<string, unknown>[]) ?? []).map(toCampaignCaption)
  }

  async createCampaignHashtagSet(
    input: CreateCampaignHashtagSetInput
  ): Promise<CampaignHashtagSet> {
    const { data, error } = await this.supabase
      .from('campaign_hashtag_sets')
      .insert({
        organization_id: input.organizationId,
        campaign_id: input.campaignId,
        engagement_run_id: input.engagementRunId ?? null,
        digital_employee_id: input.digitalEmployeeId ?? null,
        model_provider: input.modelProvider ?? null,
        platform: input.platform,
        name: input.name,
        tags: input.tags,
        reach_tier: input.reachTier ?? 'mid',
      })
      .select()
      .single()
    if (error) throw new Error(`[DOGFOODING_REPO] createCampaignHashtagSet: ${error.message}`)
    return toCampaignHashtagSet(data as Record<string, unknown>)
  }

  async listCampaignHashtagSets(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<CampaignHashtagSet[]> {
    const { data, error } = await this.supabase
      .from('campaign_hashtag_sets')
      .select()
      .eq('campaign_id', campaignId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true })
    if (error) throw new Error(`[DOGFOODING_REPO] listCampaignHashtagSets: ${error.message}`)
    return ((data as Record<string, unknown>[]) ?? []).map(toCampaignHashtagSet)
  }

  async createCalendarSlot(input: CreateCampaignCalendarSlotInput): Promise<CampaignCalendarSlot> {
    const { data, error } = await this.supabase
      .from('campaign_calendar_slots')
      .insert({
        organization_id: input.organizationId,
        campaign_id: input.campaignId,
        scheduled_at: input.scheduledAt.toISOString(),
        platform: input.platform,
        asset_id: input.assetId ?? null,
        copy_variant_id: input.copyVariantId ?? null,
        caption_id: input.captionId ?? null,
        hashtag_set_id: input.hashtagSetId ?? null,
      })
      .select()
      .single()
    if (error) throw new Error(`[DOGFOODING_REPO] createCalendarSlot: ${error.message}`)
    return toCampaignCalendarSlot(data as Record<string, unknown>)
  }

  async listCalendarSlots(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<CampaignCalendarSlot[]> {
    const { data, error } = await this.supabase
      .from('campaign_calendar_slots')
      .select()
      .eq('campaign_id', campaignId)
      .eq('organization_id', organizationId)
      .order('scheduled_at', { ascending: true })
    if (error) throw new Error(`[DOGFOODING_REPO] listCalendarSlots: ${error.message}`)
    return ((data as Record<string, unknown>[]) ?? []).map(toCampaignCalendarSlot)
  }

  async createApprovalEvent(
    input: CreateCampaignApprovalEventInput
  ): Promise<CampaignApprovalEvent> {
    const { data, error } = await this.supabase
      .from('campaign_approval_events')
      .insert({
        organization_id: input.organizationId,
        campaign_id: input.campaignId,
        asset_type: input.assetType,
        asset_id: input.assetId,
        decision: input.decision,
        note: input.note ?? null,
        actor_type: input.actorType,
        actor_id: input.actorId,
        engagement_run_id: input.engagementRunId ?? null,
      })
      .select()
      .single()
    if (error) throw new Error(`[DOGFOODING_REPO] createApprovalEvent: ${error.message}`)
    return toCampaignApprovalEvent(data as Record<string, unknown>)
  }

  async listApprovalEvents(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<CampaignApprovalEvent[]> {
    const { data, error } = await this.supabase
      .from('campaign_approval_events')
      .select()
      .eq('campaign_id', campaignId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(`[DOGFOODING_REPO] listApprovalEvents: ${error.message}`)
    return ((data as Record<string, unknown>[]) ?? []).map(toCampaignApprovalEvent)
  }

  async createPublishEvent(input: CreateCampaignPublishEventInput): Promise<CampaignPublishEvent> {
    const { data, error } = await this.supabase
      .from('campaign_publish_events')
      .insert({
        organization_id: input.organizationId,
        campaign_id: input.campaignId,
        calendar_slot_id: input.calendarSlotId ?? null,
        asset_type: input.assetType,
        asset_id: input.assetId,
        platform: input.platform,
        action: input.action,
        actor_type: input.actorType,
        actor_id: input.actorId,
        live_post_url: input.livePostUrl ?? null,
      })
      .select()
      .single()
    if (error) throw new Error(`[DOGFOODING_REPO] createPublishEvent: ${error.message}`)
    return toCampaignPublishEvent(data as Record<string, unknown>)
  }

  async listPublishEvents(
    campaignId: string,
    organizationId: OrganizationId
  ): Promise<CampaignPublishEvent[]> {
    const { data, error } = await this.supabase
      .from('campaign_publish_events')
      .select()
      .eq('campaign_id', campaignId)
      .eq('organization_id', organizationId)
      .order('published_at', { ascending: false })
    if (error) throw new Error(`[DOGFOODING_REPO] listPublishEvents: ${error.message}`)
    return ((data as Record<string, unknown>[]) ?? []).map(toCampaignPublishEvent)
  }
}
