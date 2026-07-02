import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { workforceEngineService } from '@/domains/workforce-engine'
import { executeCTOEngagementRun } from '@/infrastructure/cto-workforce'
import { PlatformErrorCode } from '@/shared/types'
import type { WorkforceId } from '@/shared/types'
import { CTO_BUSINESS_FUNCTION } from '@/infrastructure/cto-workforce'

/**
 * POST /api/cto-runs — Trigger a CTO Agent Engagement Run.
 *
 * Body: { objective: string }
 * Response: { engagementRunId, deliverableId, deliverableType }
 *
 * Atlas analyzes the objective, loads its Business Brain context, invokes
 * the Model Gateway (Trust Engine enforced), and returns a Deliverable.
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

  const workforcesResult = await workforceEngineService.listWorkforces(ctx.organizationId)
  if (!workforcesResult.ok) {
    return NextResponse.json(
      { error: 'Failed to load workforces: ' + workforcesResult.error.message },
      { status: 500 }
    )
  }

  const ctoWorkforce = workforcesResult.value.find(
    (w) => w.businessFunction === CTO_BUSINESS_FUNCTION
  )
  if (!ctoWorkforce) {
    return NextResponse.json(
      { error: 'CTO Workforce not found — provision it first' },
      { status: 404 }
    )
  }

  const runsResult = await workforceEngineService.listEngagementRuns(ctx.organizationId)
  if (runsResult.ok) {
    const hasActiveRun = runsResult.value.some(
      (r) => r.workforceId === ctoWorkforce.id && (r.status === 'pending' || r.status === 'running')
    )
    if (hasActiveRun) {
      return NextResponse.json(
        { error: 'A run is already in progress for this workforce. Wait for it to complete.' },
        { status: 429 }
      )
    }
  }

  try {
    const result = await executeCTOEngagementRun(ctx, ctoWorkforce.id as WorkforceId, objective)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const isBillingError =
      error instanceof Error &&
      (error as Error & { code?: string }).code === PlatformErrorCode.BILLING_ERROR
    return NextResponse.json({ error: String(error) }, { status: isBillingError ? 402 : 500 })
  }
}
