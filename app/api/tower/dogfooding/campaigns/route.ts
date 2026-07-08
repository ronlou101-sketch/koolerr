import { NextResponse } from 'next/server'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { bootstrapPlatform } from '@/infrastructure/platform/bootstrap'
import { dogfoodingService } from '@/domains/dogfooding'
import type { ObjectiveGoalType } from '@/domains/dogfooding'

export const dynamic = 'force-dynamic'

export async function GET() {
  const ctx = await getRequestPlatformContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await bootstrapPlatform()

  const result = await dogfoodingService.listCampaigns(ctx.organizationId)
  if (!result.ok) {
    return NextResponse.json({ error: result.error.message }, { status: 500 })
  }

  return NextResponse.json({ campaigns: result.value })
}

const GOAL_TYPE_MAP: Record<string, ObjectiveGoalType> = {
  'More Leads': 'lead_generation',
  'More Calls': 'lead_generation',
  'More Appointments': 'lead_generation',
  'Brand Awareness': 'brand_awareness',
  'Promote a Service': 'revenue',
  'Special Offer': 'revenue',
  'Customer Retention': 'retention',
  'Seasonal Campaign': 'revenue',
  'Something Else': 'revenue',
}

export async function POST(request: Request) {
  const ctx = await getRequestPlatformContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await bootstrapPlatform()

  let body: {
    goal?: unknown
    businessType?: unknown
    locationSummary?: unknown
    strategy?: unknown
  }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const goal = typeof body.goal === 'string' ? body.goal.trim() : ''
  const businessType = typeof body.businessType === 'string' ? body.businessType.trim() : ''
  const locationSummary =
    typeof body.locationSummary === 'string' && body.locationSummary.trim()
      ? body.locationSummary.trim()
      : 'local area'

  if (!goal || !businessType) {
    return NextResponse.json({ error: 'goal and businessType are required' }, { status: 400 })
  }
  if (!body.strategy || typeof body.strategy !== 'object' || Array.isArray(body.strategy)) {
    return NextResponse.json({ error: 'strategy is required' }, { status: 400 })
  }

  const strategy = body.strategy as Record<string, unknown>
  const primaryGoal =
    typeof strategy.primaryGoal === 'string' ? strategy.primaryGoal : `${goal} for ${businessType}`
  const targetAudienceText =
    typeof strategy.targetAudience === 'string' ? strategy.targetAudience : ''

  const goalType: ObjectiveGoalType = GOAL_TYPE_MAP[goal] ?? 'lead_generation'

  // Create objective first — campaign requires an objectiveId
  const objectiveResult = await dogfoodingService.createObjective({
    organizationId: ctx.organizationId,
    title: `${businessType} — ${goal}`,
    description: primaryGoal,
    goalType,
    targetAudience: targetAudienceText || undefined,
    successMetrics: Array.isArray(strategy.successMetrics)
      ? (strategy.successMetrics as string[])
      : undefined,
  })

  if (!objectiveResult.ok) {
    return NextResponse.json({ error: objectiveResult.error.message }, { status: 500 })
  }

  const objective = objectiveResult.value

  // Store the AI strategy fields in targetAudience so the detail page can display them
  const campaignResult = await dogfoodingService.createCampaign({
    organizationId: ctx.organizationId,
    objectiveId: objective.id,
    planId: null,
    name: `${businessType} — ${goal} (${locationSummary})`,
    objectiveSummary: primaryGoal,
    targetAudience: {
      description: targetAudienceText,
      coreMessage: typeof strategy.coreMessage === 'string' ? strategy.coreMessage : '',
      recommendedOffer:
        typeof strategy.recommendedOffer === 'string' ? strategy.recommendedOffer : '',
      contentPillars: Array.isArray(strategy.contentPillars) ? strategy.contentPillars : [],
      postingFrequency:
        typeof strategy.postingFrequency === 'string' ? strategy.postingFrequency : '',
      campaignLength: typeof strategy.campaignLength === 'string' ? strategy.campaignLength : '',
      toneOfVoice: Array.isArray(strategy.toneOfVoice) ? strategy.toneOfVoice : [],
    },
    budgetCents: 0,
    startDate: null,
    endDate: null,
    channels: [],
    status: 'planning',
    metaCampaignId: null,
    engagementRunId: null,
  })

  if (!campaignResult.ok) {
    return NextResponse.json({ error: campaignResult.error.message }, { status: 500 })
  }

  return NextResponse.json({ campaignId: campaignResult.value.id }, { status: 201 })
}
