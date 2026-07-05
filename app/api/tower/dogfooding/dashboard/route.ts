import { NextResponse } from 'next/server'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { bootstrapPlatform } from '@/infrastructure/platform/bootstrap'
import { dogfoodingService } from '@/domains/dogfooding'
import { businessBrainService } from '@/domains/business-brain'

export const dynamic = 'force-dynamic'

export async function GET() {
  const ctx = await getRequestPlatformContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await bootstrapPlatform()

  const [objectivesResult, campaignsResult, copyVariantsResult, creativesResult, learningsResult] =
    await Promise.all([
      dogfoodingService.listObjectives(ctx.organizationId),
      dogfoodingService.listCampaigns(ctx.organizationId),
      dogfoodingService.listAllCopyVariants(ctx.organizationId),
      dogfoodingService.listAllCreatives(ctx.organizationId),
      dogfoodingService.listLearnings(ctx.organizationId),
    ])

  const objectives = objectivesResult.ok ? objectivesResult.value : []
  const campaigns = campaignsResult.ok ? campaignsResult.value : []
  const copyVariants = copyVariantsResult.ok ? copyVariantsResult.value : []
  const creatives = creativesResult.ok ? creativesResult.value : []
  const learnings = learningsResult.ok ? learningsResult.value : []

  const memoriesResult = await businessBrainService.listAllMemories(ctx.organizationId)
  const activity = memoriesResult.ok
    ? memoriesResult.value
        .filter((m) => {
          const c = m.content as Record<string, unknown>
          return typeof c?.domain === 'string' && c.domain.startsWith('dogfooding')
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 30)
    : []

  const stats = {
    totalObjectives: objectives.length,
    activeObjectives: objectives.filter((o) => o.status === 'active').length,
    draftObjectives: objectives.filter((o) => o.status === 'draft').length,
    totalCampaigns: campaigns.length,
    readyCampaigns: campaigns.filter((c) => c.status === 'ready').length,
    totalCopyVariants: copyVariants.length,
    totalCreatives: creatives.length,
    totalLearnings: learnings.length,
  }

  return NextResponse.json({
    stats,
    objectives,
    campaigns,
    copyVariants: copyVariants.slice(0, 20),
    creatives: creatives.slice(0, 20),
    learnings,
    activity,
  })
}
