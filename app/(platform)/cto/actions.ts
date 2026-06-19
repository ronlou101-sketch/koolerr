'use server'

import { redirect } from 'next/navigation'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { workforceEngineService } from '@/domains/workforce-engine'
import { executeCTOEngagementRun, seedCTOContext } from '@/infrastructure/cto-workforce'
import { CTO_BUSINESS_FUNCTION } from '@/infrastructure/cto-workforce'
import type { WorkforceId } from '@/shared/types'

export async function triggerCTORunAction(formData: FormData) {
  const ctx = await getRequestPlatformContext()
  if (!ctx || ctx.actor.type !== 'user') return

  const objective = (formData.get('objective') as string | null)?.trim()
  if (!objective) return

  const workforcesResult = await workforceEngineService.listWorkforces(ctx.organizationId)
  if (!workforcesResult.ok) return

  const ctoWorkforce = workforcesResult.value.find(
    (w) => w.businessFunction === CTO_BUSINESS_FUNCTION
  )
  if (!ctoWorkforce) return

  const result = await executeCTOEngagementRun(ctx, ctoWorkforce.id as WorkforceId, objective)

  redirect(`/deliverables/${result.deliverableId}`)
}

export async function refreshCTOContextAction() {
  const ctx = await getRequestPlatformContext()
  if (!ctx || ctx.actor.type !== 'user') return

  await seedCTOContext(ctx.organizationId, ctx.tenantId, true)
  redirect('/cto')
}
