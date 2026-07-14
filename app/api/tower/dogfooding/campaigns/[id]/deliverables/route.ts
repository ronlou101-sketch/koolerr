import { NextResponse } from 'next/server'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { bootstrapPlatform } from '@/infrastructure/platform/bootstrap'
import { dogfoodingService } from '@/domains/dogfooding'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getRequestPlatformContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await bootstrapPlatform()

  const [
    assetsResult,
    scriptsResult,
    captionsResult,
    hashtagSetsResult,
    calendarSlotsResult,
    approvalEventsResult,
    publishEventsResult,
  ] = await Promise.all([
    dogfoodingService.listCampaignAssets(id, ctx.organizationId),
    dogfoodingService.listCampaignScripts(id, ctx.organizationId),
    dogfoodingService.listCampaignCaptions(id, ctx.organizationId),
    dogfoodingService.listCampaignHashtagSets(id, ctx.organizationId),
    dogfoodingService.listCalendarSlots(id, ctx.organizationId),
    dogfoodingService.listApprovalEvents(id, ctx.organizationId),
    dogfoodingService.listPublishEvents(id, ctx.organizationId),
  ])

  return NextResponse.json({
    assets: assetsResult.ok ? assetsResult.value : [],
    scripts: scriptsResult.ok ? scriptsResult.value : [],
    captions: captionsResult.ok ? captionsResult.value : [],
    hashtagSets: hashtagSetsResult.ok ? hashtagSetsResult.value : [],
    calendarSlots: calendarSlotsResult.ok ? calendarSlotsResult.value : [],
    approvalEvents: approvalEventsResult.ok ? approvalEventsResult.value : [],
    publishEvents: publishEventsResult.ok ? publishEventsResult.value : [],
  })
}
