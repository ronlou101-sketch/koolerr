'use server'

import { redirect } from 'next/navigation'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { workforceEngineService } from '@/domains/workforce-engine'
import { asDigitalEmployeeId, asWorkforceId } from '@/shared/types'
import type { WorkforceStatus } from '@/shared/types'

export async function updateWorkforceGoalsAction(formData: FormData) {
  const ctx = await getRequestPlatformContext()
  if (!ctx || ctx.actor.type !== 'user') return

  const workforceId = formData.get('workforceId') as string
  const goalsRaw = formData.get('goals') as string | null
  const statusRaw = formData.get('status') as string | null

  if (!workforceId) return

  const goals = goalsRaw
    ? goalsRaw
        .split('\n')
        .map((g) => g.trim())
        .filter(Boolean)
    : undefined

  const status =
    statusRaw === 'active' || statusRaw === 'inactive' ? (statusRaw as WorkforceStatus) : undefined

  await workforceEngineService.updateWorkforce({
    tenantId: ctx.tenantId,
    workforceId: asWorkforceId(workforceId),
    organizationId: ctx.organizationId,
    goals,
    status,
  })

  redirect('/workforces')
}

export async function updateDigitalEmployeeAction(formData: FormData) {
  const ctx = await getRequestPlatformContext()
  if (!ctx || ctx.actor.type !== 'user') return

  const digitalEmployeeId = formData.get('digitalEmployeeId') as string
  const responsibilitiesRaw = formData.get('responsibilities') as string | null

  if (!digitalEmployeeId) return

  const responsibilities = responsibilitiesRaw
    ? responsibilitiesRaw
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean)
    : undefined

  await workforceEngineService.updateDigitalEmployee({
    tenantId: ctx.tenantId,
    digitalEmployeeId: asDigitalEmployeeId(digitalEmployeeId),
    organizationId: ctx.organizationId,
    responsibilities,
  })

  redirect('/workforces')
}
