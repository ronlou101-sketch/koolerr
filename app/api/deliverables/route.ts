import { NextResponse } from 'next/server'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { deliverablesService } from '@/domains/deliverables'
import type { DeliverableType } from '@/shared/types'

const MEDIA_TYPES = new Set<DeliverableType>(['video_script', 'video', 'image'])

export async function GET(request: Request) {
  const ctx = await getRequestPlatformContext()
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const typeParam = searchParams.get('type') as DeliverableType | null
  const typeFilter = typeParam && MEDIA_TYPES.has(typeParam) ? typeParam : undefined

  const result = await deliverablesService.listDeliverables({
    organizationId: ctx.organizationId,
    type: typeFilter,
  })

  if (!result.ok) {
    return NextResponse.json({ error: 'Failed to load deliverables' }, { status: 500 })
  }

  // When no type filter is given, restrict the response to media types only.
  const deliverables = typeFilter
    ? result.value
    : result.value.filter((d) => MEDIA_TYPES.has(d.type))

  return NextResponse.json({ deliverables })
}
