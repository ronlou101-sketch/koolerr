import { NextResponse } from 'next/server'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { bootstrapPlatform } from '@/infrastructure/platform/bootstrap'
import { modelGateway } from '@/shared/model-gateway'
import { trustEngine } from '@/shared/trust'
import { env } from '@/shared/config/env'
import type { DigitalEmployeeId, EngagementRunId, WorkforceId } from '@/shared/types'

export const dynamic = 'force-dynamic'

const DE_ID = 'campaign-architect' as DigitalEmployeeId
const WORKFORCE_ID = 'campaign-architect-workforce' as WorkforceId
const ACTION = 'generate_campaign_strategy'

const SYSTEM_CONTEXT = `You are an expert marketing strategist for local service businesses.
Generate focused, practical campaign strategies. Always respond with valid JSON only — no markdown, no explanation.`

function buildPrompt(goal: string, businessType: string, locationSummary: string): string {
  return `Generate a complete campaign strategy for a ${businessType} business.

Campaign goal: ${goal}
Service area: ${locationSummary}

Return ONLY valid JSON matching this exact schema:
{
  "primaryGoal": "one clear sentence stating the specific measurable goal for a ${businessType}",
  "targetAudience": "specific description of the ideal customer: who they are, their situation, why they need this service",
  "coreMessage": "the single most compelling message to reach this audience and drive action",
  "recommendedOffer": "a concrete, specific offer that directly drives the campaign goal",
  "contentPillars": ["short label 1", "short label 2", "short label 3", "short label 4"],
  "postingFrequency": "N posts/week",
  "campaignLength": "NN days",
  "toneOfVoice": ["tone 1", "tone 2", "tone 3"],
  "successMetrics": ["metric 1", "metric 2", "metric 3", "metric 4"]
}

Content pillar examples: "Before & After", "Customer Stories", "Tips & Education", "Behind the Scenes", "Seasonal Offers". Use 3–5 short labels.
Tone examples: "Professional", "Friendly", "Trustworthy", "Urgent", "Empathetic". Use 2–4.
Success metrics should be specific and measurable for a ${businessType}: calls, form submissions, bookings, website visits, reviews, etc.`
}

export async function POST(request: Request) {
  const ctx = await getRequestPlatformContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await bootstrapPlatform()

  // Register a trust rule for campaign strategy generation if not already in memory.
  // This action is always founder-initiated — no customer approval gating required.
  const existingRules = trustEngine.rulesFor(DE_ID)
  if (!existingRules.some((r) => r.action === ACTION)) {
    trustEngine.registerRule({
      id: `rule_campaign_architect_generate`,
      organizationId: ctx.organizationId,
      digitalEmployeeId: DE_ID,
      action: ACTION,
      requiresApproval: false,
      autonomyLevel: 'supervised',
    })
  }

  let body: {
    goal?: unknown
    businessType?: unknown
    coverageType?: unknown
    locationSummary?: unknown
  }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const goal = typeof body.goal === 'string' ? body.goal.trim() : ''
  const businessType = typeof body.businessType === 'string' ? body.businessType.trim() : ''
  if (!goal || !businessType) {
    return NextResponse.json({ error: 'goal and businessType are required' }, { status: 400 })
  }
  const locationSummary =
    typeof body.locationSummary === 'string' && body.locationSummary.trim()
      ? body.locationSummary.trim()
      : 'local area'

  const tenantId = env.platform.tenantId()
  const runId = `campaign_strategy_${Date.now()}` as EngagementRunId

  try {
    const response = await modelGateway.invoke({
      tenantId,
      organizationId: ctx.organizationId,
      workforceId: WORKFORCE_ID,
      digitalEmployeeId: DE_ID,
      engagementRunId: runId,
      action: ACTION,
      systemContext: SYSTEM_CONTEXT,
      prompt: buildPrompt(goal, businessType, locationSummary),
      model: 'claude-haiku-4-5-20251001',
      maxTokens: 1200,
    })

    // Extract JSON block in case the model adds any surrounding text
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI did not return a valid strategy' }, { status: 500 })
    }

    let strategy: unknown
    try {
      strategy = JSON.parse(jsonMatch[0])
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response as JSON' }, { status: 500 })
    }

    return NextResponse.json({ strategy })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
