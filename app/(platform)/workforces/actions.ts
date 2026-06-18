'use server'

import { redirect } from 'next/navigation'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { workforceEngineService } from '@/domains/workforce-engine'
import type { DigitalEmployeeId, WorkforceId, WorkforceStatus } from '@/shared/types'

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
    workforceId: workforceId as WorkforceId,
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
    digitalEmployeeId: digitalEmployeeId as DigitalEmployeeId,
    organizationId: ctx.organizationId,
    responsibilities,
  })

  redirect('/workforces')
}
