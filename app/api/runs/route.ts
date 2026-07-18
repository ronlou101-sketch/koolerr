import { NextResponse } from 'next/server'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { workforceEngineService } from '@/domains/workforce-engine'

/**
 * GET /api/runs — List Engagement Runs for the authenticated Organization.
 */
export async function GET() {
  const ctx = await getRequestPlatformContext()
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await workforceEngineService.listEngagementRuns(ctx.organizationId)
  if (!result.ok) {
    return NextResponse.json({ error: result.error.message }, { status: 500 })
  }

  return NextResponse.json({ runs: result.value })
}
