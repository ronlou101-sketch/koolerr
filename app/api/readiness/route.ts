import { NextResponse } from 'next/server'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { businessBrainService } from '@/domains/business-brain'
import { workforceEngineService } from '@/domains/workforce-engine'

/**
 * GET /api/readiness
 *
 * Returns V1 operational readiness for the current organization.
 * Checks: Business Brain has at least 1 memory; at least 1 active Workforce.
 * Always returns 200 — degrades gracefully when services fail rather than throwing.
 */
export async function GET() {
  const ctx = await getRequestPlatformContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [memoryResult, workforceResult] = await Promise.all([
    businessBrainService.queryMemory({ organizationId: ctx.organizationId, limit: 1 }),
    workforceEngineService.listWorkforces(ctx.organizationId),
  ])

  const brainConfigured = memoryResult.ok && memoryResult.value.totalCount > 0
  const workforceActive =
    workforceResult.ok && workforceResult.value.some((w) => w.status === 'active')

  const ready = brainConfigured && workforceActive

  const missingItems: string[] = []
  if (!brainConfigured) missingItems.push('Business Brain not configured — complete onboarding')
  if (!workforceActive) missingItems.push('No active workforce registered')

  return NextResponse.json({
    ready,
    checks: { brainConfigured, workforceActive },
    missingItems,
  })
}
