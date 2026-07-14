import { NextResponse } from 'next/server'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { bootstrapPlatform } from '@/infrastructure/platform/bootstrap'
import { dogfoodingService } from '@/domains/dogfooding'

export const dynamic = 'force-dynamic'

interface ApproveBody {
  assetType: 'ad_copy_variant' | 'creative'
  assetId: string
  decision: 'approved' | 'rejected'
  note?: string | null
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await params
  const ctx = await getRequestPlatformContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: ApproveBody
  try {
    body = (await request.json()) as ApproveBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { assetType, assetId, decision, note = null } = body

  if (!assetId || (decision !== 'approved' && decision !== 'rejected')) {
    return NextResponse.json({ error: 'Missing or invalid assetId or decision' }, { status: 400 })
  }

  await bootstrapPlatform()

  if (assetType === 'ad_copy_variant') {
    const result =
      decision === 'approved'
        ? await dogfoodingService.approveAdCopyVariant(assetId, note, ctx.organizationId)
        : await dogfoodingService.rejectAdCopyVariant(assetId, note, ctx.organizationId)

    if (!result.ok) {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }
    return NextResponse.json({ asset: result.value })
  }

  if (assetType === 'creative') {
    const result =
      decision === 'approved'
        ? await dogfoodingService.approveCreative(assetId, note, ctx.organizationId)
        : await dogfoodingService.rejectCreative(assetId, note, ctx.organizationId)

    if (!result.ok) {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }
    return NextResponse.json({ asset: result.value })
  }

  return NextResponse.json({ error: 'Unknown assetType' }, { status: 400 })
}
