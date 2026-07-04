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

  const campaignsResult = await dogfoodingService.listCampaigns(ctx.organizationId)
  if (!campaignsResult.ok) {
    return NextResponse.json({ error: 'Failed to load campaigns' }, { status: 500 })
  }

  const campaign = campaignsResult.value.find((c) => c.id === id)
  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  const [copyResult, creativesResult] = await Promise.all([
    dogfoodingService.listAdCopyVariants(id, ctx.organizationId),
    dogfoodingService.listCreatives(id, ctx.organizationId),
  ])

  return NextResponse.json({
    campaign,
    copyVariants: copyResult.ok ? copyResult.value : [],
    creatives: creativesResult.ok ? creativesResult.value : [],
  })
}
