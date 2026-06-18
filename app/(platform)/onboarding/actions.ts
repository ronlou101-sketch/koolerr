'use server'

import { getRequestPlatformContext } from '@/infrastructure/auth'
import { businessBrainService } from '@/domains/business-brain'
import { env } from '@/shared/config/env'
import type { TenantId } from '@/shared/types'

/**
 * Business Brain onboarding server actions.
 *
 * Each action saves one category of structured Business Memory.
 * Called sequentially by the onboarding wizard as the customer completes each step.
 * All writes go through businessBrainService.storeMemory() — the only approved
 * path for writing to the Business Brain from outside the Workforce Engine.
 */

function tenantId(): TenantId {
  return env.platform.tenantId() as TenantId
}

export async function saveCompanyIdentity(data: {
  description: string
  mission: string
}): Promise<{ success: boolean; error?: string }> {
  const ctx = await getRequestPlatformContext()
  if (!ctx) return { success: false, error: 'Not authenticated' }

  const result = await businessBrainService.storeMemory({
    tenantId: tenantId(),
    organizationId: ctx.organizationId,
    memory: {
      organizationId: ctx.organizationId,
      type: 'company_identity',
      content: {
        description: data.description.trim(),
        mission: data.mission.trim(),
      },
      source: 'onboarding',
      relevanceScope: ['all'],
    },
  })

  if (!result.ok) return { success: false, error: result.error.message }
  return { success: true }
}

export async function saveBrandVoice(data: {
  tone: string
  audience: string
  guidelines: string
}): Promise<{ success: boolean; error?: string }> {
  const ctx = await getRequestPlatformContext()
  if (!ctx) return { success: false, error: 'Not authenticated' }

  const result = await businessBrainService.storeMemory({
    tenantId: tenantId(),
    organizationId: ctx.organizationId,
    memory: {
      organizationId: ctx.organizationId,
      type: 'brand',
      content: {
        tone: data.tone,
        targetAudience: data.audience.trim(),
        writingGuidelines: data.guidelines.trim() || undefined,
      },
      source: 'onboarding',
      relevanceScope: ['all', 'content_marketing'],
    },
  })

  if (!result.ok) return { success: false, error: result.error.message }
  return { success: true }
}

export async function saveProduct(data: {
  name: string
  description: string
}): Promise<{ success: boolean; error?: string }> {
  const ctx = await getRequestPlatformContext()
  if (!ctx) return { success: false, error: 'Not authenticated' }

  const result = await businessBrainService.storeMemory({
    tenantId: tenantId(),
    organizationId: ctx.organizationId,
    memory: {
      organizationId: ctx.organizationId,
      type: 'product',
      content: {
        name: data.name.trim(),
        description: data.description.trim(),
      },
      source: 'onboarding',
      relevanceScope: ['all'],
    },
  })

  if (!result.ok) return { success: false, error: result.error.message }
  return { success: true }
}
