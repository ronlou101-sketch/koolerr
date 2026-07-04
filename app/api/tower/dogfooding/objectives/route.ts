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

  const result = await dogfoodingService.listObjectives(ctx.organizationId)
  if (!result.ok) {
    return NextResponse.json({ error: result.error.message }, { status: 500 })
  }

  return NextResponse.json({ objectives: result.value })
}

export async function POST(request: Request) {
  const ctx = await getRequestPlatformContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await bootstrapPlatform()

  let body: {
    title?: unknown
    description?: unknown
    goalType?: unknown
    targetAudience?: unknown
    successMetrics?: unknown
    budgetCents?: unknown
  }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }
  if (!body.description || typeof body.description !== 'string' || !body.description.trim()) {
    return NextResponse.json({ error: 'description is required' }, { status: 400 })
  }

  const validGoalTypes: ObjectiveGoalType[] = [
    'brand_awareness',
    'lead_generation',
    'user_acquisition',
    'retention',
    'revenue',
  ]
  if (!body.goalType || !validGoalTypes.includes(body.goalType as ObjectiveGoalType)) {
    return NextResponse.json(
      { error: `goalType must be one of: ${validGoalTypes.join(', ')}` },
      { status: 400 }
    )
  }

  const result = await dogfoodingService.createObjective({
    organizationId: ctx.organizationId,
    title: (body.title as string).trim(),
    description: (body.description as string).trim(),
    goalType: body.goalType as ObjectiveGoalType,
    targetAudience: typeof body.targetAudience === 'string' ? body.targetAudience : undefined,
    successMetrics: Array.isArray(body.successMetrics)
      ? (body.successMetrics as string[])
      : undefined,
    budgetCents: typeof body.budgetCents === 'number' ? body.budgetCents : undefined,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error.message }, { status: 500 })
  }

  return NextResponse.json({ objective: result.value }, { status: 201 })
}
