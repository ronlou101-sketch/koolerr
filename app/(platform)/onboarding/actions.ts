'use server'

import { after } from 'next/server'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { businessBrainService } from '@/domains/business-brain'
import { workforceEngineService } from '@/domains/workforce-engine'
import { runAIWorkforcePipeline } from '@/infrastructure/ai-workforce/pipeline'
import { buildBusinessProfileFromMemories } from '@/infrastructure/ai-workforce/build-profile'
import { env } from '@/shared/config/env'
import { isRunLimitReached } from './_lib/run-rate-limit'

/**
 * Business Brain onboarding server actions.
 *
 * saveBusinessProfile — comprehensive AI Workforce wizard (single call, all sections).
 * triggerAIWorkforce  — creates an engagement run and starts the 7-department pipeline.
 */

function tenantId() {
  return env.platform.tenantId()
}

export interface CustomerProfile {
  businessName: string
  businessCategory: string
  industry: string
  location: string
  website?: string
  primaryService: string
  additionalServices?: string
  serviceArea?: string
  targetAudience: string
  idealCustomer?: string
  brandVoice: string
  brandPersonality?: string
  competitiveAdvantages?: string
  businessGoals: string
  preferredPlatforms: string[]
  facebookUrl?: string
  instagramUrl?: string
  tiktokUrl?: string
  youtubeUrl?: string
  linkedinUrl?: string
  googleBusinessUrl?: string
  contactEmail?: string
  contactPhone?: string
  logoUrl?: string
  additionalNotes?: string
}

export async function saveBusinessProfile(
  data: CustomerProfile
): Promise<{ success: boolean; error?: string }> {
  const ctx = await getRequestPlatformContext()
  if (!ctx) return { success: false, error: 'Not authenticated' }

  if (!data.businessName?.trim()) {
    return { success: false, error: 'businessName is required' }
  }
  if (!data.businessCategory?.trim()) {
    return { success: false, error: 'businessCategory is required' }
  }

  const result = await businessBrainService.storeMemory({
    tenantId: tenantId(),
    organizationId: ctx.organizationId,
    memory: {
      organizationId: ctx.organizationId,
      type: 'company_identity',
      content: { ...data },
      source: 'ai-workforce-wizard',
      relevanceScope: ['all', 'ai-workforce'],
    },
  })

  if (!result.ok) return { success: false, error: result.error.message }
  return { success: true }
}

export async function triggerAIWorkforce(): Promise<{
  success: boolean
  engagementRunId?: string
  error?: string
}> {
  const ctx = await getRequestPlatformContext()
  if (!ctx) return { success: false, error: 'Not authenticated' }

  const profile = await buildBusinessProfileFromMemories(ctx.organizationId)
  if (!profile || !profile.businessName) {
    return { success: false, error: 'Business profile not found. Complete the wizard first.' }
  }

  const workforcesResult = await workforceEngineService.listWorkforces(ctx.organizationId)
  if (!workforcesResult.ok) {
    return { success: false, error: 'Failed to retrieve workforces' }
  }

  const workforce = workforcesResult.value.find((w) => w.businessFunction === 'Content Marketing')
  if (!workforce) {
    return { success: false, error: 'No workforce found for this organization' }
  }

  // Guard against runaway AI provider spend from repeated triggers. Enforce a
  // per-organization rolling 24h run limit. Fails open on a read error so a
  // transient outage never blocks a legitimate customer.
  const existingRunsResult = await workforceEngineService.listEngagementRuns(ctx.organizationId)
  if (existingRunsResult.ok) {
    const limit = env.pipeline.dailyRunLimit()
    if (isRunLimitReached(existingRunsResult.value, new Date(), limit)) {
      return {
        success: false,
        error: `Daily pipeline limit reached (${limit} runs per 24 hours). Please try again tomorrow or contact support to raise your limit.`,
      }
    }
  }

  const tid = tenantId()
  const runResult = await workforceEngineService.triggerEngagementRun({
    tenantId: tid,
    workforceId: workforce.id,
    organizationId: ctx.organizationId,
    objective: `AI Workforce: Full content production for ${profile.businessName}`,
    context: { type: 'ai-workforce-pipeline', businessName: profile.businessName },
  })

  if (!runResult.ok) {
    return { success: false, error: 'Failed to create engagement run' }
  }

  const engagementRunId = runResult.value.id

  after(() =>
    runAIWorkforcePipeline(
      {
        tenantId: tid,
        organizationId: ctx.organizationId,
        workforceId: workforce.id,
        engagementRunId,
      },
      profile
    )
  )

  return { success: true, engagementRunId }
}
