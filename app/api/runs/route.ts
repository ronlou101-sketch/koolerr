import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { workforceEngineService } from '@/domains/workforce-engine'
import { executeContentEngagementRun } from '@/infrastructure/content-workforce'
import { PlatformErrorCode } from '@/shared/types'
import type { WorkforceId } from '@/shared/types'

/**
 * POST /api/runs — Trigger a Content Engagement Run.
 *
 * Body: { objective: string }
 * Response: { engagementRunId, deliverableId }
 *
 * Resolves the caller's PlatformContext, finds the Content Workforce for
 * their Organization, then runs the full 3-step content workflow synchronously.
 * Returns the resulting Deliverable ID for the review UI.
 */
export async function POST(request: NextRequest) {
  const ctx = await getRequestPlatformContext()
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { objective?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const objective = body.objective?.trim()
  if (!objective) {
    return NextResponse.json({ error: 'objective is required' }, { status: 400 })
  }

  // Find the Content Workforce for this organization.
  const workforcesResult = await workforceEngineService.listWorkforces(ctx.organizationId)
  if (!workforcesResult.ok) {
    return NextResponse.json(
      { error: 'Failed to load workforces: ' + workforcesResult.error.message },
      { status: 500 }
    )
  }

  const contentWorkforce = workforcesResult.value.find(
    (w) => w.businessFunction === 'Content Marketing'
  )
  if (!contentWorkforce) {
    return NextResponse.json(
      { error: 'No Content Workforce found for this organization' },
      { status: 404 }
    )
  }

  const runsResult = await workforceEngineService.listEngagementRuns(ctx.organizationId)
  if (runsResult.ok) {
    const hasActiveRun = runsResult.value.some(
      (r) =>
        r.workforceId === contentWorkforce.id && (r.status === 'pending' || r.status === 'running')
    )
    if (hasActiveRun) {
      return NextResponse.json(
        { error: 'A run is already in progress for this workforce. Wait for it to complete.' },
        { status: 429 }
      )
    }
  }

  try {
    const result = await executeContentEngagementRun(
      ctx,
      contentWorkforce.id as WorkforceId,
      objective
    )
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const isBillingError =
      error instanceof Error &&
      (error as Error & { code?: string }).code === PlatformErrorCode.BILLING_ERROR
    return NextResponse.json({ error: String(error) }, { status: isBillingError ? 402 : 500 })
  }
}

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
